(() => {
  const ASPECT_MAP = {
    "9:16": { w: 9, h: 16, res: "1080×1920" },
    "16:9": { w: 16, h: 9, res: "1920×1080" },
    "1:1":  { w: 1, h: 1, res: "1080×1080" },
    "4:5":  { w: 4, h: 5, res: "1080×1350" }
  };

  const TRACK_META = [
    { key: "shots", label: "Video / Cảnh", color: "#0ea5e9" },
    { key: "vfx", label: "Hiệu ứng (VFX)", color: "#f97316" },
    { key: "extraText", label: "Chữ thêm", color: "#ec4899" },
    { key: "graphics", label: "Graphic", color: "#8b5cf6" },
    { key: "subtitles", label: "Phụ đề", color: "#10b981" },
    { key: "brolls", label: "B-roll (PiP)", color: "#06b6d4" },
    { key: "audio", label: "Âm thanh / SFX", color: "#f59e0b" }
  ];

  const state = {
    project: null,
    library: {
      aspectRatios: [],
      sfx: [],
      luts: [],
      filters: [],
      graphics: [],
      textStyles: [],
      fonts: [],
      transitions: [],
      uploads: []
    },
    history: [],
    undoStack: [],
    redoStack: [],
    activeTab: "media",
    subFilter: "all",
    searchQuery: "",
    inspectorTab: "props",
    selected: null,
    currentTime: 0,
    isPlaying: false,
    isMuted: false,
    snapEnabled: true,
    pxPerSec: 40,
    safeZone: false,
    faceGuide: false,
    testPattern: false,
    lastFrameTs: 0,
    previewAudio: null,
    activeAudioPlayers: new Map(),
    saveTimer: null
  };

  const $ = (id) => document.getElementById(id);
  const elMainVideo = $("main-video");
  const elBrollVideo = $("broll-video");
  const elStageFrame = $("stage-frame");
  const elStageViewport = $("stage-viewport");
  const elVideoFilterWrap = $("video-filter-wrap");
  const elVfxLayer = $("vfx-overlay-layer");
  const elVignetteOverlay = $("vignette-overlay");
  const elFadeOverlay = $("fade-overlay");
  const elTransitionOverlay = $("transition-overlay");
  const elStageOverlay = $("stage-overlay");
  const elSubtitleOverlay = $("subtitle-overlay");
  const elEmptyOverlay = $("empty-stage-overlay");
  const elTestPattern = $("test-pattern-layer");
  const elPlayhead = $("tl-playhead");
  const elTlCanvas = $("tl-canvas");
  const elTlRuler = $("tl-ruler");
  const elTlLanes = $("tl-lanes");
  const elTlScroll = $("tl-scroll-area");

  function toast(msg, type = "info") {
    const container = $("toast-container");
    const node = document.createElement("div");
    node.className = `toast ${type}`;
    node.textContent = msg;
    container.appendChild(node);
    setTimeout(() => node.remove(), 3400);
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function escapeAttr(s) { return escapeHtml(s); }
  function toHexColor(c, fb = "#ffffff") {
    return /^#[0-9a-f]{6}$/i.test(String(c || "")) ? c : fb;
  }

  function fmtTime(sec) {
    const s = Math.max(0, Number(sec) || 0);
    const m = Math.floor(s / 60);
    const rem = (s % 60).toFixed(1).padStart(4, "0");
    return `${String(m).padStart(2, "0")}:${rem}`;
  }

  function normalizeProject(p) {
    if (!p) return p;
    p.version = 4;
    p.themeMode = p.themeMode || "dark";
    p.aspectRatio = ASPECT_MAP[p.aspectRatio] ? p.aspectRatio : "9:16";
    p.playbackRate = Number(p.playbackRate) || 1.0;
    p.brandColors = Object.assign(
      { primary: "#38bdf8", secondary: "#a855f7", accent: "#f59e0b", bg: "#0f172a", text: "#f8fafc" },
      p.brandColors || {}
    );
    p.colorGrade = Object.assign(
      { lut: "none", brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, vignette: 0, sharpen: 0, blur: 0 },
      p.colorGrade || {}
    );
    p.activeFilters = Array.isArray(p.activeFilters) ? p.activeFilters : [];
    p.mediaPool = Array.isArray(p.mediaPool) ? p.mediaPool : [];
    p.shots = (Array.isArray(p.shots) ? p.shots : []).map((s) => ({
      speed: 1.0, fadeIn: 0, fadeOut: 0, scale: 100, posX: 50, posY: 50, rotation: 0, flipH: false, flipV: false, keyframes: [],
      ...s
    }));
    p.elements = p.elements || {};
    ["vfx", "extraText", "graphics", "subtitles", "brolls", "audio"].forEach((k) => {
      if (!Array.isArray(p.elements[k])) p.elements[k] = [];
    });
    return p;
  }

  function getTotalDuration() {
    const p = state.project;
    if (!p) return 15;
    let maxT = 0;
    for (const m of TRACK_META) {
      const list = m.key === "shots" ? p.shots : p.elements[m.key];
      for (const item of list || []) {
        if ((item.end || 0) > maxT) maxT = item.end;
      }
    }
    return Math.max(5, Math.round(maxT * 100) / 100);
  }

  function getTrackList(trackKey) {
    if (!state.project) return [];
    return trackKey === "shots" ? state.project.shots : (state.project.elements[trackKey] || []);
  }

  function findItem(sel) {
    if (!sel || !state.project) return null;
    return getTrackList(sel.trackKey).find((x) => x.id === sel.id) || null;
  }

  function pushUndo(label) {
    if (!state.project) return;
    state.undoStack.push({ label, snapshot: clone(state.project) });
    if (state.undoStack.length > 40) state.undoStack.shift();
    state.redoStack = [];
  }

  function undo() {
    if (!state.undoStack.length) return toast("Không còn bước nào để hoàn tác.");
    state.redoStack.push(clone(state.project));
    const prev = state.undoStack.pop();
    state.project = normalizeProject(prev.snapshot);
    scheduleSave("Hoàn tác");
    renderAll();
    toast(`Đã hoàn tác: ${prev.label}`);
  }

  function redo() {
    if (!state.redoStack.length) return toast("Không có bước nào để làm lại.");
    state.undoStack.push({ label: "Làm lại", snapshot: clone(state.project) });
    state.project = normalizeProject(state.redoStack.pop());
    scheduleSave();
    renderAll();
  }

  function scheduleSave(snapshotLabel = "") {
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(() => persistProject(snapshotLabel), 320);
  }

  async function persistProject(snapshotLabel = "") {
    if (!state.project) return;
    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: state.project, snapshotLabel: snapshotLabel || undefined })
      });
      const data = await res.json();
      if (data.history) state.history = data.history;
    } catch (e) {
      console.error("Save error:", e);
    }
  }

  // EASING & KEYFRAME INTERPOLATION
  function applyEasing(u, mode) {
    const t = Math.max(0, Math.min(1, u));
    if (mode === "easeOut") return 1 - Math.pow(1 - t, 3);
    if (mode === "easeInOut") return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    if (mode === "bounce") {
      if (t < 0.7) return (t / 0.7) * 1.08;
      return 1.08 - ((t - 0.7) / 0.3) * 0.08;
    }
    return t;
  }

  function getInterpolatedMotion(item, globalTime) {
    const base = {
      scale: Number(item.scale ?? 100),
      x: Number(item.x ?? item.posX ?? 50),
      y: Number(item.y ?? item.posY ?? 50),
      rotation: Number(item.rotation ?? 0),
      opacity: Number(item.opacity ?? 1),
      volume: Number(item.volume ?? 1)
    };
    const start = Number(item.start ?? 0);
    const end = Number(item.end ?? start + 2);
    const dur = Math.max(0.05, end - start);
    const offset = Math.max(0, Math.min(dur, globalTime - start));

    const kfs = Array.isArray(item.keyframes) ? item.keyframes.slice().sort((a, b) => a.offset - b.offset) : [];
    if (kfs.length === 1) {
      Object.assign(base, kfs[0]);
    } else if (kfs.length >= 2) {
      if (offset <= kfs[0].offset) {
        Object.assign(base, kfs[0]);
      } else if (offset >= kfs[kfs.length - 1].offset) {
        Object.assign(base, kfs[kfs.length - 1]);
      } else {
        for (let i = 0; i < kfs.length - 1; i++) {
          const a = kfs[i];
          const b = kfs[i + 1];
          if (offset >= a.offset && offset <= b.offset) {
            const span = Math.max(0.001, b.offset - a.offset);
            const e = applyEasing((offset - a.offset) / span, b.easing || "easeInOut");
            const lerp = (va, vb, fb) => Number(va ?? fb) + (Number(vb ?? fb) - Number(va ?? fb)) * e;
            base.scale = lerp(a.scale, b.scale, base.scale);
            base.x = lerp(a.x, b.x, base.x);
            base.y = lerp(a.y, b.y, base.y);
            base.rotation = lerp(a.rotation, b.rotation, base.rotation);
            base.opacity = lerp(a.opacity, b.opacity, base.opacity);
            base.volume = lerp(a.volume, b.volume, base.volume);
            break;
          }
        }
      }
    }

    // Apply Fade In / Fade Out envelope
    const fadeIn = Math.max(0, Number(item.fadeIn) || 0);
    const fadeOut = Math.max(0, Number(item.fadeOut) || 0);
    let fadeFactor = 1;
    if (fadeIn > 0.01 && offset < fadeIn) fadeFactor = Math.min(fadeFactor, offset / fadeIn);
    if (fadeOut > 0.01 && dur - offset < fadeOut) fadeFactor = Math.min(fadeFactor, Math.max(0, dur - offset) / fadeOut);
    base.fadeFactor = Math.max(0, Math.min(1, fadeFactor));
    base.opacity = Math.max(0, Math.min(1, base.opacity * base.fadeFactor));
    return base;
  }

  // THEME & ASPECT RATIO
  function applyTheme(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    $("btn-theme").textContent = mode === "dark" ? "☀️" : "🌙";
    if (state.project) state.project.themeMode = mode;
  }

  function fitStageFrame() {
    if (!elStageViewport || !elStageFrame || !state.project) return;
    const ratioKey = state.project.aspectRatio || "9:16";
    const info = ASPECT_MAP[ratioKey] || ASPECT_MAP["9:16"];
    elStageFrame.setAttribute("data-ratio", ratioKey);

    const rect = elStageViewport.getBoundingClientRect();
    const availW = Math.max(120, rect.width - 20);
    const availH = Math.max(120, rect.height - 20);
    const targetRatio = info.w / info.h;

    let w = availW;
    let h = w / targetRatio;
    if (h > availH) {
      h = availH;
      w = h * targetRatio;
    }
    elStageFrame.style.width = `${Math.round(w)}px`;
    elStageFrame.style.height = `${Math.round(h)}px`;

    $("stage-ratio-badge").textContent = `${ratioKey} • ${info.res}`;
    document.querySelectorAll(".aspect-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.ratio === ratioKey);
    });
  }

  // COLOR GRADE & VFX RENDERING (supports all 200 LUTs & 200 VFX)
  function updateColorAndVfxVisuals(extraShotMotion = null) {
    const p = state.project;
    if (!p) return;
    const cg = p.colorGrade;
    const lut = state.library.luts.find((l) => l.id === cg.lut);

    const brightness = 1 + (cg.brightness || 0) / 100;
    const contrast = 1 + (cg.contrast || 0) / 100;
    const saturate = Math.max(0, 1 + (cg.saturation || 0) / 100);
    const sepia = cg.temperature > 0 ? Math.min(0.6, cg.temperature / 120) : 0;
    const hueShift = cg.temperature < 0 ? Math.round(cg.temperature * 0.45) : Math.round((cg.tint || 0) * 0.5);
    const blurPx = Math.max(0, (cg.blur || 0) * 0.35);

    const activeIds = new Set(p.activeFilters || []);
    for (const v of p.elements.vfx || []) {
      if (state.currentTime >= v.start && state.currentTime <= v.end) activeIds.add(v.filterId);
    }

    const activeVfxObjs = [...activeIds]
      .map((id) => state.library.filters.find((f) => f.id === id))
      .filter(Boolean);

    const vfxFilters = activeVfxObjs.map((f) => f.cssFilter).filter(Boolean).join(" ");

    const customFilter = [
      lut && lut.css ? lut.css : "",
      vfxFilters,
      `brightness(${brightness.toFixed(2)})`,
      `contrast(${contrast.toFixed(2)})`,
      `saturate(${saturate.toFixed(2)})`,
      sepia > 0.01 ? `sepia(${sepia.toFixed(2)})` : "",
      hueShift !== 0 ? `hue-rotate(${hueShift}deg)` : "",
      blurPx > 0.05 ? `blur(${blurPx.toFixed(1)}px)` : ""
    ].filter(Boolean).join(" ");

    elVideoFilterWrap.style.filter = customFilter;

    // Motion & Scale on main video/test-pattern
    if (extraShotMotion) {
      const { scale = 100, x = 50, y = 50, rotation = 0, flipH = false, flipV = false } = extraShotMotion;
      const tx = (x - 50);
      const ty = (y - 50);
      elVideoFilterWrap.style.transform =
        `translate(${tx}%, ${ty}%) scale(${(scale / 100).toFixed(3)}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`;
    } else {
      elVideoFilterWrap.style.transform = "none";
    }

    const vig = Math.max(0, Math.min(100, cg.vignette || 0));
    elVignetteOverlay.style.background = vig > 0
      ? `radial-gradient(circle, transparent ${Math.max(25, 72 - vig * 0.45)}%, rgba(0,0,0,${(vig / 115).toFixed(2)}) 100%)`
      : "none";

    $("stage-lut-badge").textContent = `LUT: ${lut ? lut.name : "Mặc Định"}`;

    // Render all active VFX overlays cleanly
    elVfxLayer.className = "vfx-overlay-layer";
    elVfxLayer.style.background = "";
    elVfxLayer.style.boxShadow = "";
    elVfxLayer.style.animation = "";
    elStageFrame.classList.remove("vfx-pixelate-anim", "vfx-mirror-anim");

    const bgLayers = [];
    const shadows = [];
    let anim = "";
    activeVfxObjs.forEach((f) => {
      if (f.isCinemaBars) elVfxLayer.classList.add("vfx-cinema-235");
      if (f.isMirror) elStageFrame.classList.add("vfx-mirror-anim");
      if (f.isPixelate) elStageFrame.classList.add("vfx-pixelate-anim");
      if (f.overlayBg) bgLayers.push(f.overlayBg);
      if (f.overlayShadow) shadows.push(f.overlayShadow);
      if (f.animCss && !anim) anim = f.animCss;
    });
    if (bgLayers.length) elVfxLayer.style.background = bgLayers.join(", ");
    if (shadows.length) elVfxLayer.style.boxShadow = shadows.join(", ");
    if (anim) elVfxLayer.style.animation = anim;

    const vfxBadge = $("stage-vfx-badge");
    vfxBadge.textContent = `VFX: ${activeIds.size}`;
    vfxBadge.classList.toggle("hidden", activeIds.size === 0);
  }

  // PLAYBACK & STAGE SYNC
  function getActiveShot(t) {
    const shots = (state.project?.shots || []).slice().sort((a, b) => a.start - b.start);
    if (!shots.length) return null;
    const hit = shots.find((s) => t >= s.start && t <= s.end);
    return hit || (t < shots[0].start ? shots[0] : shots[shots.length - 1]);
  }

  function syncStageAtTime(forceVideoSeek = false) {
    const p = state.project;
    if (!p) return;
    const t = state.currentTime;
    const totalDur = getTotalDuration();

    $("timecode-display").textContent = `${fmtTime(t)} / ${fmtTime(totalDur)}`;
    elPlayhead.style.left = `${t * state.pxPerSec}px`;

    const hasMedia = (p.shots && p.shots.length > 0) || Boolean(p.video?.src);
    elEmptyOverlay.classList.toggle("hidden", hasMedia || state.testPattern);
    elTestPattern.classList.toggle("hidden", !state.testPattern || hasMedia);
    $("btn-toggle-test-pattern").classList.toggle("active", state.testPattern);

    const shot = getActiveShot(t);
    const shotIdx = shot ? p.shots.findIndex((s) => s.id === shot.id) + 1 : 0;
    $("shot-indicator").textContent = p.shots.length ? `Cảnh ${shotIdx} / ${p.shots.length}` : "0 Cảnh";

    let shotMotion = null;
    if (shot && shot.src) {
      const m = getInterpolatedMotion(shot, t);
      shotMotion = { ...m, flipH: shot.flipH, flipV: shot.flipV };
      const speedBadge = $("stage-motion-badge");
      speedBadge.textContent = `${Number(shot.speed || 1).toFixed(2).replace(/\.00$/, "")}x • ${Math.round(m.scale)}%`;
      speedBadge.classList.remove("hidden");

      const absTarget = new URL(shot.src, window.location.origin).href;
      if (elMainVideo.src !== absTarget) {
        elMainVideo.src = absTarget;
        elMainVideo.load();
      }
      const trimBase = Number(shot.trimStart ?? 0);
      const speed = Math.max(0.2, Math.min(4.0, Number(shot.speed) || 1));
      const offsetInShot = Math.max(0, t - shot.start);
      const mediaT = Math.max(0, trimBase + offsetInShot * speed);
      if (forceVideoSeek || !state.isPlaying || Math.abs(elMainVideo.currentTime - mediaT) > 0.28) {
        if (elMainVideo.readyState >= 1) {
          elMainVideo.currentTime = Math.min(elMainVideo.duration || mediaT, mediaT);
        }
      }
      elMainVideo.muted = state.isMuted;
      const masterVol = Math.max(0, Math.min(1, Number(p.video?.volume ?? 1)));
      elMainVideo.volume = Math.max(0, Math.min(1, masterVol * m.fadeFactor));
      const effRate = Math.max(0.15, Math.min(4.0, speed * (p.playbackRate || 1)));
      elMainVideo.playbackRate = effRate;
      elFadeOverlay.style.opacity = (1 - m.fadeFactor).toFixed(2);
    } else {
      elMainVideo.removeAttribute("src");
      elFadeOverlay.style.opacity = "0";
      $("stage-motion-badge").classList.add("hidden");
    }

    // Transition overlay near shot cut
    if (shot && shot.transition && shot.transition !== "none") {
      const dtFromStart = t - shot.start;
      if (dtFromStart >= 0 && dtFromStart < 0.28) {
        const alpha = 1 - dtFromStart / 0.28;
        elTransitionOverlay.style.opacity = alpha.toFixed(2);
        elTransitionOverlay.style.background =
          shot.transition === "flash-white" || shot.transition === "luma-wipe" ? "#ffffff"
            : shot.transition === "flash-black" ? "#000000"
              : shot.transition === "glitch-cut" || shot.transition === "rgb-split"
                ? "linear-gradient(90deg, rgba(236,72,153,0.72), rgba(34,211,238,0.72))"
                : shot.transition === "burn-film" ? "radial-gradient(circle, #fb923c, #991b1b)"
                  : "rgba(15,23,42,0.5)";
      } else {
        elTransitionOverlay.style.opacity = "0";
      }
    } else {
      elTransitionOverlay.style.opacity = "0";
    }

    // B-roll PiP
    const activeBroll = (p.elements.brolls || []).find((b) => t >= b.start && t <= b.end);
    if (activeBroll) {
      const bm = getInterpolatedMotion(activeBroll, t);
      elBrollVideo.classList.remove("hidden");
      const absBr = new URL(activeBroll.src, window.location.origin).href;
      if (elBrollVideo.src !== absBr) elBrollVideo.src = absBr;
      elBrollVideo.style.left = `${bm.x}%`;
      elBrollVideo.style.top = `${bm.y}%`;
      elBrollVideo.style.width = `${activeBroll.w ?? 65}%`;
      elBrollVideo.style.height = `${activeBroll.h ?? 28}%`;
      elBrollVideo.style.opacity = bm.opacity.toFixed(2);
      elBrollVideo.style.transform = `translate(-50%, -50%) scale(${(bm.scale / 100).toFixed(3)}) rotate(${bm.rotation}deg)`;
      const brOffset = t - activeBroll.start;
      if (!state.isPlaying || Math.abs(elBrollVideo.currentTime - brOffset) > 0.35) {
        if (elBrollVideo.readyState >= 1) elBrollVideo.currentTime = brOffset % Math.max(1, elBrollVideo.duration || 5);
      }
      if (state.isPlaying && elBrollVideo.paused) elBrollVideo.play().catch(() => {});
    } else {
      elBrollVideo.classList.add("hidden");
      if (!elBrollVideo.paused) elBrollVideo.pause();
    }

    renderStageOverlays(t);

    const activeSub = (p.elements.subtitles || []).find((s) => t >= s.start && t <= s.end);
    if (activeSub) {
      elSubtitleOverlay.innerHTML = `<span class="sub-bubble" style="font-family:${activeSub.fontFamily || "inherit"}">${escapeHtml(activeSub.text)}</span>`;
    } else {
      elSubtitleOverlay.innerHTML = "";
    }

    updateColorAndVfxVisuals(shotMotion);
    if (state.isPlaying) syncAudioClipsDuringPlay(t);
  }

  function renderStageOverlays(t) {
    const p = state.project;
    elStageOverlay.innerHTML = "";

    for (const g of p.elements.graphics || []) {
      if (t < g.start || t > g.end) continue;
      const m = getInterpolatedMotion(g, t);
      const wrap = document.createElement("div");
      const isSel = state.selected?.trackKey === "graphics" && state.selected?.id === g.id;
      wrap.className = `stage-el stage-gfx-card ${isSel ? "selected" : ""}`;
      wrap.style.left = `${m.x}%`;
      wrap.style.top = `${m.y}%`;
      wrap.style.width = `${g.w ?? 60}%`;
      wrap.style.minHeight = `${g.h ?? 12}%`;
      wrap.style.background = g.bgColor || "#1e293b";
      wrap.style.color = g.textColor || "#ffffff";
      wrap.style.opacity = m.opacity.toFixed(2);
      wrap.style.fontFamily = g.fontFamily || "inherit";
      wrap.style.transform = `translate(-50%, -50%) scale(${(m.scale / 100).toFixed(3)}) rotate(${m.rotation}deg)`;
      wrap.innerHTML = `
        ${g.badgeText || g.badge ? `<span class="gfx-badge" style="background:${g.accentColor || "#38bdf8"};color:#09090b;">${escapeHtml(g.badge || "")} ${escapeHtml(g.badgeText || "")}</span>` : ""}
        <div class="gfx-title" style="font-size:${g.fontSize || 15}px">${escapeHtml(g.title || "Thẻ Graphic")}</div>
        ${g.subtitle ? `<div class="gfx-sub">${escapeHtml(g.subtitle)}</div>` : ""}
      `;
      attachStageDrag(wrap, "graphics", g);
      elStageOverlay.appendChild(wrap);
    }

    for (const txt of p.elements.extraText || []) {
      if (t < txt.start || t > txt.end) continue;
      const m = getInterpolatedMotion(txt, t);
      const wrap = document.createElement("div");
      const isSel = state.selected?.trackKey === "extraText" && state.selected?.id === txt.id;
      wrap.className = `stage-el stage-text-el ${isSel ? "selected" : ""}`;
      wrap.style.left = `${m.x}%`;
      wrap.style.top = `${m.y}%`;
      wrap.style.fontSize = `${txt.fontSize || 24}px`;
      wrap.style.color = txt.textColor || "#facc15";
      wrap.style.opacity = m.opacity.toFixed(2);
      if (txt.fontFamily) wrap.style.fontFamily = txt.fontFamily;
      if (txt.fontWeight) wrap.style.fontWeight = String(txt.fontWeight);
      if (txt.fontStyle) wrap.style.fontStyle = txt.fontStyle;
      if (txt.letterSpacing) wrap.style.letterSpacing = txt.letterSpacing;
      wrap.style.transform = `translate(-50%, -50%) scale(${(m.scale / 100).toFixed(3)}) rotate(${m.rotation}deg)`;
      if (txt.uppercase) wrap.style.textTransform = "uppercase";
      if (txt.bgHighlight && txt.bgColor && txt.bgColor !== "transparent") {
        wrap.style.background = txt.bgColor;
      } else {
        const sc = txt.strokeColor || "#000";
        wrap.style.textShadow = `0 2px 6px rgba(0,0,0,0.85), -1px -1px 0 ${sc}, 1px -1px 0 ${sc}, -1px 1px 0 ${sc}, 1px 1px 0 ${sc}`;
      }
      wrap.textContent = txt.text || "";
      attachStageDrag(wrap, "extraText", txt);
      elStageOverlay.appendChild(wrap);
    }
  }

  function attachStageDrag(domEl, trackKey, item) {
    domEl.addEventListener("mousedown", (ev) => {
      ev.stopPropagation();
      selectItem(trackKey, item.id);
      const frameRect = elStageFrame.getBoundingClientRect();
      const startX = ev.clientX;
      const startY = ev.clientY;
      const origX = Number(item.x ?? 50);
      const origY = Number(item.y ?? 50);
      let moved = false;

      const onMove = (me) => {
        if (!moved) { pushUndo("Di chuyển phần tử"); moved = true; }
        const dxPct = ((me.clientX - startX) / frameRect.width) * 100;
        const dyPct = ((me.clientY - startY) / frameRect.height) * 100;
        item.x = Math.max(5, Math.min(95, Math.round((origX + dxPct) * 10) / 10));
        item.y = Math.max(5, Math.min(95, Math.round((origY + dyPct) * 10) / 10));
        domEl.style.left = `${item.x}%`;
        domEl.style.top = `${item.y}%`;
        renderInspectorProps();
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        if (moved) scheduleSave();
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });
  }

  // AUDIO PLAYBACK SYNC (SFX & BGM + Fade In/Out)
  function syncAudioClipsDuringPlay(t) {
    if (state.isMuted) return;
    const clips = state.project?.elements?.audio || [];
    const activeSet = new Set();

    for (const clip of clips) {
      const inRange = t >= clip.start && t <= clip.end;
      if (!inRange) continue;
      activeSet.add(clip.id);
      const m = getInterpolatedMotion(clip, t);
      const vol = Math.max(0, Math.min(1, Number(m.volume ?? clip.volume ?? 0.8) * m.fadeFactor));

      let rec = state.activeAudioPlayers.get(clip.id);
      if (!rec) {
        const audio = new Audio(clip.src);
        audio.loop = Boolean(clip.loop);
        audio.volume = vol;
        const offset = Math.max(0, t - clip.start);
        audio.currentTime = offset % Math.max(0.5, clip.duration || 4);
        audio.play().catch(() => {});
        rec = { audio };
        state.activeAudioPlayers.set(clip.id, rec);
      } else {
        rec.audio.volume = vol;
      }
    }

    for (const [id, rec] of state.activeAudioPlayers.entries()) {
      if (!activeSet.has(id)) {
        rec.audio.pause();
        state.activeAudioPlayers.delete(id);
      }
    }
  }

  function stopAllAudioPlayers() {
    for (const rec of state.activeAudioPlayers.values()) rec.audio.pause();
    state.activeAudioPlayers.clear();
  }

  function previewSfxUrl(src) {
    if (state.previewAudio) {
      state.previewAudio.pause();
      state.previewAudio = null;
    }
    const a = new Audio(src);
    a.volume = 0.85;
    a.play().catch(() => {});
    state.previewAudio = a;
  }

  function togglePlay() {
    state.isPlaying = !state.isPlaying;
    $("btn-play").textContent = state.isPlaying ? "⏸️" : "▶️";
    if (state.isPlaying) {
      if (state.currentTime >= getTotalDuration() - 0.05) state.currentTime = 0;
      state.lastFrameTs = performance.now();
      if (elMainVideo.src) elMainVideo.play().catch(() => {});
      requestAnimationFrame(tickLoop);
    } else {
      elMainVideo.pause();
      elBrollVideo.pause();
      stopAllAudioPlayers();
    }
  }

  function tickLoop(now) {
    if (!state.isPlaying) return;
    const dt = Math.min(0.1, (now - state.lastFrameTs) / 1000);
    state.lastFrameTs = now;
    const rate = state.project?.playbackRate || 1;
    state.currentTime += dt * rate;
    const total = getTotalDuration();

    if (state.currentTime >= total) {
      state.currentTime = total;
      syncStageAtTime(true);
      togglePlay();
      return;
    }

    if (elMainVideo.src && elMainVideo.paused && elMainVideo.readyState >= 2) {
      elMainVideo.play().catch(() => {});
    }
    syncStageAtTime(false);
    requestAnimationFrame(tickLoop);
  }

  function seekTo(sec) {
    const maxT = getTotalDuration();
    state.currentTime = Math.max(0, Math.min(maxT, Number(sec) || 0));
    stopAllAudioPlayers();
    syncStageAtTime(true);
  }

  // LIBRARY DRAWER (9 TABS: MEDIA MANAGER + 6x200 + 20 TRANSITIONS + TOOLS)
  const TAB_INFO = {
    media: { title: "Quản Lý Tài Nguyên", filters: [["all", "Tất cả"], ["video", "Video"], ["audio", "Âm thanh"], ["image", "Ảnh"]] },
    sfx: { title: "Thư Viện SFX & BGM", filters: [["all", "Tất cả"], ["transition", "Chuyển cảnh"], ["impact", "Impact/Boom"], ["ui", "TikTok/UI"], ["meme", "Meme/Hài"], ["foley", "Foley"], ["scifi", "Sci-Fi"], ["musical", "Nhạc cụ"], ["bgm", "BGM Loop"]] },
    luts: { title: "200 Bộ Màu LUT Cinematic", filters: [["all", "Tất cả"], ["hollywood", "Hollywood"], ["kodak-fuji", "Kodak/Fuji"], ["camera-log", "Camera Log"], ["asian-trend", "Châu Á"], ["vintage-retro", "Vintage"], ["moody-dark", "Moody Tối"], ["vibrant-commercial", "Thương mại"], ["bw-monochrome", "Trắng Đen"]] },
    vfx: { title: "200 Bộ Lọc VFX", filters: [["all", "Tất cả"], ["glitch-digital", "Glitch Số"], ["light-glow", "Ánh Sáng"], ["retro-film", "Phim Cũ"], ["motion-camera", "Chuyển Động"], ["frame-letterbox", "Khung Viền"], ["atmosphere-weather", "Thời Tiết"], ["lens-distortion", "Ống Kính"], ["color-fx", "Màu VFX"]] },
    graphics: { title: "200 Motion Graphic", filters: [["all", "Tất cả"], ["lower-third", "Lower Third"], ["cta-social", "CTA Follow"], ["card-callout", "Thẻ Nổi"], ["kpi-data", "KPI Số Liệu"], ["badge-pill", "Nhãn Pill"], ["code-tech", "Code/AI"], ["chapter-quote", "Chương/Quote"], ["pointer-sticker", "Chỉ Dẫn"]] },
    text: { title: "200 Kiểu Chữ & Phụ Đề", filters: [["all", "Tất cả"], ["viral-short", "Viral Short"], ["cinematic-title", "Điện Ảnh"], ["neon-cyber", "Neon"], ["minimal-editorial", "Tối Giản"], ["vlog-lifestyle", "Vlog"], ["bold-impact", "Đậm Cỡ Lớn"], ["gradient-3d", "3D Nổi"], ["karaoke-sub", "Phụ Đề"]] },
    fonts: { title: "200 Font Chữ Tiếng Việt", filters: [["all", "Tất cả"], ["sans-modern", "Sans Hiện Đại"], ["display-bold", "Poster Đậm"], ["serif-cinema", "Serif Cổ Điển"], ["script-hand", "Viết Tay"], ["tech-cyber", "Cyber Tech"], ["rounded-vlog", "Bo Tròn Vlog"], ["mono-code", "Code/Mono"], ["condensed-poster", "Chữ Hẹp"]] },
    transitions: { title: "20 Chuyển Cảnh Mượt", filters: [] },
    tools: { title: "Công Cụ AI & Keyframe", filters: [] }
  };

  function setActiveTab(tab) {
    state.activeTab = tab;
    state.subFilter = "all";
    document.querySelectorAll(".rail-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    renderLibraryDrawer();
  }

  function renderLibraryDrawer() {
    const info = TAB_INFO[state.activeTab] || TAB_INFO.media;
    $("drawer-title").textContent = info.title;
    const subWrap = $("library-subfilters");
    subWrap.innerHTML = "";
    for (const [val, lbl] of info.filters) {
      const btn = document.createElement("button");
      btn.className = `sub-pill ${state.subFilter === val ? "active" : ""}`;
      btn.textContent = lbl;
      btn.onclick = () => { state.subFilter = val; renderLibraryDrawer(); };
      subWrap.appendChild(btn);
    }

    const q = state.searchQuery.trim().toLowerCase();
    const container = $("library-content");
    container.innerHTML = "";
    const p = state.project;
    if (!p) return;

    const countBadge = $("drawer-count-badge");

    if (state.activeTab === "media") {
      const topActions = document.createElement("div");
      topActions.className = "field-row-2";
      topActions.innerHTML = `
        <button class="btn-chip accent" id="lib-btn-up">+ Tải File / URL</button>
        <button class="btn-chip" style="color:var(--danger)" id="lib-btn-clear-pool">🧹 Xóa Sạch Kho</button>
      `;
      topActions.querySelector("#lib-btn-up").onclick = () => openModal("modal-import");
      topActions.querySelector("#lib-btn-clear-pool").onclick = clearAllMediaAssets;
      container.appendChild(topActions);

      const dz = document.createElement("div");
      dz.className = "drop-mini-zone";
      dz.innerHTML = "📂 <strong>Kéo thả video / nhạc / ảnh vào đây</strong> (nhiều file cùng lúc)";
      dz.onclick = () => openModal("modal-import");
      attachDropTarget(dz, "append");
      container.appendChild(dz);

      const items = (p.mediaPool || []).filter((m) => {
        if (state.subFilter !== "all" && m.kind !== state.subFilter) return false;
        return !q || m.name.toLowerCase().includes(q);
      });
      countBadge.textContent = String(items.length);

      if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "lib-sub";
        empty.style.textAlign = "center";
        empty.style.padding = "14px 4px";
        empty.textContent = "Kho tài nguyên đang trống. Bấm '+ Tải File / URL' để nạp video của bạn!";
        container.appendChild(empty);
        return;
      }

      items.forEach((m) => {
        const mbTxt = m.bytes ? ` • ${(m.bytes / (1024 * 1024)).toFixed(1)}MB` : "";
        const row = document.createElement("div");
        row.className = "lib-card";
        row.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;">
            <div class="lib-name" style="flex:1">${m.kind === "audio" ? "🎵" : m.kind === "image" ? "🖼️" : "🎞️"} ${escapeHtml(m.name)}</div>
            <button class="btn-mini act-ren" title="Đổi tên">✏️</button>
            <button class="btn-mini act-del" style="color:var(--danger)" title="Xóa tài nguyên">🗑️</button>
          </div>
          <div class="lib-sub">${m.duration ? m.duration.toFixed(1) + "s" : ""} ${m.width ? "• " + m.width + "×" + m.height : ""}${mbTxt}</div>
          <div class="lib-actions" style="flex-wrap:wrap;margin-top:3px;">
            ${m.kind === "video" ? `
              <button class="btn-mini act-main" title="Đặt làm video chính">Chính</button>
              <button class="btn-mini act-shot" title="Nối vào cuối Timeline">+Cuối</button>
              <button class="btn-mini act-insert" title="Chèn vào ngay Đầu phát">⤵️Chèn</button>
              <button class="btn-mini act-broll" title="Đè làm B-roll PiP">+PiP</button>
            ` : m.kind === "audio" ? `<button class="btn-mini act-aud">+Chèn Nhạc</button>` : `<button class="btn-mini act-broll">+Đặt Ảnh PiP</button>`}
          </div>
        `;
        row.querySelector(".act-ren").onclick = () => renameMediaAsset(m);
        row.querySelector(".act-del").onclick = () => deleteMediaAsset(m);
        row.querySelector(".act-main")?.addEventListener("click", () => {
          pushUndo("Đặt làm video chính");
          const dur = m.duration || 10;
          p.video = { src: m.src, title: m.name, duration: dur, trimStart: 0, trimEnd: dur, volume: 1.0 };
          p.shots = [createShotObj(m, 0)];
          seekTo(0);
          scheduleSave(`Video chính: ${m.name}`);
          renderAll();
          toast(`Đã đặt "${m.name}" làm video chính!`);
        });
        row.querySelector(".act-shot")?.addEventListener("click", () => {
          pushUndo("Nối thêm cảnh cuối");
          const lastEnd = p.shots.length ? Math.max(...p.shots.map((s) => s.end)) : 0;
          const ns = createShotObj(m, lastEnd);
          p.shots.push(ns);
          selectItem("shots", ns.id);
          renderAll();
          scheduleSave("Nối cảnh mới");
          toast(`Đã nối "${m.name}" vào cuối track Video!`);
        });
        row.querySelector(".act-insert")?.addEventListener("click", () => rippleInsertMediaAtPlayhead(m));
        row.querySelector(".act-broll")?.addEventListener("click", () => addBrollFromMedia(m));
        row.querySelector(".act-aud")?.addEventListener("click", () => addAudioClip({ label: m.name, src: m.src, duration: m.duration || 4, category: "bgm", color: "#a855f7", loop: true }));
        container.appendChild(row);
      });
      return;
    }

    if (state.activeTab === "sfx") {
      const list = state.library.sfx.filter((s) => {
        if (state.subFilter !== "all" && s.category !== state.subFilter) return false;
        return !q || s.label.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
      });
      countBadge.textContent = String(list.length);
      const frag = document.createDocumentFragment();
      list.forEach((s) => {
        const row = document.createElement("div");
        row.className = "lib-row";
        row.innerHTML = `
          <div class="lib-row-main">
            <div class="lib-name">${s.category === "bgm" ? "🎶" : "🔊"} ${escapeHtml(s.label)}</div>
            <div class="lib-sub">${s.category.toUpperCase()} • ${s.duration}s</div>
          </div>
          <div class="lib-actions">
            <button class="btn-mini act-play" title="Nghe thử">▶</button>
            <button class="btn-mini act-add" title="Chèn tại đầu phát">+ Chèn</button>
          </div>
        `;
        row.querySelector(".act-play").onclick = () => previewSfxUrl(s.src);
        row.querySelector(".act-add").onclick = () => addAudioClip({
          sfxId: s.id, label: s.label, src: s.src, category: s.category,
          duration: s.category === "bgm" ? 8.0 : s.duration,
          volume: s.category === "bgm" ? 0.28 : 0.9,
          loop: s.category === "bgm", color: s.color
        });
        frag.appendChild(row);
      });
      container.appendChild(frag);
      return;
    }

    if (state.activeTab === "luts") {
      const list = state.library.luts.filter((l) => {
        if (state.subFilter !== "all" && l.category !== state.subFilter) return false;
        return !q || l.name.toLowerCase().includes(q) || (l.code || "").toLowerCase().includes(q);
      });
      countBadge.textContent = String(list.length);
      const grid = document.createElement("div");
      grid.className = "lib-grid-2";
      list.forEach((l) => {
        const card = document.createElement("div");
        const isActive = p.colorGrade.lut === l.id;
        card.className = `lib-card ${isActive ? "active" : ""}`;
        const grad = l.swatch ? `linear-gradient(135deg, ${l.swatch[0]}, ${l.swatch[1]}, ${l.swatch[2]})` : "#475569";
        card.innerHTML = `
          <div class="lut-swatch" style="background:${grad}"></div>
          <div class="lib-name">${escapeHtml(l.name)}</div>
          <div class="lib-sub">${l.code || l.category}</div>
        `;
        card.onclick = () => {
          pushUndo(`Áp LUT màu: ${l.name}`);
          p.colorGrade.lut = l.id;
          if (!p.shots.length && !p.video.src && !state.testPattern) state.testPattern = true;
          syncStageAtTime();
          renderLibraryDrawer();
          renderInspectorColor();
          scheduleSave(`LUT: ${l.name}`);
          toast(`Đã áp dụng LUT "${l.name}"`);
        };
        grid.appendChild(card);
      });
      container.appendChild(grid);
      return;
    }

    if (state.activeTab === "vfx") {
      const list = state.library.filters.filter((f) => {
        if (state.subFilter !== "all" && f.category !== state.subFilter) return false;
        return !q || f.name.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q);
      });
      countBadge.textContent = String(list.length);
      const frag = document.createDocumentFragment();
      list.forEach((f) => {
        const isGlobalOn = (p.activeFilters || []).includes(f.id);
        const card = document.createElement("div");
        card.className = `lib-card ${isGlobalOn ? "active" : ""}`;
        card.innerHTML = `
          <div class="lib-row-main">
            <div class="lib-name">${f.icon} ${escapeHtml(f.name)}</div>
            <div class="lib-sub">${escapeHtml(f.desc)}</div>
          </div>
          <div class="lib-actions" style="margin-top:4px;">
            <button class="btn-mini act-global">${isGlobalOn ? "✓ Tắt toàn vid" : "⚡ Bật toàn vid"}</button>
            <button class="btn-mini act-clip">+ Đoạn 3s</button>
          </div>
        `;
        card.querySelector(".act-global").onclick = () => {
          pushUndo(`Bật/Tắt VFX: ${f.name}`);
          const idx = p.activeFilters.indexOf(f.id);
          if (idx >= 0) p.activeFilters.splice(idx, 1);
          else p.activeFilters.push(f.id);
          if (!p.shots.length && !p.video.src && !state.testPattern) state.testPattern = true;
          syncStageAtTime();
          renderLibraryDrawer();
          scheduleSave();
        };
        card.querySelector(".act-clip").onclick = () => {
          pushUndo(`Chèn VFX đoạn: ${f.name}`);
          const st = Math.round(state.currentTime * 100) / 100;
          const en = Math.round((st + 3.0) * 100) / 100;
          const item = { id: `vfx-${Date.now()}`, filterId: f.id, label: f.name, start: st, end: en, intensity: 80, color: f.color };
          p.elements.vfx.push(item);
          if (!p.shots.length && !p.video.src && !state.testPattern) state.testPattern = true;
          selectItem("vfx", item.id);
          renderAll();
          scheduleSave();
          toast(`Đã chèn hiệu ứng "${f.name}" lên track VFX!`);
        };
        frag.appendChild(card);
      });
      container.appendChild(frag);
      return;
    }

    if (state.activeTab === "graphics") {
      const list = state.library.graphics.filter((g) => {
        if (state.subFilter !== "all" && g.category !== state.subFilter) return false;
        return !q || g.name.toLowerCase().includes(q) || g.title.toLowerCase().includes(q);
      });
      countBadge.textContent = String(list.length);
      const frag = document.createDocumentFragment();
      list.forEach((g) => {
        const row = document.createElement("div");
        row.className = "lib-row";
        row.innerHTML = `
          <div class="lib-row-main">
            <div class="lib-name"><span style="color:${g.accentColor}">${escapeHtml(g.badge || "🧩")}</span> ${escapeHtml(g.name)}</div>
            <div class="lib-sub">${escapeHtml(g.title)}</div>
          </div>
          <button class="btn-mini">+ Chèn</button>
        `;
        row.querySelector("button").onclick = () => {
          pushUndo(`Chèn Graphic: ${g.name}`);
          const st = Math.round(state.currentTime * 100) / 100;
          const item = {
            id: `gfx-${Date.now()}`, presetId: g.id, type: g.type, title: g.title, subtitle: g.subtitle || "",
            badge: g.badge || "", badgeText: g.badgeText || "", bgColor: g.bgColor, textColor: g.textColor,
            accentColor: g.accentColor, fontSize: g.fontSize || 15, start: st, end: Math.round((st + 4.0) * 100) / 100,
            x: 50, y: 34, w: g.w || 60, h: g.h || 12, scale: 100, rotation: 0, opacity: 1, fadeIn: 0.25, fadeOut: 0.25, keyframes: []
          };
          p.elements.graphics.push(item);
          selectItem("graphics", item.id);
          renderAll();
          scheduleSave();
          toast(`Đã chèn Graphic "${g.name}"!`);
        };
        frag.appendChild(row);
      });
      container.appendChild(frag);
      return;
    }

    if (state.activeTab === "text") {
      const aiBox = document.createElement("div");
      aiBox.className = "ins-section";
      aiBox.innerHTML = `
        <div class="ins-title">Phụ đề Tự Động AI (Whisper)</div>
        <button class="btn-chip accent" id="btn-run-whisper-lib">🎙️ Tự Động Tách Phụ Đề Video</button>
      `;
      aiBox.querySelector("#btn-run-whisper-lib").onclick = runWhisperTranscribe;
      container.appendChild(aiBox);

      const list = state.library.textStyles.filter((t) => {
        if (state.subFilter !== "all" && t.category !== state.subFilter) return false;
        return !q || t.name.toLowerCase().includes(q) || t.text.toLowerCase().includes(q);
      });
      countBadge.textContent = String(list.length);
      const frag = document.createDocumentFragment();
      list.forEach((ts) => {
        const row = document.createElement("div");
        row.className = "lib-row";
        row.innerHTML = `
          <div class="lib-row-main">
            <div class="lib-name" style="font-family:${ts.fontFamily};color:${ts.textColor === "#111827" || ts.textColor === "#09090b" ? "var(--accent)" : ts.textColor}">${escapeHtml(ts.name)}</div>
            <div class="lib-sub">${escapeHtml(ts.text)}</div>
          </div>
          <button class="btn-mini">+ Chữ</button>
        `;
        row.querySelector("button").onclick = () => {
          pushUndo(`Thêm chữ: ${ts.name}`);
          const st = Math.round(state.currentTime * 100) / 100;
          const item = {
            id: `txt-${Date.now()}`, text: ts.text, start: st, end: Math.round((st + 3.5) * 100) / 100,
            x: 50, y: 24, fontSize: ts.fontSize, fontFamily: ts.fontFamily, fontWeight: ts.fontWeight,
            letterSpacing: ts.letterSpacing, textColor: ts.textColor, strokeColor: ts.strokeColor,
            bgColor: ts.bgColor, uppercase: ts.uppercase, bgHighlight: ts.bgHighlight, styleId: ts.id,
            scale: 100, rotation: 0, opacity: 1, fadeIn: 0.2, fadeOut: 0.2, keyframes: []
          };
          p.elements.extraText.push(item);
          selectItem("extraText", item.id);
          renderAll();
          scheduleSave();
          toast(`Đã chèn chữ kiểu "${ts.name}"!`);
        };
        frag.appendChild(row);
      });
      container.appendChild(frag);
      return;
    }

    if (state.activeTab === "fonts") {
      const list = state.library.fonts.filter((fn) => {
        if (state.subFilter !== "all" && fn.category !== state.subFilter) return false;
        return !q || fn.name.toLowerCase().includes(q) || fn.fontFamily.toLowerCase().includes(q);
      });
      countBadge.textContent = String(list.length);
      const frag = document.createDocumentFragment();
      list.forEach((fn) => {
        const row = document.createElement("div");
        row.className = "lib-row";
        row.innerHTML = `
          <div class="lib-row-main">
            <div class="lib-name" style="font-family:${fn.fontFamily};font-weight:${fn.fontWeight};font-style:${fn.fontStyle};font-size:13px">${escapeHtml(fn.name)}</div>
            <div class="lib-sub" style="font-family:${fn.fontFamily};font-weight:${fn.fontWeight};font-style:${fn.fontStyle}">${escapeHtml(fn.sampleText)}</div>
          </div>
          <button class="btn-mini">Áp dụng</button>
        `;
        row.querySelector("button").onclick = () => {
          const sel = state.selected ? findItem(state.selected) : null;
          if (sel && ["extraText", "graphics", "subtitles"].includes(state.selected.trackKey)) {
            pushUndo(`Đổi font: ${fn.name}`);
            sel.fontFamily = fn.fontFamily;
            sel.fontWeight = fn.fontWeight;
            sel.fontStyle = fn.fontStyle;
            sel.letterSpacing = fn.letterSpacing;
            syncStageAtTime();
            renderInspectorProps();
            scheduleSave();
            toast(`Đã đổi font sang "${fn.name}"!`);
          } else {
            pushUndo(`Tạo chữ font: ${fn.name}`);
            const st = Math.round(state.currentTime * 100) / 100;
            const item = {
              id: `txt-${Date.now()}`, text: "CHỮ MẪU TIẾNG VIỆT", start: st, end: Math.round((st + 3.5) * 100) / 100,
              x: 50, y: 26, fontSize: 26, fontFamily: fn.fontFamily, fontWeight: fn.fontWeight,
              fontStyle: fn.fontStyle, letterSpacing: fn.letterSpacing, textColor: "#ffffff",
              strokeColor: "#000000", bgColor: "transparent", uppercase: false, bgHighlight: false,
              scale: 100, rotation: 0, opacity: 1, fadeIn: 0.2, fadeOut: 0.2, keyframes: []
            };
            p.elements.extraText.push(item);
            selectItem("extraText", item.id);
            renderAll();
            scheduleSave();
            toast(`Đã tạo chữ mới với font "${fn.name}"!`);
          }
        };
        frag.appendChild(row);
      });
      container.appendChild(frag);
      return;
    }

    if (state.activeTab === "transitions") {
      countBadge.textContent = String(state.library.transitions.length);
      const hint = document.createElement("div");
      hint.className = "lib-sub";
      hint.textContent = "Chọn một cảnh (Video/Cảnh) rồi gán chuyển cảnh:";
      container.appendChild(hint);

      state.library.transitions.forEach((tr) => {
        const targetShot = (state.selected?.trackKey === "shots" ? findItem(state.selected) : null) || getActiveShot(state.currentTime);
        const isOn = targetShot && targetShot.transition === tr.id;
        const row = document.createElement("div");
        row.className = "lib-row";
        if (isOn) row.style.borderColor = "var(--accent)";
        row.innerHTML = `
          <div class="lib-row-main">
            <div class="lib-name">${tr.icon} ${escapeHtml(tr.name)}</div>
            <div class="lib-sub">${tr.duration ? tr.duration + "s" : "Tức thì"}</div>
          </div>
          <button class="btn-mini">${isOn ? "✓ Đang dùng" : "Áp dụng"}</button>
        `;
        row.querySelector("button").onclick = () => {
          if (!targetShot) return toast("Hãy đưa ít nhất 1 cảnh vào timeline trước.", "error");
          pushUndo(`Chuyển cảnh: ${tr.name}`);
          targetShot.transition = tr.id;
          seekTo(targetShot.start + 0.03);
          renderLibraryDrawer();
          renderTimeline();
          scheduleSave();
          toast(`Đã gán chuyển cảnh "${tr.name}" cho ${targetShot.label}!`);
        };
        container.appendChild(row);
      });
      return;
    }

    if (state.activeTab === "tools") {
      countBadge.textContent = "10";
      const tools = [
        { icon: "🎙️", title: "Tách Phụ Đề AI (Whisper)", desc: "Nghe lời thoại và tạo phụ đề đồng bộ thời gian", fn: runWhisperTranscribe },
        { icon: "✂️", title: "Cắt Khoảng Lặng Tự Động (FFmpeg)", desc: "Xóa đoạn im lặng thừa & tạo các cảnh liền mạch", fn: runAutoCutSilence },
        { icon: "🐢", title: "Slow-Mo 0.5x Cảnh Đang Chọn", desc: "Làm chậm điện ảnh 0.5x cho cảnh hiện tại", fn: applyQuickSlowMo },
        { icon: "🌅", title: "Thêm Fade In / Out (0.5s)", desc: "Mờ dần vào/ra cho video & âm thanh clip đang chọn", fn: applyQuickFade },
        { icon: "💎", title: "Áp Preset Keyframe Zoom In", desc: "Phóng to dần 100% → 125% kiểu Ken Burns", fn: () => applyKeyframePreset("zoom-in") },
        { icon: "🧲", title: "Xóa & Khép Khoảng Trống (Ripple)", desc: "Xóa clip đang chọn và dồn các clip sau khít lại", fn: rippleDeleteSelected },
        { icon: "🧪", title: "Bật / Tắt Khung Thử Màu LUT", desc: "Test nhanh 200 LUT & VFX mà chưa cần nạp video", fn: toggleTestPattern },
        { icon: "📷", title: "Chụp Khung Hình PNG", desc: "Lưu ngay khung hình đang xem ra file ảnh PNG", fn: capturePngSnapshot },
        { icon: "🧹", title: "Xóa Sạch Tất Cả Cảnh Timeline", desc: "Làm trắng timeline (giữ nguyên kho tài nguyên)", fn: clearTimelineShots }
      ];
      tools.forEach((tl) => {
        const card = document.createElement("div");
        card.className = "lib-card";
        card.innerHTML = `<div class="lib-name">${tl.icon} ${tl.title}</div><div class="lib-sub">${tl.desc}</div>`;
        card.onclick = tl.fn;
        container.appendChild(card);
      });
    }
  }

  // MEDIA ASSET CRUD & NLE SHOT HELPERS
  function createShotObj(mediaItem, startOffset) {
    const palette = ["#0ea5e9", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6"];
    const dur = mediaItem.duration || 5;
    return {
      id: `shot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      label: mediaItem.name,
      start: Math.round(startOffset * 100) / 100,
      end: Math.round((startOffset + dur) * 100) / 100,
      src: mediaItem.src,
      trimStart: 0,
      trimEnd: dur,
      speed: 1.0,
      fadeIn: 0,
      fadeOut: 0,
      scale: 100,
      posX: 50,
      posY: 50,
      rotation: 0,
      flipH: false,
      flipV: false,
      keyframes: [],
      transition: startOffset > 0 ? "crossfade" : "none",
      color: palette[Math.floor(Math.random() * palette.length)]
    };
  }

  function rippleInsertMediaAtPlayhead(m) {
    pushUndo(`Chèn giữa tại ${fmtTime(state.currentTime)}`);
    const shots = state.project.shots;
    const dur = m.duration || 5;
    const t = Math.round(state.currentTime * 100) / 100;

    if (!shots.length) {
      const s = createShotObj(m, 0);
      shots.push(s);
      state.project.video.src = m.src;
      selectItem("shots", s.id);
      renderAll();
      scheduleSave();
      return toast(`Đã chèn "${m.name}" vào Timeline!`);
    }

    // Split active shot if playhead inside it, then shift all following shots by +dur
    const hitIdx = shots.findIndex((s) => t > s.start + 0.15 && t < s.end - 0.15);
    let insertPos = t;
    if (hitIdx >= 0) {
      const sel = shots[hitIdx];
      const second = clone(sel);
      second.id = `shot-${Date.now()}-r`;
      const offset = t - sel.start;
      const spd = Number(sel.speed || 1);
      sel.trimEnd = Math.round(((sel.trimStart || 0) + offset * spd) * 100) / 100;
      sel.end = t;
      second.trimStart = sel.trimEnd;
      second.start = t + dur;
      second.end = Math.round((second.end + dur) * 100) / 100;
      shots.splice(hitIdx + 1, 0, second);
      for (let i = hitIdx + 2; i < shots.length; i++) {
        shots[i].start = Math.round((shots[i].start + dur) * 100) / 100;
        shots[i].end = Math.round((shots[i].end + dur) * 100) / 100;
      }
    } else {
      shots.forEach((s) => {
        if (s.start >= t - 0.05) {
          s.start = Math.round((s.start + dur) * 100) / 100;
          s.end = Math.round((s.end + dur) * 100) / 100;
        }
      });
    }
    const inserted = createShotObj(m, insertPos);
    shots.push(inserted);
    shots.sort((a, b) => a.start - b.start);
    selectItem("shots", inserted.id);
    renderAll();
    scheduleSave("Chèn cảnh giữa");
    toast(`Đã chèn "${m.name}" tại ${fmtTime(insertPos)}!`);
  }

  async function renameMediaAsset(m) {
    const newName = window.prompt("Nhập tên mới cho tài nguyên:", m.name);
    if (!newName || newName.trim() === m.name) return;
    try {
      const res = await fetch("/api/rename-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id, name: newName.trim() })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      state.project = normalizeProject(data.project);
      renderAll();
      toast(`Đã đổi tên thành "${newName.trim()}"!`, "success");
    } catch (e) {
      toast(`Lỗi đổi tên: ${e.message}`, "error");
    }
  }

  async function deleteMediaAsset(m) {
    try {
      const res = await fetch("/api/delete-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id, removeFromTimeline: true })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      state.project = normalizeProject(data.project);
      state.selected = null;
      seekTo(Math.min(state.currentTime, getTotalDuration()));
      renderAll();
      toast(`Đã xóa tài nguyên "${m.name}"!`, "success");
    } catch (e) {
      toast(`Lỗi xóa tài nguyên: ${e.message}`, "error");
    }
  }

  async function clearAllMediaAssets() {
    try {
      const res = await fetch("/api/clear-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearTimeline: true })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      state.project = normalizeProject(data.project);
      state.selected = null;
      seekTo(0);
      renderAll();
      toast("Đã xóa toàn bộ kho tài nguyên & làm sạch timeline!", "success");
    } catch (e) {
      toast(`Lỗi: ${e.message}`, "error");
    }
  }

  function addAudioClip({ sfxId, label, src, category, duration, volume, loop, color }) {
    pushUndo(`Thêm âm thanh: ${label}`);
    const st = Math.round(state.currentTime * 100) / 100;
    const item = {
      id: `aud-${Date.now()}`, sfxId: sfxId || "custom", label, src, category: category || "sfx",
      start: st, end: Math.round((st + (duration || 1.0)) * 100) / 100,
      volume: volume ?? 0.85, fadeIn: 0, fadeOut: 0, loop: Boolean(loop), color: color || "#f59e0b", keyframes: []
    };
    state.project.elements.audio.push(item);
    selectItem("audio", item.id);
    renderTimeline();
    scheduleSave();
    toast(`Đã chèn "${label}" tại ${fmtTime(st)}!`);
  }

  function addBrollFromMedia(m) {
    pushUndo(`Chèn B-roll: ${m.name}`);
    const st = Math.round(state.currentTime * 100) / 100;
    const item = {
      id: `broll-${Date.now()}`, name: m.name, src: m.src,
      start: st, end: Math.round((st + Math.min(5, m.duration || 4)) * 100) / 100,
      x: 50, y: 50, w: 68, h: 30, scale: 100, rotation: 0, opacity: 1, fadeIn: 0.2, fadeOut: 0.2, keyframes: [], mode: "pip"
    };
    state.project.elements.brolls.push(item);
    selectItem("brolls", item.id);
    renderAll();
    scheduleSave();
    toast(`Đã chèn "${m.name}" lên track B-roll!`);
  }

  // WHISPER & SILENCE CUT
  async function runWhisperTranscribe() {
    toast("Đang chạy Whisper AI tách phụ đề...");
    try {
      const src = state.project.video?.src || state.project.shots?.[0]?.src;
      const res = await fetch("/api/transcribe-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ src })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Whisper lỗi");
      state.project = normalizeProject(data.project);
      renderAll();
      toast(`Whisper AI hoàn tất: ${data.count} dòng phụ đề!`, "success");
    } catch (e) {
      toast(`Lỗi Whisper: ${e.message}`, "error");
    }
  }

  async function runAutoCutSilence() {
    toast("FFmpeg đang phân tích & cắt bỏ khoảng lặng...");
    try {
      const src = state.project.video?.src || state.project.shots?.[0]?.src;
      const res = await fetch("/api/auto-cut-silence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ src })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Silence cut lỗi");
      state.project = normalizeProject(data.project);
      seekTo(0);
      renderAll();
      toast(`Đã cắt ${data.removedSilences} khoảng lặng -> ${data.shotsCount} cảnh!`, "success");
    } catch (e) {
      toast(`Lỗi cắt khoảng lặng: ${e.message}`, "error");
    }
  }

  // NLE QUICK OPERATIONS & KEYFRAME / SLOW-MO / FADE
  function getTargetClipOrShot() {
    if (state.selected) {
      const item = findItem(state.selected);
      if (item) return { trackKey: state.selected.trackKey, item };
    }
    const shot = getActiveShot(state.currentTime);
    if (shot) return { trackKey: "shots", item: shot };
    return null;
  }

  function splitAtPlayhead() {
    const t = Math.round(state.currentTime * 100) / 100;
    const hit = getTargetClipOrShot();
    if (!hit || t <= hit.item.start + 0.12 || t >= hit.item.end - 0.12) {
      return toast("Đặt đầu phát vào giữa cảnh/clip muốn cắt đôi!", "error");
    }
    const { trackKey, item: sel } = hit;
    pushUndo(`Cắt đôi ${trackKey}`);
    const list = getTrackList(trackKey);
    const second = clone(sel);
    second.id = `${trackKey}-${Date.now()}`;
    const origEnd = sel.end;
    sel.end = t;
    second.start = t;
    second.end = origEnd;

    if (trackKey === "shots") {
      const spd = Number(sel.speed || 1);
      const offsetSrc = (t - sel.start) * spd;
      const origTrimStart = Number(sel.trimStart ?? 0);
      sel.trimEnd = Math.round((origTrimStart + offsetSrc) * 100) / 100;
      second.trimStart = sel.trimEnd;
      second.label = `${sel.label} (2)`;
    }

    const idx = list.findIndex((x) => x.id === sel.id);
    list.splice(idx + 1, 0, second);
    selectItem(trackKey, second.id);
    renderAll();
    scheduleSave("Cắt đôi clip");
    toast(`Đã cắt đôi tại ${fmtTime(t)}!`);
  }

  function rippleDeleteSelected() {
    if (!state.selected) return toast("Chọn một cảnh/clip để xóa & khép.");
    const { trackKey, id } = state.selected;
    const list = getTrackList(trackKey);
    const idx = list.findIndex((x) => x.id === id);
    if (idx < 0) return;
    pushUndo("Xóa & khép khoảng trống");
    const removed = list.splice(idx, 1)[0];
    const gap = Math.max(0, (removed.end || 0) - (removed.start || 0));
    list.forEach((other) => {
      if (other.start >= removed.start) {
        other.start = Math.max(0, Math.round((other.start - gap) * 100) / 100);
        other.end = Math.max(other.start + 0.2, Math.round((other.end - gap) * 100) / 100);
      }
    });
    state.selected = null;
    if (trackKey === "shots") state.project.video.src = list[0]?.src || "";
    renderAll();
    scheduleSave("Ripple Delete");
    toast("Đã xóa & khép khoảng trống!");
  }

  function deleteSelected() {
    if (!state.selected) return toast("Chưa chọn phần tử nào để xóa.");
    const list = getTrackList(state.selected.trackKey);
    pushUndo("Xóa phần tử");
    const idx = list.findIndex((x) => x.id === state.selected.id);
    if (idx >= 0) list.splice(idx, 1);
    if (state.selected.trackKey === "shots") {
      state.project.video.src = list[0]?.src || "";
    }
    state.selected = null;
    renderAll();
    scheduleSave("Xóa phần tử");
    toast("Đã xóa phần tử.");
  }

  function clearTimelineShots() {
    pushUndo("Xóa sạch toàn bộ timeline");
    state.project.shots = [];
    state.project.video.src = "";
    state.project.video.title = "Chưa có video";
    state.project.elements = { vfx: [], extraText: [], graphics: [], subtitles: [], brolls: [], audio: [] };
    state.selected = null;
    seekTo(0);
    renderAll();
    scheduleSave("Xóa hết cảnh");
    toast("Đã xóa sạch toàn bộ cảnh trên timeline!", "success");
  }

  function duplicateSelected() {
    if (!state.selected) return toast("Chọn một clip trên timeline trước khi nhân đôi.");
    const item = findItem(state.selected);
    if (!item) return;
    pushUndo("Nhân đôi phần tử");
    const list = getTrackList(state.selected.trackKey);
    const len = Math.max(0.5, item.end - item.start);
    const copy = clone(item);
    copy.id = `${state.selected.trackKey}-${Date.now()}`;
    copy.start = Math.round(item.end * 100) / 100;
    copy.end = Math.round((copy.start + len) * 100) / 100;
    if (copy.label) copy.label += " (Copy)";
    if (copy.title) copy.title += " (Copy)";
    list.push(copy);
    selectItem(state.selected.trackKey, copy.id);
    renderAll();
    scheduleSave("Nhân đôi clip");
    toast("Đã nhân đôi phần tử!");
  }

  function applyShotSpeed(shot, newSpeed) {
    const spd = Math.max(0.2, Math.min(4.0, Number(newSpeed) || 1));
    pushUndo(`Đổi tốc độ ${spd}x`);
    const oldEnd = shot.end;
    const srcLen = Math.max(0.3, (shot.trimEnd ?? shot.end) - (shot.trimStart ?? shot.start));
    const newDur = Math.max(0.25, Math.round((srcLen / spd) * 100) / 100);
    shot.speed = spd;
    shot.end = Math.round((shot.start + newDur) * 100) / 100;
    const delta = shot.end - oldEnd;
    state.project.shots.forEach((s) => {
      if (s.id !== shot.id && s.start >= oldEnd - 0.05) {
        s.start = Math.round((s.start + delta) * 100) / 100;
        s.end = Math.round((s.end + delta) * 100) / 100;
      }
    });
    renderAll();
    scheduleSave(`Tốc độ ${spd}x`);
  }

  function applyQuickSlowMo() {
    const hit = getTargetClipOrShot();
    if (!hit || hit.trackKey !== "shots") {
      switchInspectorTab("motion");
      return toast("Chọn một cảnh Video để chỉnh Slow-Mo 0.2x - 4x.");
    }
    const nextSpd = Math.abs((hit.item.speed || 1) - 0.5) < 0.05 ? 1.0 : 0.5;
    applyShotSpeed(hit.item, nextSpd);
    switchInspectorTab("motion");
    toast(`Đã đặt tốc độ ${hit.item.label}: ${nextSpd}x!`);
  }

  function applyQuickFade() {
    const hit = getTargetClipOrShot();
    if (!hit) return toast("Chọn một cảnh hoặc lớp để thêm Fade In / Fade Out.");
    pushUndo("Bật Fade In/Out 0.5s");
    hit.item.fadeIn = hit.item.fadeIn > 0 ? 0 : 0.6;
    hit.item.fadeOut = hit.item.fadeOut > 0 ? 0 : 0.6;
    syncStageAtTime();
    renderInspectorMotion();
    scheduleSave();
    toast(hit.item.fadeIn > 0 ? "Đã bật Fade In / Out 0.6s!" : "Đã tắt Fade In / Out.");
  }

  function addKeyframeAtPlayhead() {
    const hit = getTargetClipOrShot();
    if (!hit) {
      if (!state.project.shots.length && !state.testPattern) state.testPattern = true;
      return toast("Hãy chọn một cảnh, chữ, graphic hoặc B-roll để đặt Keyframe!");
    }
    const { item } = hit;
    pushUndo("Thêm Keyframe");
    item.keyframes = Array.isArray(item.keyframes) ? item.keyframes : [];
    const offset = Math.max(0, Math.min(Math.max(0.1, item.end - item.start), Math.round((state.currentTime - item.start) * 100) / 100));
    const cur = getInterpolatedMotion(item, state.currentTime);
    const existing = item.keyframes.find((k) => Math.abs(k.offset - offset) < 0.08);
    if (existing) {
      existing.scale = Math.round(cur.scale);
      existing.x = Math.round(cur.x * 10) / 10;
      existing.y = Math.round(cur.y * 10) / 10;
      existing.rotation = Math.round(cur.rotation);
      existing.opacity = Math.round(cur.opacity * 100) / 100;
    } else {
      item.keyframes.push({
        id: `kf-${Date.now()}`,
        offset,
        scale: Math.round(cur.scale),
        x: Math.round(cur.x * 10) / 10,
        y: Math.round(cur.y * 10) / 10,
        rotation: Math.round(cur.rotation),
        opacity: Math.round(cur.opacity * 100) / 100,
        volume: Math.round((item.volume ?? 1) * 100) / 100,
        easing: "easeInOut"
      });
    }
    switchInspectorTab("motion");
    renderTimeline();
    renderInspectorMotion();
    scheduleSave("Đặt Keyframe");
    toast(`Đã đặt mốc Keyframe ◆ tại +${offset.toFixed(2)}s!`);
  }

  function applyKeyframePreset(presetName) {
    const hit = getTargetClipOrShot();
    if (!hit) return toast("Chọn một cảnh, chữ hoặc graphic trước khi áp Preset Keyframe!");
    const { item } = hit;
    const dur = Math.max(0.5, item.end - item.start);
    pushUndo(`Preset Keyframe: ${presetName}`);

    if (presetName === "zoom-in") {
      item.keyframes = [
        { id: `kf-${Date.now()}-1`, offset: 0, scale: 100, x: 50, y: 50, rotation: 0, opacity: 1, easing: "linear" },
        { id: `kf-${Date.now()}-2`, offset: dur, scale: 132, x: 50, y: 50, rotation: 0, opacity: 1, easing: "easeInOut" }
      ];
    } else if (presetName === "zoom-out") {
      item.keyframes = [
        { id: `kf-${Date.now()}-1`, offset: 0, scale: 135, x: 50, y: 50, rotation: 0, opacity: 1, easing: "linear" },
        { id: `kf-${Date.now()}-2`, offset: dur, scale: 100, x: 50, y: 50, rotation: 0, opacity: 1, easing: "easeOut" }
      ];
    } else if (presetName === "ken-burns") {
      item.keyframes = [
        { id: `kf-${Date.now()}-1`, offset: 0, scale: 112, x: 45, y: 48, rotation: -1, opacity: 1, easing: "linear" },
        { id: `kf-${Date.now()}-2`, offset: dur, scale: 128, x: 55, y: 52, rotation: 1, opacity: 1, easing: "easeInOut" }
      ];
    } else if (presetName === "pop-in") {
      item.keyframes = [
        { id: `kf-${Date.now()}-1`, offset: 0, scale: 40, x: Number(item.x ?? 50), y: Number(item.y ?? 50), rotation: -6, opacity: 0, easing: "linear" },
        { id: `kf-${Date.now()}-2`, offset: Math.min(0.45, dur * 0.4), scale: 112, x: Number(item.x ?? 50), y: Number(item.y ?? 50), rotation: 2, opacity: 1, easing: "bounce" },
        { id: `kf-${Date.now()}-3`, offset: Math.min(0.7, dur), scale: 100, x: Number(item.x ?? 50), y: Number(item.y ?? 50), rotation: 0, opacity: 1, easing: "easeOut" }
      ];
    } else if (presetName === "slide-up") {
      const tx = Number(item.x ?? 50);
      const ty = Number(item.y ?? 35);
      item.keyframes = [
        { id: `kf-${Date.now()}-1`, offset: 0, scale: 100, x: tx, y: Math.min(92, ty + 20), rotation: 0, opacity: 0, easing: "linear" },
        { id: `kf-${Date.now()}-2`, offset: Math.min(0.6, dur * 0.5), scale: 100, x: tx, y: ty, rotation: 0, opacity: 1, easing: "easeOut" }
      ];
    } else if (presetName === "clear") {
      item.keyframes = [];
    }
    syncStageAtTime();
    renderTimeline();
    renderInspectorMotion();
    scheduleSave();
    toast(presetName === "clear" ? "Đã xóa tất cả Keyframe!" : `Đã áp dụng hiệu ứng chuyển động "${presetName}"!`, "success");
  }

  function toggleTestPattern() {
    state.testPattern = !state.testPattern;
    syncStageAtTime();
  }

  function capturePngSnapshot() {
    if (!elMainVideo || !elMainVideo.src || elMainVideo.readyState < 2) {
      return toast("Chưa có khung hình video để chụp PNG.", "error");
    }
    const canvas = document.createElement("canvas");
    canvas.width = elMainVideo.videoWidth || 1080;
    canvas.height = elMainVideo.videoHeight || 1920;
    const ctx = canvas.getContext("2d");
    ctx.filter = elVideoFilterWrap.style.filter || "none";
    ctx.drawImage(elMainVideo, 0, 0, canvas.width, canvas.height);
    const link = document.createElement("a");
    link.download = `mike_frame_${Math.round(state.currentTime * 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast("Đã chụp & tải khung hình PNG!", "success");
  }

  // TIMELINE RENDERING + DRAG/TRIM + KEYFRAME DIAMONDS
  function renderTimeline() {
    const p = state.project;
    if (!p) return;
    const totalDur = getTotalDuration();
    const px = state.pxPerSec;
    const widthPx = Math.max(elTlScroll.clientWidth || 700, Math.ceil((totalDur + 4) * px));
    elTlCanvas.style.width = `${widthPx}px`;

    elTlRuler.innerHTML = "";
    const step = px >= 50 ? 1 : px >= 28 ? 2 : 5;
    for (let s = 0; s <= totalDur + 3; s += step) {
      const tick = document.createElement("div");
      tick.className = "ruler-tick";
      tick.style.left = `${s * px}px`;
      tick.textContent = `${s}s`;
      elTlRuler.appendChild(tick);
    }

    elTlLanes.innerHTML = "";
    TRACK_META.forEach((m) => {
      const lane = document.createElement("div");
      lane.className = "tl-lane";
      const items = m.key === "shots" ? p.shots : (p.elements[m.key] || []);
      items.forEach((item) => {
        const clip = document.createElement("div");
        const isSel = state.selected?.trackKey === m.key && state.selected?.id === item.id;
        clip.className = `tl-clip ${isSel ? "selected" : ""}`;
        clip.style.left = `${(item.start || 0) * px}px`;
        clip.style.width = `${Math.max(18, ((item.end || 1) - (item.start || 0)) * px)}px`;
        clip.style.background = item.color || m.color;
        const speedTag = (m.key === "shots" && item.speed && Math.abs(item.speed - 1) > 0.05) ? ` (${item.speed}x)` : "";
        const txt = (item.label || item.title || item.text || item.name || item.filterId || "Clip") + speedTag;
        const kfHtml = (item.keyframes || []).map((k) => `<div class="kf-diamond" style="left:${k.offset * px}px"></div>`).join("");
        clip.innerHTML = `
          <div class="tl-clip-handle left"></div>
          <span style="overflow:hidden;text-overflow:ellipsis;">${escapeHtml(txt)}</span>
          ${kfHtml}
          <div class="tl-clip-handle right"></div>
        `;
        attachClipInteract(clip, m.key, item);
        lane.appendChild(clip);
      });
      elTlLanes.appendChild(lane);
    });
    elPlayhead.style.left = `${state.currentTime * px}px`;
  }

  function snapTime(val, trackKey, ignoreId) {
    if (!state.snapEnabled) return val;
    const thr = 8 / state.pxPerSec;
    if (Math.abs(val - state.currentTime) < thr) return state.currentTime;
    const list = getTrackList(trackKey);
    for (const o of list) {
      if (o.id === ignoreId) continue;
      if (Math.abs(val - o.start) < thr) return o.start;
      if (Math.abs(val - o.end) < thr) return o.end;
    }
    return val;
  }

  function attachClipInteract(clipEl, trackKey, item) {
    clipEl.addEventListener("mousedown", (ev) => {
      ev.stopPropagation();
      selectItem(trackKey, item.id);
      const isLeft = ev.target.classList.contains("left");
      const isRight = ev.target.classList.contains("right");
      const startX = ev.clientX;
      const origStart = item.start;
      const origEnd = item.end;
      const len = origEnd - origStart;
      let changed = false;

      const onMove = (me) => {
        const dt = (me.clientX - startX) / state.pxPerSec;
        if (Math.abs(dt) < 0.02 && !changed) return;
        if (!changed) { pushUndo("Kéo chỉnh clip"); changed = true; }

        if (isLeft) {
          const ns = snapTime(Math.max(0, Math.min(origEnd - 0.25, origStart + dt)), trackKey, item.id);
          if (trackKey === "shots") {
            const diff = ns - item.start;
            item.trimStart = Math.max(0, (item.trimStart ?? 0) + diff * (item.speed || 1));
          }
          item.start = Math.round(ns * 100) / 100;
        } else if (isRight) {
          const ne = snapTime(Math.max(origStart + 0.25, origEnd + dt), trackKey, item.id);
          if (trackKey === "shots") {
            const diff = ne - item.end;
            item.trimEnd = Math.max(0.25, (item.trimEnd ?? (item.trimStart + len)) + diff * (item.speed || 1));
          }
          item.end = Math.round(ne * 100) / 100;
        } else {
          const ns = snapTime(Math.max(0, origStart + dt), trackKey, item.id);
          item.start = Math.round(ns * 100) / 100;
          item.end = Math.round((item.start + len) * 100) / 100;
        }
        clipEl.style.left = `${item.start * state.pxPerSec}px`;
        clipEl.style.width = `${Math.max(18, (item.end - item.start) * state.pxPerSec)}px`;
        syncStageAtTime();
        renderInspectorProps();
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        if (changed) { renderTimeline(); scheduleSave(); }
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });
  }

  // RIGHT INSPECTOR (4 TABS: PROPS / MOTION & KEYFRAME / COLOR / LAYERS)
  function switchInspectorTab(tab) {
    state.inspectorTab = tab;
    document.querySelectorAll(".ins-tab").forEach((x) => x.classList.toggle("active", x.dataset.itab === tab));
    document.querySelectorAll(".ins-panel").forEach((x) => x.classList.remove("active"));
    $(`ins-panel-${tab}`).classList.add("active");
  }

  function selectItem(trackKey, id) {
    state.selected = { trackKey, id };
    renderTimeline();
    syncStageAtTime();
    renderInspectorProps();
    renderInspectorMotion();
  }

  function renderInspectorProps() {
    const panel = $("ins-panel-props");
    const item = state.selected ? findItem(state.selected) : null;
    if (!item) {
      panel.innerHTML = `
        <div class="ins-section">
          <div class="ins-title">Thông Tin Dự Án</div>
          <div class="lib-sub">Bấm chọn một cảnh hoặc lớp trên Timeline để chỉnh thuộc tính, Zoom/Scale, Keyframe và Slow-Mo.</div>
          <div class="field-group">
            <label class="field-lbl">Âm lượng Video gốc <span>${Math.round((state.project?.video?.volume ?? 1) * 100)}%</span></label>
            <input id="main-vol-slider" class="slider-input" type="range" min="0" max="150" value="${Math.round((state.project?.video?.volume ?? 1) * 100)}" />
          </div>
          <div class="lib-sub">Tổng thời lượng: <strong>${fmtTime(getTotalDuration())}</strong></div>
        </div>
      `;
      panel.querySelector("#main-vol-slider")?.addEventListener("input", (e) => {
        state.project.video.volume = Number(e.target.value) / 100;
        syncStageAtTime();
        scheduleSave();
      });
      return;
    }

    const tk = state.selected.trackKey;
    const html = [`<div class="ins-section"><div class="ins-title">Thuộc Tính: ${tk.toUpperCase()}</div>`];
    html.push(`
      <div class="field-row-2">
        <div class="field-group"><label class="field-lbl">Bắt đầu (s)</label><input class="field-input" data-prop="start" type="number" step="0.1" value="${item.start ?? 0}" /></div>
        <div class="field-group"><label class="field-lbl">Kết thúc (s)</label><input class="field-input" data-prop="end" type="number" step="0.1" value="${item.end ?? 2}" /></div>
      </div>
    `);
    if ("label" in item) html.push(`<div class="field-group"><label class="field-lbl">Nhãn</label><input class="field-input" data-prop="label" type="text" value="${escapeAttr(item.label)}" /></div>`);
    if ("title" in item) html.push(`<div class="field-group"><label class="field-lbl">Tiêu đề</label><input class="field-input" data-prop="title" type="text" value="${escapeAttr(item.title)}" /></div>`);
    if ("subtitle" in item) html.push(`<div class="field-group"><label class="field-lbl">Phụ đề nhỏ</label><input class="field-input" data-prop="subtitle" type="text" value="${escapeAttr(item.subtitle)}" /></div>`);
    if ("text" in item) html.push(`<div class="field-group"><label class="field-lbl">Nội dung</label><textarea class="field-textarea" rows="3" data-prop="text">${escapeHtml(item.text)}</textarea></div>`);

    if (["extraText", "graphics", "subtitles"].includes(tk)) {
      const fOpts = state.library.fonts.slice(0, 60).map((fn) =>
        `<option value="${escapeAttr(fn.fontFamily)}" ${item.fontFamily === fn.fontFamily ? "selected" : ""}>${escapeHtml(fn.name)}</option>`
      ).join("");
      html.push(`<div class="field-group"><label class="field-lbl">Font Chữ</label><select class="field-select" data-prop="fontFamily">${fOpts}</select></div>`);
    }

    if ("transition" in item) {
      const opts = state.library.transitions.map((t) => `<option value="${t.id}" ${item.transition === t.id ? "selected" : ""}>${t.name}</option>`).join("");
      html.push(`<div class="field-group"><label class="field-lbl">Chuyển cảnh vào</label><select class="field-select" data-prop="transition">${opts}</select></div>`);
    }
    if ("x" in item || "posX" in item) {
      html.push(`
        <div class="field-row-2">
          <div class="field-group"><label class="field-lbl">X (%)</label><input class="field-input" data-prop="${"x" in item ? "x" : "posX"}" type="number" min="-50" max="150" value="${item.x ?? item.posX ?? 50}" /></div>
          <div class="field-group"><label class="field-lbl">Y (%)</label><input class="field-input" data-prop="${"y" in item ? "y" : "posY"}" type="number" min="-50" max="150" value="${item.y ?? item.posY ?? 50}" /></div>
        </div>
      `);
    }
    if ("fontSize" in item) html.push(`<div class="field-group"><label class="field-lbl">Cỡ chữ (px)</label><input class="field-input" data-prop="fontSize" type="number" min="10" max="72" value="${item.fontSize ?? 22}" /></div>`);
    if ("textColor" in item) {
      html.push(`
        <div class="field-row-2">
          <div class="field-group"><label class="field-lbl">Màu chữ</label><input class="field-input" data-prop="textColor" type="color" value="${toHexColor(item.textColor, "#ffffff")}" /></div>
          <div class="field-group"><label class="field-lbl">Màu nền</label><input class="field-input" data-prop="bgColor" type="color" value="${toHexColor(item.bgColor, "#1e293b")}" /></div>
        </div>
      `);
    }
    if ("volume" in item) {
      html.push(`
        <div class="field-group">
          <label class="field-lbl">Âm lượng <span>${Math.round((item.volume ?? 0.8) * 100)}%</span></label>
          <input class="slider-input" data-prop="volume" type="range" min="0" max="150" value="${Math.round((item.volume ?? 0.8) * 100)}" />
        </div>
      `);
    }
    html.push(`
      <div class="field-row-2" style="margin-top:6px;">
        <button class="btn-chip" id="ins-btn-split">✂️ Cắt đôi</button>
        <button class="btn-chip" style="color:var(--danger)" id="ins-btn-del">🗑️ Xóa mục</button>
      </div>
    </div>`);

    panel.innerHTML = html.join("");
    panel.querySelectorAll("[data-prop]").forEach((inp) => {
      const prop = inp.dataset.prop;
      inp.addEventListener("input", () => {
        if (prop === "volume") item[prop] = Number(inp.value) / 100;
        else if (inp.type === "number") item[prop] = Number(inp.value);
        else {
          item[prop] = inp.value;
          if (prop === "bgColor" && "bgHighlight" in item) item.bgHighlight = true;
        }
        syncStageAtTime();
        renderTimeline();
        scheduleSave();
      });
    });
    panel.querySelector("#ins-btn-split")?.addEventListener("click", splitAtPlayhead);
    panel.querySelector("#ins-btn-del")?.addEventListener("click", deleteSelected);
  }

  function renderInspectorMotion() {
    const panel = $("ins-panel-motion");
    const hit = getTargetClipOrShot();
    if (!hit) {
      panel.innerHTML = `<div class="ins-section"><div class="ins-title">Chuyển động & Keyframe</div><div class="lib-sub">Chọn một cảnh Video, Chữ, Graphic hoặc B-roll trên Timeline để chỉnh Slow-Mo, Phóng to/Thu nhỏ, Fade In/Out & Keyframe.</div></div>`;
      return;
    }
    const { trackKey, item } = hit;
    const isShot = trackKey === "shots";
    const kfs = Array.isArray(item.keyframes) ? item.keyframes.slice().sort((a, b) => a.offset - b.offset) : [];

    panel.innerHTML = `
      ${isShot ? `
        <div class="ins-section">
          <div class="ins-title">🐢 Tốc Độ / Slow Motion (${Number(item.speed || 1).toFixed(2)}x)</div>
          <div class="speed-pill-row">
            ${[0.25, 0.5, 0.75, 1, 1.5, 2, 4].map((sp) =>
              `<button class="speed-pill ${Math.abs((item.speed || 1) - sp) < 0.03 ? "active" : ""}" data-spd="${sp}">${sp}x</button>`
            ).join("")}
          </div>
          <input id="shot-speed-slider" class="slider-input" type="range" min="20" max="400" step="5" value="${Math.round((item.speed || 1) * 100)}" />
        </div>
      ` : ""}

      <div class="ins-section">
        <div class="ins-title">🔍 Phóng To / Thu Nhỏ & Xoay</div>
        <div class="field-group">
          <label class="field-lbl">Zoom / Scale <span id="lbl-scale">${item.scale ?? 100}%</span></label>
          <input id="mo-scale" class="slider-input" type="range" min="25" max="300" value="${item.scale ?? 100}" />
        </div>
        <div class="field-group">
          <label class="field-lbl">Xoay (Rotation) <span id="lbl-rot">${item.rotation ?? 0}°</span></label>
          <input id="mo-rot" class="slider-input" type="range" min="-180" max="180" value="${item.rotation ?? 0}" />
        </div>
        ${isShot ? `
          <div class="field-row-2">
            <button class="btn-chip" id="mo-fliph">${item.flipH ? "✓ Đang Lật Ngang" : "↔️ Lật Ngang"}</button>
            <button class="btn-chip" id="mo-flipv">${item.flipV ? "✓ Đang Lật Dọc" : "↕️ Lật Dọc"}</button>
          </div>
        ` : ""}
      </div>

      <div class="ins-section">
        <div class="ins-title">🌅 Fade In / Fade Out</div>
        <div class="field-group">
          <label class="field-lbl">Fade In (Mờ vào) <span id="lbl-fi">${item.fadeIn ?? 0}s</span></label>
          <input id="mo-fi" class="slider-input" type="range" min="0" max="4" step="0.1" value="${item.fadeIn ?? 0}" />
        </div>
        <div class="field-group">
          <label class="field-lbl">Fade Out (Mờ ra) <span id="lbl-fo">${item.fadeOut ?? 0}s</span></label>
          <input id="mo-fo" class="slider-input" type="range" min="0" max="4" step="0.1" value="${item.fadeOut ?? 0}" />
        </div>
      </div>

      <div class="ins-section">
        <div class="ins-title">💎 Keyframes (${kfs.length} mốc)</div>
        <button class="btn-chip accent" id="mo-add-kf">💎 + Thêm Keyframe Tại Đầu Phát</button>
        <div class="preset-pill-grid">
          <button class="speed-pill" data-kfp="zoom-in">🔍 Zoom In</button>
          <button class="speed-pill" data-kfp="zoom-out">🔎 Zoom Out</button>
          <button class="speed-pill" data-kfp="ken-burns">🎥 Ken Burns</button>
          <button class="speed-pill" data-kfp="pop-in">💥 Pop Nảy</button>
          <button class="speed-pill" data-kfp="slide-up">⬆️ Trượt Lên</button>
          <button class="speed-pill" data-kfp="clear" style="color:var(--danger)">🗑️ Xóa Hết KF</button>
        </div>
        <div id="kf-list-wrap" style="display:flex;flex-direction:column;gap:4px;">
          ${kfs.map((k) => `
            <div class="lib-row">
              <div class="lib-row-main">
                <div class="lib-name">◆ +${k.offset.toFixed(2)}s (${k.scale}% • ${k.easing || "easeInOut"})</div>
                <div class="lib-sub">X:${k.x}% Y:${k.y}% Op:${Math.round((k.opacity ?? 1) * 100)}%</div>
              </div>
              <button class="btn-mini act-kf-jump" data-off="${k.offset}">▶</button>
              <button class="btn-mini act-kf-del" data-kfid="${k.id}">✕</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    panel.querySelectorAll("[data-spd]").forEach((b) => {
      b.onclick = () => applyShotSpeed(item, Number(b.dataset.spd));
    });
    panel.querySelector("#shot-speed-slider")?.addEventListener("change", (e) => {
      applyShotSpeed(item, Number(e.target.value) / 100);
    });
    panel.querySelector("#mo-scale").oninput = (e) => {
      item.scale = Number(e.target.value);
      panel.querySelector("#lbl-scale").textContent = `${item.scale}%`;
      syncStageAtTime();
      scheduleSave();
    };
    panel.querySelector("#mo-rot").oninput = (e) => {
      item.rotation = Number(e.target.value);
      panel.querySelector("#lbl-rot").textContent = `${item.rotation}°`;
      syncStageAtTime();
      scheduleSave();
    };
    panel.querySelector("#mo-fliph")?.addEventListener("click", () => {
      item.flipH = !item.flipH;
      syncStageAtTime();
      renderInspectorMotion();
      scheduleSave();
    });
    panel.querySelector("#mo-flipv")?.addEventListener("click", () => {
      item.flipV = !item.flipV;
      syncStageAtTime();
      renderInspectorMotion();
      scheduleSave();
    });
    panel.querySelector("#mo-fi").oninput = (e) => {
      item.fadeIn = Number(e.target.value);
      panel.querySelector("#lbl-fi").textContent = `${item.fadeIn}s`;
      syncStageAtTime();
      scheduleSave();
    };
    panel.querySelector("#mo-fo").oninput = (e) => {
      item.fadeOut = Number(e.target.value);
      panel.querySelector("#lbl-fo").textContent = `${item.fadeOut}s`;
      syncStageAtTime();
      scheduleSave();
    };
    panel.querySelector("#mo-add-kf").onclick = addKeyframeAtPlayhead;
    panel.querySelectorAll("[data-kfp]").forEach((b) => {
      b.onclick = () => applyKeyframePreset(b.dataset.kfp);
    });
    panel.querySelectorAll(".act-kf-jump").forEach((b) => {
      b.onclick = () => seekTo(item.start + Number(b.dataset.off));
    });
    panel.querySelectorAll(".act-kf-del").forEach((b) => {
      b.onclick = () => {
        pushUndo("Xóa mốc Keyframe");
        item.keyframes = (item.keyframes || []).filter((k) => k.id !== b.dataset.kfid);
        syncStageAtTime();
        renderTimeline();
        renderInspectorMotion();
        scheduleSave();
      };
    });
  }

  function renderInspectorColor() {
    const p = state.project;
    if (!p) return;
    const cg = p.colorGrade;
    const sliders = [
      ["brightness", "Độ sáng (Brightness)", -50, 50],
      ["contrast", "Tương phản (Contrast)", -50, 50],
      ["saturation", "Độ bão hòa (Saturation)", -100, 100],
      ["temperature", "Nhiệt độ (Warm/Cool)", -50, 50],
      ["tint", "Ám sắc (Tint)", -50, 50],
      ["vignette", "Viền tối (Vignette)", 0, 100],
      ["sharpen", "Độ sắc nét (Sharpen)", 0, 100],
      ["blur", "Làm mờ (Blur)", 0, 20]
    ];
    const lutOpts = state.library.luts.map((l) => `<option value="${l.id}" ${cg.lut === l.id ? "selected" : ""}>${escapeHtml(l.name)}</option>`).join("");
    const panel = $("ins-panel-color");
    panel.innerHTML = `
      <div class="ins-section">
        <div class="ins-title">Preset Màu LUT (200 Mẫu)</div>
        <select id="ins-lut-select" class="field-select">${lutOpts}</select>
      </div>
      <div class="ins-section">
        <div class="ins-title">Thanh Trượt Chỉnh Màu</div>
        ${sliders.map(([k, lbl, min, max]) => `
          <div class="field-group">
            <label class="field-lbl">${lbl} <span id="cg-val-${k}">${cg[k] ?? 0}</span></label>
            <input class="slider-input cg-slider" data-cg="${k}" type="range" min="${min}" max="${max}" value="${cg[k] ?? 0}" />
          </div>
        `).join("")}
        <button class="btn-chip" id="btn-reset-color">↺ Đặt lại thông số màu</button>
      </div>
    `;
    panel.querySelector("#ins-lut-select").onchange = (e) => {
      pushUndo("Đổi LUT màu");
      cg.lut = e.target.value;
      syncStageAtTime();
      renderLibraryDrawer();
      scheduleSave();
    };
    panel.querySelectorAll(".cg-slider").forEach((sl) => {
      sl.oninput = () => {
        const key = sl.dataset.cg;
        cg[key] = Number(sl.value);
        panel.querySelector(`#cg-val-${key}`).textContent = sl.value;
        syncStageAtTime();
        scheduleSave();
      };
    });
    panel.querySelector("#btn-reset-color").onclick = () => {
      pushUndo("Đặt lại màu");
      p.colorGrade = { lut: "none", brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, vignette: 0, sharpen: 0, blur: 0 };
      renderInspectorColor();
      syncStageAtTime();
      renderLibraryDrawer();
      scheduleSave();
    };
  }

  function renderInspectorLayers() {
    const p = state.project;
    if (!p) return;
    const panel = $("ins-panel-layers");
    const chunks = [];
    TRACK_META.forEach((m) => {
      const list = m.key === "shots" ? p.shots : (p.elements[m.key] || []);
      chunks.push(`<div class="ins-section"><div class="ins-title">${m.label} (${list.length})</div>`);
      if (!list.length) chunks.push(`<div class="lib-sub">Trống</div>`);
      else {
        list.forEach((item) => {
          const isSel = state.selected?.trackKey === m.key && state.selected?.id === item.id;
          const lbl = item.label || item.title || item.text || item.name || item.filterId;
          chunks.push(`
            <div class="lib-row layer-jump" data-tk="${m.key}" data-id="${item.id}" style="${isSel ? "border-color:var(--accent)" : ""};cursor:pointer;">
              <div class="lib-row-main">
                <div class="lib-name">${escapeHtml(lbl)}</div>
                <div class="lib-sub">${fmtTime(item.start)} → ${fmtTime(item.end)}</div>
              </div>
            </div>
          `);
        });
      }
      chunks.push(`</div>`);
    });
    panel.innerHTML = chunks.join("");
    panel.querySelectorAll(".layer-jump").forEach((el) => {
      el.onclick = () => {
        selectItem(el.dataset.tk, el.dataset.id);
        const item = findItem(state.selected);
        if (item) seekTo(item.start + 0.05);
      };
    });
  }

  // MODALS
  function openModal(id) {
    $(id).classList.remove("hidden");
    if (id === "modal-storyboard") renderStoryboardModal();
    if (id === "modal-brand") renderBrandModal();
    if (id === "modal-history") renderHistoryModal();
  }
  function closeModal(id) { $(id).classList.add("hidden"); }

  function renderStoryboardModal() {
    const body = $("storyboard-body");
    const shots = state.project?.shots || [];
    body.innerHTML = `
      <table class="sb-table">
        <thead><tr><th>Cảnh</th><th>Nhãn</th><th>Bắt đầu</th><th>Kết thúc</th><th>Tốc độ</th><th>Chuyển cảnh</th><th>Hành động</th></tr></thead>
        <tbody>
          ${shots.map((s, i) => `
            <tr data-id="${s.id}">
              <td><strong>#${i + 1}</strong></td>
              <td><input class="field-input sb-lbl" value="${escapeAttr(s.label)}" /></td>
              <td><input class="field-input sb-st" type="number" step="0.1" style="width:68px" value="${s.start}" /></td>
              <td><input class="field-input sb-en" type="number" step="0.1" style="width:68px" value="${s.end}" /></td>
              <td>${Number(s.speed || 1).toFixed(2)}x</td>
              <td><select class="field-select sb-tr">${state.library.transitions.map((tr) => `<option value="${tr.id}" ${s.transition === tr.id ? "selected" : ""}>${tr.name}</option>`).join("")}</select></td>
              <td><button class="btn-mini sb-jump">▶ Tới</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    body.querySelectorAll("tr[data-id]").forEach((row) => {
      const s = shots.find((x) => x.id === row.dataset.id);
      if (!s) return;
      row.querySelector(".sb-lbl").oninput = (e) => { s.label = e.target.value; renderTimeline(); scheduleSave(); };
      row.querySelector(".sb-st").onchange = (e) => { s.start = Number(e.target.value); renderTimeline(); scheduleSave(); };
      row.querySelector(".sb-en").onchange = (e) => { s.end = Number(e.target.value); renderTimeline(); scheduleSave(); };
      row.querySelector(".sb-tr").onchange = (e) => { s.transition = e.target.value; scheduleSave(); };
      row.querySelector(".sb-jump").onclick = () => { seekTo(s.start + 0.05); closeModal("modal-storyboard"); };
    });
  }

  function renderBrandModal() {
    const bc = state.project?.brandColors || {};
    $("brand-body").innerHTML = `
      <div class="field-row-2">
        <div class="field-group"><label class="field-lbl">Màu chính (Primary)</label><input id="bc-primary" class="field-input" type="color" value="${bc.primary || "#38bdf8"}" /></div>
        <div class="field-group"><label class="field-lbl">Màu phụ (Secondary)</label><input id="bc-secondary" class="field-input" type="color" value="${bc.secondary || "#a855f7"}" /></div>
        <div class="field-group"><label class="field-lbl">Màu nhấn (Accent)</label><input id="bc-accent" class="field-input" type="color" value="${bc.accent || "#f59e0b"}" /></div>
        <div class="field-group"><label class="field-lbl">Nền thẻ (Card BG)</label><input id="bc-bg" class="field-input" type="color" value="${bc.bg || "#0f172a"}" /></div>
      </div>
    `;
    [["bc-primary", "primary"], ["bc-secondary", "secondary"], ["bc-accent", "accent"], ["bc-bg", "bg"]].forEach(([domId, key]) => {
      $(domId).oninput = (e) => { bc[key] = e.target.value; scheduleSave(); };
    });
  }

  function renderHistoryModal() {
    const body = $("history-body");
    if (!state.history.length) {
      body.innerHTML = `<div class="lib-sub">Chưa có bản lưu lịch sử nào.</div>`;
      return;
    }
    body.innerHTML = state.history.map((h) => `
      <div class="lib-row">
        <div class="lib-row-main">
          <div class="lib-name">${escapeHtml(h.label)}</div>
          <div class="lib-sub">${new Date(h.timestamp).toLocaleString("vi-VN")}</div>
        </div>
        <button class="btn-mini act-restore" data-id="${h.id}">↺ Khôi phục</button>
      </div>
    `).join("");
    body.querySelectorAll(".act-restore").forEach((btn) => {
      btn.onclick = async () => {
        const res = await fetch("/api/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: btn.dataset.id })
        });
        const data = await res.json();
        if (data.ok) {
          state.project = normalizeProject(data.project);
          closeModal("modal-history");
          renderAll();
          toast("Đã khôi phục phiên bản!", "success");
        }
      };
    });
  }

  // UPLOAD / IMPORT
  function attachDropTarget(el, fixedMode = null) {
    if (!el) return;
    el.addEventListener("dragover", (e) => { e.preventDefault(); el.classList.add("dragover"); });
    el.addEventListener("dragleave", () => el.classList.remove("dragover"));
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      el.classList.remove("dragover");
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) uploadMultipleFiles(files, fixedMode);
    });
  }

  async function uploadMultipleFiles(files, fixedMode = null) {
    const mode = fixedMode || document.querySelector('input[name="upload-mode"]:checked')?.value || "append";
    const status = $("import-status");
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const action = (i === 0 && mode === "replace") ? "replace" : mode;
      if (status) status.textContent = `Đang nạp (${i + 1}/${files.length}): ${f.name}...`;
      const res = await fetch(`/api/upload-media?name=${encodeURIComponent(f.name)}&action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream", "X-File-Name": encodeURIComponent(f.name) },
        body: f
      });
      const data = await res.json();
      if (data.ok) state.project = normalizeProject(data.project);
    }
    if (status) status.textContent = `✓ Đã nạp xong ${files.length} tài nguyên!`;
    renderAll();
    closeModal("modal-import");
    toast(`Đã nhập ${files.length} file vào Studio!`, "success");
  }

  async function exportProjectVideo() {
    openModal("modal-export");
    const ar = state.project.aspectRatio || "9:16";
    const body = $("export-body");
    body.innerHTML = `<div class="lib-name">⏳ Đang render video chuẩn ${ar} bằng FFmpeg Pro...</div><div class="lib-sub">Đang xử lý cắt ghép, Slow-Mo, Fade In/Out, LUT màu, VFX, phụ đề và hòa âm SFX/BGM...</div>`;
    try {
      await persistProject("Trước khi xuất MP4");
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: state.project })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Xuất video thất bại");
      const mb = (data.bytes / (1024 * 1024)).toFixed(2);
      body.innerHTML = `
        <div class="lib-name" style="color:var(--success)">✅ Xuất Video Thành Công!</div>
        <div class="lib-sub">Định dạng: ${data.resolution} (${data.aspectRatio}) • Dung lượng: ${mb} MB</div>
        <video src="${data.url}" controls style="width:100%;max-height:320px;border-radius:10px;background:#000;"></video>
        <a href="${data.url}" download="${data.file}" class="btn-export" style="text-align:center;text-decoration:none;">⬇️ Tải Video MP4 Về Máy</a>
      `;
      toast("Render video hoàn tất!", "success");
    } catch (e) {
      body.innerHTML = `<div class="lib-name" style="color:var(--danger)">❌ Lỗi xuất video: ${escapeHtml(e.message)}</div>`;
    }
  }

  function renderAll() {
    if (!state.project) return;
    $("project-title-input").value = state.project.name || "Dự án mới";
    $("speed-select").value = String(state.project.playbackRate || 1);
    applyTheme(state.project.themeMode || "dark");
    fitStageFrame();
    renderLibraryDrawer();
    renderInspectorProps();
    renderInspectorMotion();
    renderInspectorColor();
    renderInspectorLayers();
    renderTimeline();
    syncStageAtTime(true);
  }

  function bindEvents() {
    window.addEventListener("resize", fitStageFrame);
    if (window.ResizeObserver) new ResizeObserver(fitStageFrame).observe(elStageViewport);

    document.querySelectorAll(".rail-btn").forEach((b) => { b.onclick = () => setActiveTab(b.dataset.tab); });
    $("library-search").oninput = (e) => { state.searchQuery = e.target.value; renderLibraryDrawer(); };

    $("project-title-input").oninput = (e) => { state.project.name = e.target.value; scheduleSave(); };
    document.querySelectorAll(".aspect-btn").forEach((btn) => {
      btn.onclick = () => { pushUndo(`Đổi tỷ lệ ${btn.dataset.ratio}`); state.project.aspectRatio = btn.dataset.ratio; fitStageFrame(); scheduleSave(); };
    });
    $("btn-theme").onclick = () => { applyTheme(state.project.themeMode === "dark" ? "light" : "dark"); scheduleSave(); };
    $("btn-storyboard").onclick = () => openModal("modal-storyboard");
    $("btn-brand").onclick = () => openModal("modal-brand");
    $("btn-import-modal").onclick = () => openModal("modal-import");
    $("btn-empty-upload").onclick = () => openModal("modal-import");
    $("btn-empty-test-pattern").onclick = toggleTestPattern;
    $("btn-toggle-test-pattern").onclick = toggleTestPattern;
    $("btn-history").onclick = () => openModal("modal-history");
    $("btn-undo").onclick = undo;
    $("btn-redo").onclick = redo;
    $("btn-save").onclick = async () => { await persistProject("Lưu thủ công"); toast("Đã lưu dự án!", "success"); };
    $("btn-export").onclick = exportProjectVideo;

    $("btn-reset").onclick = async () => {
      const res = await fetch("/api/reset-demo", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        state.project = normalizeProject(data.project);
        state.selected = null;
        state.testPattern = false;
        seekTo(0);
        renderAll();
        toast("Đã tạo dự án trống mới!", "success");
      }
    };

    $("btn-toggle-safe").onclick = () => {
      state.safeZone = !state.safeZone;
      $("btn-toggle-safe").classList.toggle("active", state.safeZone);
      $("safe-zone-overlay").classList.toggle("hidden", !state.safeZone);
    };
    $("btn-toggle-guide").onclick = () => {
      state.faceGuide = !state.faceGuide;
      $("btn-toggle-guide").classList.toggle("active", state.faceGuide);
      $("face-guide-overlay").classList.toggle("hidden", !state.faceGuide);
    };

    $("btn-play").onclick = togglePlay;
    $("btn-seek-start").onclick = () => seekTo(0);
    $("btn-seek-end").onclick = () => seekTo(getTotalDuration());
    $("speed-select").onchange = (e) => { state.project.playbackRate = Number(e.target.value) || 1; syncStageAtTime(); scheduleSave(); };
    $("btn-mute").onclick = () => {
      state.isMuted = !state.isMuted;
      $("btn-mute").textContent = state.isMuted ? "🔇" : "🔊";
      elMainVideo.muted = state.isMuted;
      if (state.isMuted) stopAllAudioPlayers();
    };
    $("btn-split").onclick = splitAtPlayhead;
    $("btn-ripple-delete").onclick = rippleDeleteSelected;
    $("btn-quick-slowmo").onclick = applyQuickSlowMo;
    $("btn-quick-fade").onclick = applyQuickFade;
    $("btn-add-keyframe").onclick = addKeyframeAtPlayhead;
    $("btn-duplicate").onclick = duplicateSelected;
    $("btn-delete-selected").onclick = deleteSelected;
    $("btn-clear-timeline").onclick = clearTimelineShots;
    $("btn-snapshot").onclick = capturePngSnapshot;

    document.querySelectorAll(".ins-tab").forEach((t) => {
      t.onclick = () => switchInspectorTab(t.dataset.itab);
    });

    $("btn-snap").onclick = () => { state.snapEnabled = !state.snapEnabled; $("btn-snap").classList.toggle("active", state.snapEnabled); };
    $("timeline-zoom").oninput = (e) => { state.pxPerSec = Number(e.target.value); renderTimeline(); };
    $("btn-fit-timeline").onclick = () => {
      const avail = Math.max(400, (elTlScroll.clientWidth || 700) - 40);
      state.pxPerSec = Math.max(14, Math.min(120, Math.floor(avail / getTotalDuration())));
      $("timeline-zoom").value = String(state.pxPerSec);
      renderTimeline();
    };

    document.querySelectorAll(".tl-add-btn").forEach((b) => {
      b.onclick = () => {
        const type = b.dataset.add;
        if (type === "vfx") setActiveTab("vfx");
        else if (type === "audio") setActiveTab("sfx");
        else if (type === "graphics") setActiveTab("graphics");
        else if (type === "extraText") {
          pushUndo("Thêm chữ mới");
          const st = Math.round(state.currentTime * 100) / 100;
          const item = { id: `txt-${Date.now()}`, text: "Chữ Nổi Mới", start: st, end: Math.round((st + 3) * 100) / 100, x: 50, y: 20, fontSize: 26, textColor: "#facc15", strokeColor: "#000000", bgColor: "transparent", uppercase: true, bgHighlight: false, scale: 100, rotation: 0, opacity: 1, fadeIn: 0.2, fadeOut: 0.2, keyframes: [] };
          state.project.elements.extraText.push(item);
          selectItem("extraText", item.id);
          renderAll();
          scheduleSave();
        } else if (type === "subtitles") {
          pushUndo("Thêm phụ đề");
          const st = Math.round(state.currentTime * 100) / 100;
          const item = { id: `sub-${Date.now()}`, start: st, end: Math.round((st + 2.5) * 100) / 100, text: "Nhập phụ đề...", style: "hormozi" };
          state.project.elements.subtitles.push(item);
          selectItem("subtitles", item.id);
          renderAll();
          scheduleSave();
        } else if (type === "brolls") {
          const vid = state.project.mediaPool.find((m) => m.kind === "video" || m.kind === "image");
          if (vid) addBrollFromMedia(vid);
          else toast("Tải ít nhất 1 video hoặc ảnh lên Tài nguyên trước!", "error");
        }
      };
    });

    elTlRuler.addEventListener("mousedown", (ev) => {
      const scrub = (me) => {
        const rect = elTlRuler.getBoundingClientRect();
        seekTo(Math.max(0, me.clientX - rect.left) / state.pxPerSec);
      };
      scrub(ev);
      const up = () => { window.removeEventListener("mousemove", scrub); window.removeEventListener("mouseup", up); };
      window.addEventListener("mousemove", scrub);
      window.addEventListener("mouseup", up);
    });

    document.querySelectorAll("[data-close]").forEach((btn) => { btn.onclick = () => closeModal(btn.dataset.close); });
    $("btn-sb-add-shot").onclick = () => {
      const m = state.project.mediaPool.find((x) => x.kind === "video");
      if (!m) return toast("Kho tài nguyên chưa có video để thêm cảnh.", "error");
      pushUndo("Thêm cảnh Storyboard");
      const lastEnd = state.project.shots.length ? Math.max(...state.project.shots.map((s) => s.end)) : 0;
      state.project.shots.push(createShotObj(m, lastEnd));
      renderStoryboardModal();
      renderTimeline();
      scheduleSave();
    };
    $("btn-sb-copy-json").onclick = () => { navigator.clipboard?.writeText(JSON.stringify(state.project.shots, null, 2)); toast("Đã copy JSON phân cảnh!"); };
    $("btn-apply-brand").onclick = () => {
      pushUndo("Áp màu thương hiệu");
      const bc = state.project.brandColors;
      (state.project.elements.graphics || []).forEach((g) => { g.bgColor = bc.bg; g.accentColor = bc.primary; });
      (state.project.elements.extraText || []).forEach((t) => { t.textColor = bc.accent; });
      closeModal("modal-brand");
      renderAll();
      scheduleSave();
      toast("Đã áp dụng bảng màu thương hiệu!", "success");
    };

    attachDropTarget(elEmptyOverlay, "append");
    attachDropTarget($("import-drop-zone"));
    $("btn-browse-files").onclick = () => $("hidden-file-input").click();
    $("hidden-file-input").onchange = (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length) uploadMultipleFiles(files);
      e.target.value = "";
    };
    $("btn-import-url-go").onclick = async () => {
      const url = $("import-url-input").value.trim();
      if (!url) return toast("Nhập link video trước!", "error");
      $("import-status").textContent = "⏳ Đang tải video bằng yt-dlp...";
      try {
        const res = await fetch("/api/import-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Tải URL thất bại");
        state.project = normalizeProject(data.project);
        seekTo(0);
        renderAll();
        closeModal("modal-import");
        toast("Đã tải video từ link thành công!", "success");
      } catch (e) {
        $("import-status").textContent = `❌ Lỗi: ${e.message}`;
      }
    };

    window.addEventListener("keydown", (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      else if (e.key === "s" || e.key === "S") {
        if (e.ctrlKey) { e.preventDefault(); persistProject("Ctrl+S"); toast("Đã lưu!"); }
        else { e.preventDefault(); splitAtPlayhead(); }
      } else if (e.key === "k" || e.key === "K") { e.preventDefault(); addKeyframeAtPlayhead(); }
      else if (e.key === "d" || e.key === "D") { e.preventDefault(); duplicateSelected(); }
      else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelected(); }
      else if (e.ctrlKey && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
      else if (e.ctrlKey && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
      else if (e.key === "ArrowLeft") seekTo(state.currentTime - 0.5);
      else if (e.key === "ArrowRight") seekTo(state.currentTime + 0.5);
    });
  }

  async function init() {
    try {
      const [libRes, projRes] = await Promise.all([
        fetch("/api/library").then((r) => r.json()),
        fetch("/api/project").then((r) => r.json())
      ]);
      if (libRes.ok) state.library = libRes;
      if (projRes.ok) {
        state.project = normalizeProject(projRes.project);
        state.history = projRes.history || [];
      }
      bindEvents();
      renderAll();
    } catch (e) {
      toast("Không thể tải dữ liệu từ server: " + e.message, "error");
    }
  }

  init();
})();
