const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 22050;

const GROUP_CONFIGS = [
  {
    category: "transition",
    color: "#0ea5e9",
    names: [
      "Whoosh Nhanh Gọn", "Whoosh Trầm Điện Ảnh", "Swoosh Lướt Gió", "Riser Tăng Cao Kịch Tính", "Whip Pan Vút Ngang",
      "Swoosh Kim Loại Sắc", "Chuyển Cảnh Lửa Cháy", "Lướt Nước Mềm Mại", "Cyber Sweep Hiện Đại", "Riser Reverse Đảo Ngược",
      "Glitch Whoosh Số Hóa", "Swoosh Nhẹ Vlog", "Gió Xoáy Cao Trào", "Vút Khung Hình Siêu Tốc", "Flash Transition Chớp",
      "Whoosh Trầm Bass Dày", "Air Burst Bùng Nổ", "Lá Rơi Chuyển Cảnh", "Laser Sweep Quét Ngang", "Tia Sáng Zoom Vào",
      "Sweep Dải Băng Cổ", "Riser Căng Thẳng Ngắn", "Slide Kéo Màn Nhẹ", "Whoosh Đôi 2 Nhịp", "Bão Gió Cuối Cảnh"
    ]
  },
  {
    category: "impact",
    color: "#ef4444",
    names: [
      "Bass Drop Sâu Thẳm", "Boom Điện Ảnh Rền Vang", "Glitch Smash Vỡ Hình", "Braam Trailer Bom Tấn", "Cồng Chiêng Rung Động",
      "Sấm Sét Bùng Nổ", "Đấm Nặng Thùng Phuy", "Va Chạm Kim Loại Cứng", "Sub Hit Nhịp Tim", "Cú Rơi Hố Đen",
      "Nổ Kính Thanh Lọc", "Thud Cứng Rắn Đanh", "Va Đập Bê Tông", "Cymbal Smash Chói", "Taiko Trống Trận",
      "Low Punch Hút Hồn", "Distorted Drop Rung Màn", "Shutter Slam Đóng Mạnh", "Đập Bàn Kịch Tính", "Zap Impact Điện Giật",
      "Thunder Clap Sấm Gần", "Deep Thump Nhấn Mạnh", "Anvil Hit Đe Sắt", "Drop 808 Rung Trần", "Mega Slam Kết Cảnh"
    ]
  },
  {
    category: "ui",
    color: "#f59e0b",
    names: [
      "Pop Bong Bóng Nổi", "Ding Chuông Sáng", "Ăn Xu Arcade", "Gõ Phím Cơ Click", "Thông Báo Ting Đôi",
      "Thăng Cấp Level Up", "Báo Lỗi Buzz Nhẹ", "Click Chuột Kép", "Bấm Nút Kính Mềm", "Vuốt Màn Hình Tick",
      "Hoàn Thành Nhiệm Vụ", "Mở Khóa Thành Tựu", "Thả Tim Pop Mềm", "Nhảy Số Đếm Điểm", "Switch Công Tắc Tạch",
      "Chốt Đơn Thành Công", "Camera Lấy Nét Beep", "Tải Xong Ping Thanh", "Hover Lướt Nhẹ", "Chuông Nhắc Lịch",
      "Tin Nhắn Đến Crisp", "Xác Nhận Hai Nốt", "Hủy Bỏ Nốt Trầm", "Đếm Ngược 3-2-1", "Chuyển Tab Nhẹ Nhàng"
    ]
  },
  {
    category: "meme",
    color: "#ec4899",
    names: [
      "Lò Xo Boing Hài Hước", "Còi Trượt Slide Lên", "Còi Trượt Slide Xuống", "Xước Đĩa Vinyl Ngưng", "Kèn Bóp Hề Honk",
      "Đánh Trống Hài Rimshot", "Tò Te Tụt Mood", "Vine Boom Chấn Động", "Anime Lấp Lánh Kira", "Chớp Mắt Nháy Tinh",
      "Trượt Chân Hoạt Hình", "Gõ Đầu Cốc Cốc", "Ngạc Nhiên Huh?!", "Chế Nhạo Quack Nhẹ", "Thở Phào Phew",
      "Cú Lừa Plot Twist", "Chóng Mặt Xoay Vòng", "Tiếng Ối Bất Ngờ", "Vỗ Tay Giả Lập", "Còi Trọng Tài Tuýt",
      "Điểm 10 Chấm Bài", "Đoán Sai Bụp", "Cười Thầm Tí Tách", "Biến Hình Siêu Nhân", "Đóng Khung Đơ Hình"
    ]
  },
  {
    category: "foley",
    color: "#10b981",
    names: [
      "Chụp Ảnh DSLR Sắc Nét", "In Ảnh Polaroid Kéo", "Xé Giấy Giòn Tan", "Lật Trang Sách Nhanh", "Bước Chân Sàn Gỗ",
      "Két Cửa Gỗ Mở", "Cụng Ly Thủy Tinh", "Giọt Nước Rơi Tí Tách", "Đánh Máy Bàn Phím Liên Hồi", "Kéo Khóa Áo Zip",
      "Bật Bật Lửa Xẹt", "Đặt Tách Cà Phê", "Xào Bài Tây Phành Phạch", "Viết Bút Lên Giấy", "Gõ Cửa Ba Tiếng",
      "Mở Lon Nước Có Gas", "Bấm Bút Bi Tách", "Rút Kiếm Ánh Thép", "Đóng Nắp Hộp Nhanh", "Tiếng Đồng Hồ Tích Tắc",
      "Quạt Gió Lướt Nhẹ", "Lắc Xúc Xắc Gỗ", "Kéo Ghế Nhẹ", "Xoáy Nút Vặn Analog", "Tiếng Chân Chạy Gấp"
    ]
  },
  {
    category: "scifi",
    color: "#06b6d4",
    names: [
      "Bắn Laser Tia Đỏ", "Nạp Năng Lượng Plasma", "Dịch Chuyển Tức Thời", "Bật Màn Hình Hologram", "Quét Dữ Liệu Sinh Trắc",
      "AI Bot Trả Lời Beep", "Glitch Điện Tử Đứt Quãng", "Xung Từ Trường EMP", "Bật Tốc Độ Ánh Sáng Warp", "Khởi Động Hệ Thống Boot",
      "Radar Dò Mục Tiêu", "Khiên Năng Lượng Bật", "Mở Cửa Tàu Vũ Trụ", "Lỗi Ma Trận Matrix", "Truyền Tải Dữ Liệu Modem",
      "Cảnh Báo Lò Phản Ứng", "Robot Chuyển Động Servo", "Vô Hiệu Hóa Hệ Thống", "Tín Hiệu Vệ Tinh Ping", "Cổng Không Gian Portal",
      "Hack Thành Công Chime", "Chụp X-Quang Công Nghệ", "Đường Truyền Cáp Quang", "Tia Quét Mã Vạch", "Tắt Nguồn Tụ Điện"
    ]
  },
  {
    category: "musical",
    color: "#6366f1",
    names: [
      "Hợp Âm Piano Mở Màn", "Gảy Đàn Guitar Sạch", "Vĩ Cầm Căng Thẳng", "Kèn Đồng Hoành Tráng", "Synth Pad Mơ Màng",
      "Đàn Harp Rải Dây", "Trượt Bass 808 Mạnh", "Chuông Gió Mùa Hạ", "Marimba Nhiệt Đới", "Rhodes Hợp Âm Chill",
      "Pizzicato Lén Lút", "Saxophone Nhấn Nhá", "Sitar Phương Đông", "Kalimba Giọt Sương", "Organ Nhà Thờ Vang",
      "Pluck Nhạc Điện Tử", "Bell Chime Cổ Tích", "Koto Nhật Bản Tĩnh", "Hợp Âm Jazz Ấm", "Gảy Bass Funky",
      "Arpeggio Lên Cao", "Chốt Hạ Nhạc Kịch", "Violin Ngắt Nhịp", "Trống Lăn Snare Roll", "Outro Kết Bản Nhạc"
    ]
  },
  {
    category: "bgm",
    color: "#8b5cf6",
    names: [
      "BGM Lo-Fi Chill Cà Phê", "BGM Tech Sáng Tạo", "BGM Điện Ảnh Hào Hùng", "BGM Cyberpunk Neon", "BGM Vlog Năng Động",
      "BGM Trap Đậm Bass", "BGM Ambient Thư Giãn", "BGM Retro Game 8-Bit", "BGM Jazz Tối Ấm Cúng", "BGM Piano Cảm Xúc",
      "BGM Doanh Nghiệp Sạch", "BGM Phóng Sự Kịch Tính", "BGM Du Lịch Biển Xanh", "BGM Tập Gym Bùng Nổ", "BGM Học Tập Tập Trung",
      "BGM Future Bass Sôi Động", "BGM Thời Trang Catwalk", "BGM Công Nghệ AI", "BGM Bí Ẩn Điều Tra", "BGM Mùa Hè Rực Rỡ",
      "BGM Đêm Thành Phố Mưa", "BGM Synthwave 1984", "BGM Khởi Nghiệp Truyền Cảm Hứng", "BGM Ẩm Thực Vui Tươi", "BGM Tối Giản Documentary"
    ]
  }
];

const SFX_DEFINITIONS = [];
GROUP_CONFIGS.forEach((grp) => {
  grp.names.forEach((label, idx) => {
    const num = String(idx + 1).padStart(2, "0");
    const id = `${grp.category}-${num}`;
    let duration = 0.65;
    if (grp.category === "transition") duration = +(0.38 + (idx % 6) * 0.18).toFixed(2);
    else if (grp.category === "impact") duration = +(0.60 + (idx % 5) * 0.25).toFixed(2);
    else if (grp.category === "ui") duration = +(0.12 + (idx % 5) * 0.12).toFixed(2);
    else if (grp.category === "meme") duration = +(0.32 + (idx % 5) * 0.16).toFixed(2);
    else if (grp.category === "foley") duration = +(0.25 + (idx % 5) * 0.14).toFixed(2);
    else if (grp.category === "scifi") duration = +(0.45 + (idx % 5) * 0.18).toFixed(2);
    else if (grp.category === "musical") duration = +(0.75 + (idx % 4) * 0.25).toFixed(2);
    else if (grp.category === "bgm") duration = 4.00;

    SFX_DEFINITIONS.push({
      id,
      file: `${id}.wav`,
      category: grp.category,
      variantIndex: idx,
      label,
      duration,
      color: grp.color
    });
  });
});

function createSeededRandom(seed = 2026) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s / 4294967296) * 2 - 1;
  };
}

function softClip(x) {
  return Math.tanh(x);
}

function writeWavMono(filePath, samples) {
  const numSamples = samples.length;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  let maxAbs = 0;
  for (let i = 0; i < numSamples; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > maxAbs) maxAbs = abs;
  }
  const scale = maxAbs > 0.9 ? 0.9 / maxAbs : 1.0;
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i] * scale));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buffer);
}

function synthVariant(def) {
  const { category, variantIndex: v, duration } = def;
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  const rand = createSeededRandom((v + 1) * 7919 + category.charCodeAt(0) * 131);

  const pitchScale = 0.72 + ((v * 7) % 13) * 0.055;
  let lp1 = 0;
  let lp2 = 0;
  let prev = 0;
  let phase = 0;
  let phase2 = 0;

  const chordsBank = [
    [261.63, 329.63, 392.0, 493.88],
    [220.0, 261.63, 329.63, 392.0],
    [174.61, 220.0, 261.63, 349.23],
    [196.0, 246.94, 293.66, 392.0],
    [146.83, 220.0, 261.63, 329.63]
  ];

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const p = t / duration;
    const noise = rand();

    if (category === "transition") {
      const reverse = v % 4 === 3;
      const shape = reverse ? Math.pow(p, 1.8) * (p > 0.94 ? (1 - p) / 0.06 : 1) : Math.sin(Math.PI * Math.pow(p, 0.7));
      const cut = 0.04 + (0.12 + (v % 5) * 0.08) * Math.sin(Math.PI * p);
      lp1 += cut * (noise - lp1);
      const hp = lp1 - prev * (0.4 + (v % 3) * 0.22);
      prev = lp1;
      const f = (reverse ? 85 * Math.pow(5.5, p) : 110 + 280 * Math.sin(Math.PI * p)) * pitchScale;
      phase += (2 * Math.PI * f) / SAMPLE_RATE;
      const tone = v % 3 === 0 ? Math.sin(phase) * 0.28 : Math.tanh(Math.sin(phase) * 2.0) * 0.22;
      out[i] = softClip((hp * 1.65 + tone) * shape);
    } else if (category === "impact") {
      const decay = 1.6 + (v % 5) * 0.55;
      const env = Math.exp(-t * decay) * (t < 0.008 ? t / 0.008 : 1);
      const baseF = (30 + (v % 6) * 5) * (v % 2 === 0 ? 1 : 1.15);
      const f = baseF + (110 + (v % 4) * 35) * Math.exp(-t * (6 + (v % 4) * 2));
      phase += (2 * Math.PI * f) / SAMPLE_RATE;
      lp1 += (0.04 + (v % 4) * 0.04) * (noise - lp1);
      const drive = 1.4 + (v % 5) * 0.4;
      const body = Math.tanh(Math.sin(phase) * drive);
      const metal = v % 5 === 4 ? Math.sin(phase * 3.17) * Math.exp(-t * 5) * 0.45 : 0;
      out[i] = softClip((body * 0.85 + lp1 * Math.exp(-t * 4) * 0.85 + metal) * env);
    } else if (category === "ui") {
      const steps = 1 + (v % 3);
      const stepDur = duration / steps;
      const sIdx = Math.min(steps - 1, Math.floor(t / stepDur));
      const lt = t - sIdx * stepDur;
      const f = (420 + (v % 8) * 95) * (1 + sIdx * 0.33) * (v % 6 === 5 ? (1 + 0.8 * (1 - Math.exp(-lt * 25))) : 1);
      phase += (2 * Math.PI * f) / SAMPLE_RATE;
      const env = Math.exp(-lt * (12 + (v % 6) * 5)) * (lt < 0.004 ? lt / 0.004 : 1);
      const harmonic = (v % 4 === 0) ? Math.sin(phase * 2) * 0.25 : 0;
      const click = (v % 3 === 1) ? noise * Math.exp(-lt * 90) * 0.45 : 0;
      out[i] = softClip((Math.sin(phase) * 0.72 + harmonic + click) * env);
    } else if (category === "meme") {
      const mode = v % 6;
      const env = Math.exp(-t * (2.5 + (v % 3))) * (t < 0.006 ? t / 0.006 : 1);
      let s = 0;
      if (mode === 0) { // Boing
        const f = 190 * pitchScale + 260 * Math.exp(-t * 2.5) + 80 * Math.sin(2 * Math.PI * 16 * t);
        phase += (2 * Math.PI * f) / SAMPLE_RATE;
        s = Math.sin(phase) * env;
      } else if (mode === 1) { // Slide whistle up/down
        const f = (v % 2 === 0 ? 380 + 950 * p : 1200 - 820 * p) * pitchScale;
        phase += (2 * Math.PI * f) / SAMPLE_RATE;
        s = (Math.sin(phase) * 0.7 + Math.sin(phase * 2) * 0.18) * Math.sin(Math.PI * p);
      } else if (mode === 2) { // Honk / Quack
        const f = 220 * pitchScale * (1 - 0.12 * p);
        phase += (2 * Math.PI * f) / SAMPLE_RATE;
        s = Math.tanh(Math.sin(phase) * 3.0) * ((t % 0.18 < 0.14) ? env : 0.1 * env);
      } else if (mode === 3) { // Record scratch
        const f = 140 + 420 * Math.abs(Math.sin(2 * Math.PI * 7 * t));
        phase += (2 * Math.PI * f) / SAMPLE_RATE;
        s = (Math.tanh(Math.sin(phase) * 2.5) * 0.5 + noise * 0.35) * env;
      } else if (mode === 4) { // Sparkle arp
        const arp = [784, 987.77, 1174.66, 1567.98, 1975.53];
        const ai = Math.min(4, Math.floor(t / 0.07));
        const f = arp[ai] * (0.9 + (v % 3) * 0.1);
        phase += (2 * Math.PI * f) / SAMPLE_RATE;
        s = Math.sin(phase) * Math.exp(-(t % 0.07) * 14) * 0.8;
      } else { // Rimshot / Thud
        const hit = t < 0.09 ? 1 : (t >= 0.12 ? 0.85 : 0);
        const f = (t >= 0.12 ? 320 : 180) * pitchScale;
        phase += (2 * Math.PI * f) / SAMPLE_RATE;
        s = (Math.sin(phase) * 0.65 + noise * 0.35) * Math.exp(-(t % 0.12) * 24) * hit;
      }
      out[i] = softClip(s);
    } else if (category === "foley") {
      const hits = 1 + (v % 4);
      const spacing = duration / (hits + 0.3);
      let acc = 0;
      for (let h = 0; h < hits; h++) {
        const dt = t - (0.015 + h * spacing);
        if (dt >= 0) {
          const clickEnv = Math.exp(-dt * (35 + (v % 5) * 15));
          const bodyF = (180 + (v % 7) * 110) * (1 + h * 0.08);
          acc += (noise * 0.55 + Math.sin(2 * Math.PI * bodyF * dt) * 0.55) * clickEnv;
        }
      }
      out[i] = softClip(acc);
    } else if (category === "scifi") {
      const modRate = 18 + (v % 7) * 11;
      const env = Math.exp(-t * (2.2 + (v % 4) * 0.8)) * (t < 0.008 ? t / 0.008 : 1);
      const sweep = (v % 2 === 0) ? (1100 * Math.exp(-t * 5) + 140) : (180 * Math.pow(4.2, p));
      phase += (2 * Math.PI * sweep * pitchScale) / SAMPLE_RATE;
      const fm = Math.sin(2 * Math.PI * modRate * t) * (2.2 + (v % 4) * 0.9);
      const sig = Math.sin(phase + fm) * 0.7 + ((v % 3 === 0) ? noise * 0.18 : 0);
      out[i] = softClip(sig * env);
    } else if (category === "musical") {
      const ch = chordsBank[v % chordsBank.length];
      const arpeggio = v % 3 === 1;
      let sum = 0;
      ch.forEach((f, ci) => {
        const noteStart = arpeggio ? ci * 0.09 : 0;
        const dt = t - noteStart;
        if (dt >= 0) {
          const env = Math.exp(-dt * (2.4 + (v % 3) * 0.8)) * Math.min(1, dt / 0.006);
          const freq = f * (v % 4 === 2 ? 0.5 : 1) * (0.95 + (v % 3) * 0.05);
          sum += (Math.sin(2 * Math.PI * freq * dt) * 0.65 + Math.sin(4 * Math.PI * freq * dt) * 0.2) * env;
        }
      });
      out[i] = softClip(sum * 0.48);
    } else if (category === "bgm") {
      const bpmFactor = 1.0 + (v % 4) * 0.25;
      const bar = Math.floor(t * bpmFactor) % 4;
      const bt = (t * bpmFactor) % 1.0;
      const ch = chordsBank[(v + bar) % chordsBank.length];
      const swell = 0.6 + 0.4 * Math.sin(Math.PI * bt);
      let pad = 0;
      for (const f of ch) {
        const ff = f * (v % 5 === 0 ? 0.5 : 1);
        pad += Math.sin(2 * Math.PI * ff * t) * 0.65 + Math.sin(2 * Math.PI * ff * 1.004 * t) * 0.35;
      }
      const bassF = ch[0] * 0.5;
      const subPulse = Math.sin(2 * Math.PI * bassF * t) * (0.18 + 0.12 * Math.sin(2 * Math.PI * 2 * bpmFactor * t));
      const beatT = (t * 2 * bpmFactor) % 1.0;
      const kick = (v % 3 !== 2) ? Math.sin(2 * Math.PI * (46 + 60 * Math.exp(-beatT * 28)) * beatT) * Math.exp(-beatT * 12) * 0.32 : 0;
      const hatT = ((t * 4 * bpmFactor) % 1.0);
      const hat = noise * Math.exp(-hatT * 38) * 0.06;
      const arpNote = ch[Math.floor(t * 4 * bpmFactor) % ch.length] * 2;
      const arp = Math.sin(2 * Math.PI * arpNote * t) * Math.exp(-((t * 4 * bpmFactor) % 1) * 7) * (v % 2 === 1 ? 0.16 : 0.08);
      const loopFade = (t < 0.03 ? t / 0.03 : t > duration - 0.05 ? (duration - t) / 0.05 : 1);
      out[i] = softClip((pad * 0.09 * swell + subPulse + kick + hat + arp) * loopFade);
    }
  }
  return out;
}

function generateAllSfx(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const results = [];
  for (const def of SFX_DEFINITIONS) {
    const filePath = path.join(outDir, def.file);
    const samples = synthVariant(def);
    writeWavMono(filePath, samples);
    results.push({ ...def, src: `/assets/sfx/${def.file}` });
  }
  return results;
}

if (require.main === module) {
  const outDir = path.join(__dirname, "public", "assets", "sfx");
  const start = Date.now();
  const list = generateAllSfx(outDir);
  const elapsed = Date.now() - start;
  console.log(`Generated ${list.length} SFX/BGM WAV files in ${elapsed}ms -> ${outDir}`);
}

module.exports = { SFX_DEFINITIONS, generateAllSfx };
