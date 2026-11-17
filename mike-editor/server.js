const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { SFX_DEFINITIONS, generateAllSfx } = require("./generate-sfx");
const {
  COLOR_LUTS,
  VFX_FILTERS,
  GRAPHIC_PRESETS,
  TEXT_STYLES,
  FONT_PRESETS,
  TRANSITIONS
} = require("./catalog-generator");

const HOST = "127.0.0.1";
const PORT = 5230;

const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const ASSETS_DIR = path.join(PUBLIC_DIR, "assets");
const UPLOADS_DIR = path.join(ASSETS_DIR, "uploads");
const SFX_DIR = path.join(ASSETS_DIR, "sfx");
const RENDERS_DIR = path.join(ROOT_DIR, "renders");
const PROJECT_FILE = path.join(ROOT_DIR, "project.json");
const HISTORY_FILE = path.join(ROOT_DIR, "history.json");

[ASSETS_DIR, UPLOADS_DIR, SFX_DIR, RENDERS_DIR].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

const existingSfxCount = SFX_DEFINITIONS.filter((s) => fs.existsSync(path.join(SFX_DIR, s.file))).length;
if (existingSfxCount < SFX_DEFINITIONS.length) {
  generateAllSfx(SFX_DIR);
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".m4v": "video/mp4",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".srt": "text/plain; charset=utf-8"
};

const ASPECT_RATIOS = {
  "9:16": { id: "9:16", label: "9:16 Reels / TikTok", width: 1080, height: 1920, short: "9:16" },
  "16:9": { id: "16:9", label: "16:9 YouTube / Ngang", width: 1920, height: 1080, short: "16:9" },
  "1:1":  { id: "1:1",  label: "1:1 Vuông Instagram", width: 1080, height: 1080, short: "1:1" },
  "4:5":  { id: "4:5",  label: "4:5 Feed Dọc", width: 1080, height: 1350, short: "4:5" }
};

function createDefaultProject() {
  return {
    version: 4,
    name: "Dự án mới — Mike Editor Pro 4.0",
    themeMode: "dark",
    aspectRatio: "9:16",
    playbackRate: 1.0,
    brandColors: {
      primary: "#38bdf8",
      secondary: "#a855f7",
      accent: "#f59e0b",
      bg: "#0f172a",
      text: "#f8fafc"
    },
    video: {
      src: "",
      title: "Chưa có video",
      duration: 15,
      trimStart: 0,
      trimEnd: 15,
      volume: 1.0
    },
    colorGrade: {
      lut: "none",
      brightness: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      tint: 0,
      vignette: 0,
      sharpen: 0,
      blur: 0
    },
    activeFilters: [],
    mediaPool: [],
    shots: [],
    elements: {
      vfx: [],
      extraText: [],
      graphics: [],
      subtitles: [],
      brolls: [],
      audio: []
    }
  };
}

function loadProject() {
  try {
    if (fs.existsSync(PROJECT_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(PROJECT_FILE, "utf8"));
      if (parsed && parsed.elements) return parsed;
    }
  } catch (e) {
    console.error("Failed reading project.json:", e.message);
  }
  const fresh = createDefaultProject();
  saveProject(fresh);
  return fresh;
}

function saveProject(project) {
  fs.writeFileSync(PROJECT_FILE, JSON.stringify(project, null, 2), "utf8");
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

function saveHistorySnapshot(label, project) {
  const hist = loadHistory();
  hist.unshift({
    id: `snap-${Date.now()}`,
    timestamp: new Date().toISOString(),
    label: label || "Chỉnh sửa dự án",
    snapshot: project
  });
  if (hist.length > 25) hist.length = 25;
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(hist, null, 2), "utf8");
  return hist;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req, limitBytes = 20 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > limitBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8").trim();
        resolve(text ? JSON.parse(text) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function readRawBodyToFile(req, destPath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(destPath);
    let size = 0;
    req.on("data", (chunk) => { size += chunk.length; });
    req.pipe(stream);
    stream.on("finish", () => resolve(size));
    stream.on("error", reject);
    req.on("error", reject);
  });
}

function runProcess(cmd, args, cwd = ROOT_DIR) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, windowsHide: true });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr, code });
      else reject(new Error(`${cmd} exited with ${code}: ${stderr || stdout}`));
    });
  });
}

async function probeMedia(filePath) {
  try {
    const { stdout } = await runProcess("ffprobe", [
      "-v", "quiet",
      "-print_format", "json",
      "-show_format",
      "-show_streams",
      filePath
    ]);
    const info = JSON.parse(stdout || "{}");
    const streams = Array.isArray(info.streams) ? info.streams : [];
    const vStream = streams.find((s) => s.codec_type === "video");
    const aStream = streams.find((s) => s.codec_type === "audio");
    const dur = parseFloat(info.format?.duration || vStream?.duration || aStream?.duration || "0") || 5.0;
    return {
      duration: Math.max(0.2, Math.round(dur * 100) / 100),
      width: vStream ? Number(vStream.width) || 0 : 0,
      height: vStream ? Number(vStream.height) || 0 : 0,
      hasVideo: Boolean(vStream),
      hasAudio: Boolean(aStream)
    };
  } catch (_) {
    return { duration: 10.0, width: 1080, height: 1920, hasVideo: true, hasAudio: true };
  }
}

function sanitizeFilename(name) {
  const base = path.basename(String(name || "media")).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base || `media_${Date.now()}`;
}

function resolvePublicFile(srcUrl) {
  if (!srcUrl || typeof srcUrl !== "string") return null;
  const clean = decodeURIComponent(srcUrl.split("?")[0]).replace(/^\/+/, "");
  const full = path.resolve(PUBLIC_DIR, clean);
  if (!full.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(full)) return null;
  return full;
}

function removeUploadedPhysicalFile(srcUrl) {
  if (!srcUrl || typeof srcUrl !== "string") return false;
  const clean = decodeURIComponent(srcUrl.split("?")[0]).replace(/^\/+/, "");
  if (!clean.startsWith("assets/uploads/")) return false;
  const full = path.resolve(PUBLIC_DIR, clean);
  if (!full.startsWith(UPLOADS_DIR + path.sep)) return false;
  if (fs.existsSync(full) && fs.statSync(full).isFile()) {
    fs.unlinkSync(full);
    return true;
  }
  return false;
}

function serveStaticFile(req, res, urlPath) {
  const relPath = decodeURIComponent(urlPath).replace(/^\/+/, "");
  let filePath;
  if (relPath.startsWith("renders/")) {
    const renderRel = relPath.slice("renders/".length);
    filePath = path.resolve(RENDERS_DIR, renderRel);
    if (!filePath.startsWith(RENDERS_DIR + path.sep)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
  } else {
    const target = relPath === "" ? "index.html" : relPath;
    filePath = path.resolve(PUBLIC_DIR, target);
    if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const total = stat.size;
    const rangeHeader = req.headers.range;

    if (rangeHeader) {
      const m = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (m) {
        const start = m[1] ? parseInt(m[1], 10) : 0;
        const end = m[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
        if (start >= total || start > end) {
          res.writeHead(416, { "Content-Range": `bytes */${total}` });
          res.end();
          return;
        }
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1,
          "Content-Type": contentType
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
        return;
      }
    }

    res.writeHead(200, {
      "Content-Length": total,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes"
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

function getUploadedLibraryItems() {
  const items = [];
  if (!fs.existsSync(UPLOADS_DIR)) return items;
  for (const name of fs.readdirSync(UPLOADS_DIR)) {
    const ext = path.extname(name).toLowerCase();
    const full = path.join(UPLOADS_DIR, name);
    const stat = fs.statSync(full);
    if (!stat.isFile()) continue;
    let kind = "video";
    if ([".wav", ".mp3", ".m4a", ".ogg"].includes(ext)) kind = "audio";
    else if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) kind = "image";
    items.push({
      id: `up-${name}`,
      name,
      kind,
      src: `/assets/uploads/${encodeURIComponent(name)}`,
      bytes: stat.size
    });
  }
  return items;
}

function formatSrtTime(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.round((s - Math.floor(s)) * 1000);
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
}

function buildSrtFromProject(project) {
  const subs = (project.elements?.subtitles || []).slice().sort((a, b) => a.start - b.start);
  if (!subs.length) return "";
  return subs
    .map((sub, i) => {
      const start = formatSrtTime(sub.start);
      const end = formatSrtTime(Math.max(sub.end, sub.start + 0.3));
      const cleanText = String(sub.text || "").replace(/\r?\n/g, " ").trim();
      return `${i + 1}\n${start} --> ${end}\n${cleanText}\n`;
    })
    .join("\n");
}

function createShotFromMedia(mediaItem, startOffset = 0, labelOverride = null) {
  const palette = ["#0ea5e9", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6"];
  const dur = mediaItem.duration || 5;
  return {
    id: `shot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    label: labelOverride || mediaItem.name,
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

function recalcProjectTotalDuration(project) {
  let maxT = 0;
  for (const s of project.shots || []) {
    if ((s.end || 0) > maxT) maxT = s.end;
  }
  for (const key of ["vfx", "extraText", "graphics", "subtitles", "brolls", "audio"]) {
    for (const item of project.elements?.[key] || []) {
      if ((item.end || 0) > maxT) maxT = item.end;
    }
  }
  project.video = project.video || {};
  project.video.duration = maxT > 0 ? Math.round(maxT * 100) / 100 : 15;
}

async function handleImportVideo(videoPath, titleHint, project, action = "append") {
  const probe = await probeMedia(videoPath);
  const relFromPublic = path.relative(PUBLIC_DIR, videoPath).replace(/\\/g, "/");
  const publicSrc = "/" + relFromPublic;
  const mediaItem = {
    id: `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: titleHint || path.basename(videoPath),
    kind: probe.hasVideo ? "video" : "audio",
    src: publicSrc,
    duration: probe.duration,
    width: probe.width,
    height: probe.height,
    bytes: fs.existsSync(videoPath) ? fs.statSync(videoPath).size : 0
  };
  project.mediaPool = Array.isArray(project.mediaPool) ? project.mediaPool : [];
  project.mediaPool.unshift(mediaItem);

  if (probe.hasVideo && (action === "replace" || project.shots.length === 0)) {
    project.video = {
      src: publicSrc,
      title: mediaItem.name,
      duration: probe.duration,
      trimStart: 0,
      trimEnd: probe.duration,
      volume: project.video?.volume ?? 1.0
    };
    project.shots = [createShotFromMedia(mediaItem, 0)];
  } else if (probe.hasVideo && action === "append") {
    const lastEnd = project.shots.length ? Math.max(...project.shots.map((s) => s.end)) : 0;
    project.shots.push(createShotFromMedia(mediaItem, lastEnd));
  }
  recalcProjectTotalDuration(project);
  saveHistorySnapshot(`Nhập tài nguyên: ${mediaItem.name}`, project);
  saveProject(project);
  return { mediaItem, project };
}

function buildAtempoChain(speed) {
  let rem = Math.max(0.2, Math.min(4.0, Number(speed) || 1.0));
  const filters = [];
  while (rem > 2.001) {
    filters.push("atempo=2.0");
    rem /= 2.0;
  }
  while (rem < 0.499) {
    filters.push("atempo=0.5");
    rem /= 0.5;
  }
  if (Math.abs(rem - 1.0) > 0.005) {
    filters.push(`atempo=${rem.toFixed(4)}`);
  }
  return filters.length ? filters.join(",") : "anull";
}

async function handleTranscribeVideo(req, res) {
  const body = await readJsonBody(req);
  const project = loadProject();
  const targetSrc = body.src || project.video?.src || project.shots?.[0]?.src;
  const videoPath = resolvePublicFile(targetSrc);
  if (!videoPath) {
    sendJson(res, 404, { ok: false, error: "Chưa có video nguồn trên timeline để tách phụ đề." });
    return;
  }

  const tmpDir = path.join(RENDERS_DIR, "whisper_tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  const baseName = path.basename(videoPath, path.extname(videoPath));
  const expectedJson = path.join(tmpDir, `${baseName}.json`);
  if (fs.existsSync(expectedJson)) fs.unlinkSync(expectedJson);

  await runProcess("whisper", [
    videoPath,
    "--model", "tiny",
    "--output_format", "json",
    "--output_dir", tmpDir
  ]);

  if (!fs.existsSync(expectedJson)) {
    throw new Error("Whisper chạy xong nhưng không tạo file JSON phụ đề.");
  }
  const whisperData = JSON.parse(fs.readFileSync(expectedJson, "utf8"));
  const segments = Array.isArray(whisperData.segments) ? whisperData.segments : [];
  if (!segments.length) {
    sendJson(res, 200, { ok: true, count: 0, message: "Không nhận diện được lời thoại trong video.", project });
    return;
  }

  const newSubs = segments
    .map((seg, i) => ({
      id: `sub-ai-${Date.now()}-${i}`,
      start: Math.max(0, Math.round(seg.start * 100) / 100),
      end: Math.max(0.3, Math.round(seg.end * 100) / 100),
      text: String(seg.text || "").trim(),
      style: body.style || "viral-short-01"
    }))
    .filter((s) => s.text.length > 0);

  project.elements = project.elements || {};
  project.elements.subtitles = newSubs;
  saveHistorySnapshot(`Whisper AI tách ${newSubs.length} dòng phụ đề`, project);
  saveProject(project);

  sendJson(res, 200, { ok: true, count: newSubs.length, language: whisperData.language || "auto", project });
}

async function handleAutoCutSilence(req, res) {
  const body = await readJsonBody(req);
  const project = loadProject();
  const targetSrc = body.src || project.video?.src || project.shots?.[0]?.src;
  const videoPath = resolvePublicFile(targetSrc);
  if (!videoPath) {
    sendJson(res, 404, { ok: false, error: "Chưa có video nguồn để cắt khoảng lặng." });
    return;
  }

  const probe = await probeMedia(videoPath);
  const totalDur = probe.duration || project.video?.duration || 10;
  if (!probe.hasAudio) {
    sendJson(res, 400, { ok: false, error: "Video này không có kênh âm thanh để phát hiện khoảng lặng." });
    return;
  }

  const noiseDb = Number(body.noiseDb) || -32;
  const minSilence = Number(body.minSilence) || 0.45;
  const procResult = await new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", [
      "-i", videoPath,
      "-af", `silencedetect=noise=${noiseDb}dB:d=${minSilence}`,
      "-f", "null",
      "-"
    ], { windowsHide: true });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", reject);
    proc.on("close", () => resolve(stderr));
  });

  const silences = [];
  let currentStart = null;
  for (const line of procResult.split(/\r?\n/)) {
    const mStart = line.match(/silence_start:\s*([0-9.]+)/);
    if (mStart) currentStart = parseFloat(mStart[1]);
    const mEnd = line.match(/silence_end:\s*([0-9.]+)/);
    if (mEnd && currentStart !== null) {
      silences.push({ start: currentStart, end: parseFloat(mEnd[1]) });
      currentStart = null;
    }
  }
  if (currentStart !== null) silences.push({ start: currentStart, end: totalDur });

  const keepSegments = [];
  let cursor = 0;
  for (const sil of silences) {
    if (sil.start - cursor >= 0.35) {
      keepSegments.push({ trimStart: Math.round(cursor * 100) / 100, trimEnd: Math.round(sil.start * 100) / 100 });
    }
    cursor = Math.max(cursor, sil.end);
  }
  if (totalDur - cursor >= 0.35) {
    keepSegments.push({ trimStart: Math.round(cursor * 100) / 100, trimEnd: Math.round(totalDur * 100) / 100 });
  }
  if (!keepSegments.length) keepSegments.push({ trimStart: 0, trimEnd: totalDur });

  let tlCursor = 0;
  const palette = ["#0ea5e9", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6"];
  const newShots = keepSegments.map((seg, idx) => {
    const len = Math.max(0.35, Math.round((seg.trimEnd - seg.trimStart) * 100) / 100);
    const shot = {
      id: `shot-cut-${Date.now()}-${idx}`,
      label: `Cảnh ${idx + 1}`,
      start: Math.round(tlCursor * 100) / 100,
      end: Math.round((tlCursor + len) * 100) / 100,
      src: targetSrc,
      trimStart: seg.trimStart,
      trimEnd: seg.trimEnd,
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
      transition: idx === 0 ? "none" : "crossfade",
      color: palette[idx % palette.length]
    };
    tlCursor += len;
    return shot;
  });

  project.shots = newShots;
  recalcProjectTotalDuration(project);
  saveHistorySnapshot(`Cắt khoảng lặng (${newShots.length} cảnh)`, project);
  saveProject(project);

  sendJson(res, 200, {
    ok: true,
    removedSilences: silences.length,
    shotsCount: newShots.length,
    newDuration: project.video.duration,
    project
  });
}

async function handleExportVideo(req, res) {
  const body = await readJsonBody(req);
  const project = body.project || loadProject();
  const arInfo = ASPECT_RATIOS[project.aspectRatio] || ASPECT_RATIOS["9:16"];
  const outW = arInfo.width;
  const outH = arInfo.height;

  const shots = (project.shots || []).slice().sort((a, b) => a.start - b.start);
  if (!shots.length && !resolvePublicFile(project.video?.src)) {
    sendJson(res, 400, { ok: false, error: "Timeline chưa có video hoặc cảnh nào để xuất MP4." });
    return;
  }

  const effectiveShots = shots.length ? shots : [{
    src: project.video.src,
    start: 0,
    end: project.video.duration || 10,
    trimStart: project.video.trimStart || 0,
    trimEnd: project.video.trimEnd || project.video.duration || 10,
    speed: 1.0,
    fadeIn: 0,
    fadeOut: 0,
    scale: 100
  }];

  const inputFiles = [];
  const inputMap = new Map();
  async function getInputIndex(srcUrl) {
    const resolved = resolvePublicFile(srcUrl);
    if (!resolved) return -1;
    if (!inputMap.has(resolved)) {
      const idx = inputFiles.length;
      const meta = await probeMedia(resolved);
      inputFiles.push({ path: resolved, meta });
      inputMap.set(resolved, idx);
    }
    return inputMap.get(resolved);
  }

  const resolvedShots = [];
  for (const s of effectiveShots) {
    const inIdx = await getInputIndex(s.src || project.video?.src);
    if (inIdx < 0) continue;
    const speed = Math.max(0.2, Math.min(4.0, Number(s.speed) || 1.0));
    const tStart = Math.max(0, Number(s.trimStart ?? 0));
    const tEnd = Math.max(tStart + 0.2, Number(s.trimEnd ?? (tStart + ((s.end - s.start) || 5) * speed)));
    const outDur = Math.max(0.2, (tEnd - tStart) / speed);
    resolvedShots.push({
      inIdx,
      tStart,
      tEnd,
      speed,
      outDur,
      fadeIn: Math.max(0, Number(s.fadeIn) || 0),
      fadeOut: Math.max(0, Number(s.fadeOut) || 0),
      scale: Math.max(25, Math.min(300, Number(s.scale) || 100)),
      flipH: Boolean(s.flipH),
      flipV: Boolean(s.flipV),
      rotation: Number(s.rotation) || 0
    });
  }

  if (!resolvedShots.length) {
    sendJson(res, 400, { ok: false, error: "Không tìm thấy file nguồn hợp lệ cho các cảnh trên timeline." });
    return;
  }

  const resolvedBrolls = [];
  for (const b of project.elements?.brolls || []) {
    const inIdx = await getInputIndex(b.src);
    if (inIdx >= 0) resolvedBrolls.push({ ...b, inIdx });
  }

  const resolvedAudio = [];
  for (const a of project.elements?.audio || []) {
    const inIdx = await getInputIndex(a.src);
    if (inIdx >= 0) resolvedAudio.push({ ...a, inIdx });
  }

  const args = ["-y"];
  for (const inp of inputFiles) args.push("-i", inp.path);

  const filters = [];
  const concatInputs = [];
  let totalBaseDur = 0;

  resolvedShots.forEach((s, i) => {
    const inp = inputFiles[s.inIdx];
    totalBaseDur += s.outDur;
    const vOps = [
      `trim=start=${s.tStart.toFixed(3)}:end=${s.tEnd.toFixed(3)}`,
      `setpts=(PTS-STARTPTS)/${s.speed.toFixed(4)}`,
      `scale=${outW}:${outH}:force_original_aspect_ratio=increase`,
      `crop=${outW}:${outH}`,
      `setsar=1`,
      `fps=30`
    ];
    if (Math.abs(s.scale - 100) > 2) {
      const scW = Math.max(64, Math.round((outW * s.scale) / 100));
      const scH = Math.max(64, Math.round((outH * s.scale) / 100));
      if (s.scale > 100) {
        vOps.push(`scale=${scW}:${scH},crop=${outW}:${outH}`);
      } else {
        vOps.push(`scale=${scW}:${scH},pad=${outW}:${outH}:(ow-iw)/2:(oh-ih)/2:black`);
      }
    }
    if (s.flipH) vOps.push("hflip");
    if (s.flipV) vOps.push("vflip");
    if (s.fadeIn > 0.05) vOps.push(`fade=t=in:st=0:d=${Math.min(s.outDur * 0.45, s.fadeIn).toFixed(2)}`);
    if (s.fadeOut > 0.05) {
      const d = Math.min(s.outDur * 0.45, s.fadeOut);
      vOps.push(`fade=t=out:st=${Math.max(0, s.outDur - d).toFixed(2)}:d=${d.toFixed(2)}`);
    }
    vOps.push("format=yuv420p");
    filters.push(`[${s.inIdx}:v]${vOps.join(",")}[sv${i}]`);

    if (inp.meta.hasAudio) {
      const aOps = [
        `atrim=start=${s.tStart.toFixed(3)}:end=${s.tEnd.toFixed(3)}`,
        `asetpts=PTS-STARTPTS`,
        buildAtempoChain(s.speed)
      ];
      if (s.fadeIn > 0.05) aOps.push(`afade=t=in:st=0:d=${Math.min(s.outDur * 0.45, s.fadeIn).toFixed(2)}`);
      if (s.fadeOut > 0.05) {
        const d = Math.min(s.outDur * 0.45, s.fadeOut);
        aOps.push(`afade=t=out:st=${Math.max(0, s.outDur - d).toFixed(2)}:d=${d.toFixed(2)}`);
      }
      aOps.push("aformat=sample_rates=44100:channel_layouts=stereo");
      filters.push(`[${s.inIdx}:a]${aOps.join(",")}[sa${i}]`);
    } else {
      filters.push(`anullsrc=r=44100:cl=stereo:d=${s.outDur.toFixed(3)}[sa${i}]`);
    }
    concatInputs.push(`[sv${i}][sa${i}]`);
  });

  if (resolvedShots.length > 1) {
    filters.push(`${concatInputs.join("")}concat=n=${resolvedShots.length}:v=1:a=1[vconcat][aconcat]`);
  } else {
    filters.push(`[sv0]null[vconcat]`);
    filters.push(`[sa0]anull[aconcat]`);
  }

  let vLabel = "vconcat";
  let aLabel = "aconcat";

  const globalSpeed = Math.max(0.25, Math.min(4.0, Number(project.playbackRate) || 1.0));
  if (Math.abs(globalSpeed - 1.0) > 0.02) {
    filters.push(`[${vLabel}]setpts=(1/${globalSpeed.toFixed(4)})*PTS[vspeed]`);
    filters.push(`[${aLabel}]${buildAtempoChain(globalSpeed)}[aspeed]`);
    vLabel = "vspeed";
    aLabel = "aspeed";
  }

  const mainVol = project.video?.volume ?? 1.0;
  filters.push(`[${aLabel}]volume=${Number(mainVol).toFixed(2)}[amain]`);
  aLabel = "amain";

  const cg = project.colorGrade || {};
  const lutObj = COLOR_LUTS.find((l) => l.id === cg.lut);
  const vChain = [];
  if (lutObj && lutObj.ffmpeg) vChain.push(lutObj.ffmpeg);

  const bright = (Number(cg.brightness) || 0) / 200;
  const contrast = 1 + (Number(cg.contrast) || 0) / 100;
  const sat = 1 + (Number(cg.saturation) || 0) / 100;
  if (Math.abs(bright) > 0.005 || Math.abs(contrast - 1) > 0.01 || Math.abs(sat - 1) > 0.01) {
    vChain.push(`eq=brightness=${bright.toFixed(3)}:contrast=${contrast.toFixed(3)}:saturation=${Math.max(0, sat).toFixed(3)}`);
  }
  const temp = Number(cg.temperature) || 0;
  if (Math.abs(temp) > 1) {
    vChain.push(`colorbalance=rs=${(temp / 250).toFixed(3)}:bs=${(-temp / 250).toFixed(3)}`);
  }
  if ((Number(cg.blur) || 0) > 0.5) {
    vChain.push(`boxblur=${Math.min(10, Math.round(cg.blur / 2))}:1`);
  }
  if ((Number(cg.sharpen) || 0) > 15) {
    vChain.push(`unsharp=5:5:${((cg.sharpen / 100) * 1.2).toFixed(2)}`);
  }
  if ((Number(cg.vignette) || 0) > 10) {
    vChain.push(`vignette=PI/${Math.max(2.2, 6 - (cg.vignette / 25)).toFixed(2)}`);
  }

  const activeVfx = new Set(Array.isArray(project.activeFilters) ? project.activeFilters : []);
  for (const vid of activeVfx) {
    const fv = VFX_FILTERS.find((x) => x.id === vid);
    if (!fv || !fv.ffmpeg) continue;
    if (fv.ffmpeg === "cinema_bars") {
      const barH = Math.round(outH * 0.11);
      vChain.push(`drawbox=x=0:y=0:w=iw:h=${barH}:color=black:t=fill`);
      vChain.push(`drawbox=x=0:y=ih-${barH}:w=iw:h=${barH}:color=black:t=fill`);
    } else {
      vChain.push(fv.ffmpeg);
    }
  }

  if (vChain.length) {
    filters.push(`[${vLabel}]${vChain.join(",")}[vgraded]`);
    vLabel = "vgraded";
  }

  resolvedBrolls.forEach((b, idx) => {
    const bw = Math.max(80, Math.round((Number(b.w || 60) / 100) * outW));
    const bh = Math.max(80, Math.round((Number(b.h || 28) / 100) * outH));
    const bx = Math.round((Number(b.x ?? 50) / 100) * outW - bw / 2);
    const by = Math.round((Number(b.y ?? 50) / 100) * outH - bh / 2);
    const start = Math.max(0, Number(b.start) || 0);
    const end = Math.max(start + 0.2, Number(b.end) || start + 3);
    filters.push(
      `[${b.inIdx}:v]scale=${bw}:${bh}:force_original_aspect_ratio=increase,crop=${bw}:${bh},setpts=PTS-STARTPTS+${start.toFixed(3)}/TB[br${idx}]`
    );
    const vNext = `vpip${idx}`;
    filters.push(
      `[${vLabel}][br${idx}]overlay=x=${bx}:y=${by}:enable='between(t,${start.toFixed(2)},${end.toFixed(2)})':eof_action=pass[${vNext}]`
    );
    vLabel = vNext;
  });

  const srtText = buildSrtFromProject(project);
  const srtPath = path.join(RENDERS_DIR, "export_subs.srt");
  if (srtText.trim()) {
    fs.writeFileSync(srtPath, srtText, "utf8");
    const fontSz = outH > outW ? 20 : 18;
    filters.push(
      `[${vLabel}]subtitles=export_subs.srt:force_style='FontName=Arial,FontSize=${fontSz},Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Alignment=2,MarginV=75'[vsubs]`
    );
    vLabel = "vsubs";
  }

  const totalOutDur = totalBaseDur / globalSpeed;
  if (resolvedAudio.length > 0) {
    const mixInputs = [`[${aLabel}]`];
    resolvedAudio.forEach((a, idx) => {
      const startMs = Math.max(0, Math.round((Number(a.start) || 0) * 1000));
      const clipDur = Math.max(0.1, (Number(a.end) || Number(a.start) + 1) - (Number(a.start) || 0));
      const vol = Math.max(0, Math.min(2.0, Number(a.volume ?? 0.8)));
      const loopFilter = a.loop ? `aloop=loop=-1:size=2e+09,` : "";
      const aOps = [
        `${loopFilter}atrim=0:${clipDur.toFixed(3)}`,
        `asetpts=PTS-STARTPTS`,
        `volume=${vol.toFixed(2)}`
      ];
      if ((a.fadeIn || 0) > 0.05) aOps.push(`afade=t=in:st=0:d=${Math.min(clipDur * 0.45, a.fadeIn).toFixed(2)}`);
      if ((a.fadeOut || 0) > 0.05) {
        const d = Math.min(clipDur * 0.45, a.fadeOut);
        aOps.push(`afade=t=out:st=${Math.max(0, clipDur - d).toFixed(2)}:d=${d.toFixed(2)}`);
      }
      aOps.push(`adelay=${startMs}|${startMs}`);
      aOps.push("aformat=sample_rates=44100:channel_layouts=stereo");
      filters.push(`[${a.inIdx}:a]${aOps.join(",")}[sfx${idx}]`);
      mixInputs.push(`[sfx${idx}]`);
    });
    filters.push(
      `${mixInputs.join("")}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=0:normalize=0[amixed]`
    );
    aLabel = "amixed";
  }

  const outFileName = `mike_editor_export_${Date.now()}.mp4`;
  const outPath = path.join(RENDERS_DIR, outFileName);

  args.push(
    "-filter_complex", filters.join(";"),
    "-map", `[${vLabel}]`,
    "-map", `[${aLabel}]`,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-t", totalOutDur.toFixed(3),
    outPath
  );

  await runProcess("ffmpeg", args, RENDERS_DIR);
  const stat = fs.statSync(outPath);
  sendJson(res, 200, {
    ok: true,
    file: outFileName,
    url: `/renders/${outFileName}`,
    bytes: stat.size,
    aspectRatio: arInfo.id,
    resolution: `${outW}x${outH}`
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${HOST}:${PORT}`);
    const pathname = parsedUrl.pathname;

    if (req.method === "GET" && pathname === "/api/library") {
      const sfxList = SFX_DEFINITIONS.map((s) => ({ ...s, src: `/assets/sfx/${s.file}` }));
      sendJson(res, 200, {
        ok: true,
        aspectRatios: Object.values(ASPECT_RATIOS),
        sfx: sfxList,
        luts: COLOR_LUTS,
        filters: VFX_FILTERS,
        graphics: GRAPHIC_PRESETS,
        textStyles: TEXT_STYLES,
        fonts: FONT_PRESETS,
        transitions: TRANSITIONS,
        uploads: getUploadedLibraryItems()
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/project") {
      const project = loadProject();
      const history = loadHistory();
      sendJson(res, 200, { ok: true, project, history });
      return;
    }

    if (req.method === "POST" && pathname === "/api/project") {
      const body = await readJsonBody(req);
      const project = body.project || body;
      if (!project || !project.elements) {
        sendJson(res, 400, { ok: false, error: "Invalid project payload" });
        return;
      }
      saveProject(project);
      let history = loadHistory();
      if (body.snapshotLabel) history = saveHistorySnapshot(body.snapshotLabel, project);
      sendJson(res, 200, { ok: true, project, history });
      return;
    }

    if (req.method === "POST" && pathname === "/api/reset-demo") {
      const fresh = createDefaultProject();
      saveProject(fresh);
      const history = saveHistorySnapshot("Dự án trống mới (Clean Slate)", fresh);
      sendJson(res, 200, { ok: true, project: fresh, history });
      return;
    }

    if (req.method === "POST" && pathname === "/api/restore") {
      const body = await readJsonBody(req);
      const hist = loadHistory();
      const item = hist.find((h) => h.id === body.id);
      if (!item || !item.snapshot) {
        sendJson(res, 404, { ok: false, error: "Snapshot not found" });
        return;
      }
      saveProject(item.snapshot);
      sendJson(res, 200, { ok: true, project: item.snapshot, history: hist });
      return;
    }

    if (req.method === "POST" && (pathname === "/api/upload-video" || pathname === "/api/upload-media")) {
      const rawName = parsedUrl.searchParams.get("name") || req.headers["x-file-name"] || `upload_${Date.now()}.mp4`;
      const action = parsedUrl.searchParams.get("action") || "pool";
      const safeName = `${Date.now()}_${sanitizeFilename(rawName)}`;
      const destPath = path.join(UPLOADS_DIR, safeName);
      const bytes = await readRawBodyToFile(req, destPath);
      if (bytes === 0) {
        fs.unlinkSync(destPath);
        sendJson(res, 400, { ok: false, error: "File trống (0 bytes)." });
        return;
      }
      const probe = await probeMedia(destPath);
      const project = loadProject();
      const publicSrc = `/assets/uploads/${encodeURIComponent(safeName)}`;
      const ext = path.extname(safeName).toLowerCase();
      const kind = [".wav", ".mp3", ".m4a", ".ogg"].includes(ext)
        ? "audio"
        : [".png", ".jpg", ".jpeg", ".webp"].includes(ext)
          ? "image"
          : "video";

      const mediaItem = {
        id: `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: decodeURIComponent(rawName),
        kind,
        src: publicSrc,
        duration: probe.duration,
        width: probe.width,
        height: probe.height,
        bytes
      };
      project.mediaPool = Array.isArray(project.mediaPool) ? project.mediaPool : [];
      project.mediaPool.unshift(mediaItem);

      if (kind === "video" && (action === "replace" || (action === "pool" && project.shots.length === 0))) {
        project.video = { src: publicSrc, title: mediaItem.name, duration: probe.duration, trimStart: 0, trimEnd: probe.duration, volume: 1.0 };
        project.shots = [createShotFromMedia(mediaItem, 0)];
        saveHistorySnapshot(`Đưa video vào Timeline: ${mediaItem.name}`, project);
      } else if (kind === "video" && action === "append") {
        const lastEnd = project.shots.length ? Math.max(...project.shots.map((s) => s.end)) : 0;
        project.shots.push(createShotFromMedia(mediaItem, lastEnd));
        saveHistorySnapshot(`Nối thêm cảnh: ${mediaItem.name}`, project);
      } else {
        saveHistorySnapshot(`Tải tài nguyên lên kho: ${mediaItem.name}`, project);
      }
      recalcProjectTotalDuration(project);
      saveProject(project);
      sendJson(res, 200, { ok: true, mediaItem, project });
      return;
    }

    if (req.method === "POST" && pathname === "/api/delete-media") {
      const body = await readJsonBody(req);
      const project = loadProject();
      const idx = (project.mediaPool || []).findIndex((m) => m.id === body.id);
      if (idx < 0) {
        sendJson(res, 404, { ok: false, error: "Không tìm thấy tài nguyên media." });
        return;
      }
      const [removed] = project.mediaPool.splice(idx, 1);
      removeUploadedPhysicalFile(removed.src);

      if (body.removeFromTimeline !== false) {
        project.shots = (project.shots || []).filter((s) => s.src !== removed.src);
        project.elements.brolls = (project.elements?.brolls || []).filter((b) => b.src !== removed.src);
        project.elements.audio = (project.elements?.audio || []).filter((a) => a.src !== removed.src);
        if (project.video?.src === removed.src) {
          const nextShot = project.shots[0];
          project.video.src = nextShot ? nextShot.src : "";
          project.video.title = nextShot ? nextShot.label : "Chưa có video";
        }
      }
      recalcProjectTotalDuration(project);
      saveHistorySnapshot(`Xóa tài nguyên: ${removed.name}`, project);
      saveProject(project);
      sendJson(res, 200, { ok: true, removedId: removed.id, project });
      return;
    }

    if (req.method === "POST" && pathname === "/api/rename-media") {
      const body = await readJsonBody(req);
      const newName = String(body.name || "").trim();
      if (!newName) {
        sendJson(res, 400, { ok: false, error: "Tên tài nguyên không được để trống." });
        return;
      }
      const project = loadProject();
      const item = (project.mediaPool || []).find((m) => m.id === body.id);
      if (!item) {
        sendJson(res, 404, { ok: false, error: "Không tìm thấy tài nguyên media." });
        return;
      }
      item.name = newName;
      (project.shots || []).forEach((s) => { if (s.src === item.src) s.label = newName; });
      (project.elements?.brolls || []).forEach((b) => { if (b.src === item.src) b.name = newName; });
      saveProject(project);
      sendJson(res, 200, { ok: true, item, project });
      return;
    }

    if (req.method === "POST" && pathname === "/api/clear-media") {
      const body = await readJsonBody(req);
      const project = loadProject();
      if (fs.existsSync(UPLOADS_DIR)) {
        for (const f of fs.readdirSync(UPLOADS_DIR)) {
          const fp = path.join(UPLOADS_DIR, f);
          if (fs.statSync(fp).isFile()) fs.unlinkSync(fp);
        }
      }
      project.mediaPool = [];
      if (body.clearTimeline !== false) {
        project.shots = [];
        project.elements.brolls = [];
        project.video = { src: "", title: "Chưa có video", duration: 15, trimStart: 0, trimEnd: 15, volume: 1.0 };
      }
      recalcProjectTotalDuration(project);
      saveHistorySnapshot("Xóa toàn bộ kho tài nguyên", project);
      saveProject(project);
      sendJson(res, 200, { ok: true, project });
      return;
    }

    if (req.method === "POST" && pathname === "/api/import-url") {
      const body = await readJsonBody(req);
      const urlStr = String(body.url || "").trim();
      if (!urlStr || !/^https?:\/\//i.test(urlStr)) {
        sendJson(res, 400, { ok: false, error: "URL không hợp lệ." });
        return;
      }
      const outTpl = path.join(UPLOADS_DIR, `yt_${Date.now()}_%(id)s.%(ext)s`);
      const ytdlpArgs = [
        "--no-playlist",
        "-f", "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b",
        "--merge-output-format", "mp4",
        "-o", outTpl
      ];
      if (/youtu(\.be|be\.com)/i.test(urlStr)) {
        ytdlpArgs.unshift("--remote-components", "ejs:github", "--js-runtimes", "node");
      }
      ytdlpArgs.push(urlStr);

      await runProcess("yt-dlp", ytdlpArgs);
      const files = fs.readdirSync(UPLOADS_DIR)
        .map((f) => ({ name: f, full: path.join(UPLOADS_DIR, f), mtime: fs.statSync(path.join(UPLOADS_DIR, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);
      if (!files.length) throw new Error("yt-dlp không tải được file nào.");
      const latest = files[0];
      const project = loadProject();
      const result = await handleImportVideo(latest.full, body.title || latest.name, project, body.action || "append");
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (req.method === "POST" && pathname === "/api/transcribe-video") {
      await handleTranscribeVideo(req, res);
      return;
    }

    if (req.method === "POST" && pathname === "/api/auto-cut-silence") {
      await handleAutoCutSilence(req, res);
      return;
    }

    if (req.method === "POST" && pathname === "/api/export") {
      await handleExportVideo(req, res);
      return;
    }

    if (req.method === "GET") {
      serveStaticFile(req, res, pathname);
      return;
    }

    sendJson(res, 405, { ok: false, error: "Method not allowed" });
  } catch (err) {
    console.error("Server error:", err);
    sendJson(res, 500, { ok: false, error: err.message || "Internal server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Mike Editor Pro 4.0 running at http://${HOST}:${PORT}/ (http://localhost:${PORT}/)`);
});
