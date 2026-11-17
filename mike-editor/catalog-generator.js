// Đại thư viện Mike Editor Pro 4.0: 200 LUTs, 200 VFX, 200 Graphics, 200 Text Styles, 200 Fonts, 20 Transitions

function build200Luts() {
  const groups = [
    {
      category: "hollywood",
      baseNames: [
        "Teal & Orange Bom Tấn", "Nolan Interstellar Lạnh", "Dune Sa Mạc Hoàng Kim", "Blade Runner 2049 Neon",
        "John Wick Câu Lạc Bộ", "Joker Xanh Tối U Ám", "Mad Max Fury Cam Cháy", "Matrix Xanh Kỹ Thuật Số",
        "La La Land Hoàng Hôn Tím", "Top Gun Nắng Gắt Rực", "Batman Noir Đen Sâu", "Sicario Đất Khô Cằn",
        "Spider-Verse Nửa Tông Pop", "Wes Anderson Vàng Pastel", "Drive Neon Hồng Xanh", "Parasite Xanh Xám Lạnh",
        "Her Ấm Áp Hoài Niệm", "1917 Chiến Trường Tro", "Moonlight Xanh Tím Sâu", "Arrival Sương Mù Trầm",
        "Skyfall Băng Giá Anh", "Euphoria Lấp Lánh Tím", "Oppenheimer Vàng Cổ", "Avatar Rừng Phát Quang", "Inception Xám Bạc"
      ],
      palettes: [
        ["#0d9488", "#f97316", "#0f172a"], ["#1e3a8a", "#93c5fd", "#09090b"], ["#d97706", "#f59e0b", "#451a03"],
        ["#db2777", "#06b6d4", "#1e1b4b"], ["#0284c7", "#ec4899", "#090d16"], ["#065f46", "#eab308", "#111827"],
        ["#ea580c", "#fbbf24", "#271406"], ["#15803d", "#4ade80", "#052e16"], ["#7e22ce", "#f472b6", "#1e1b4b"]
      ]
    },
    {
      category: "kodak-fuji",
      baseNames: [
        "Kodak Portra 400 Chuẩn", "Kodak Portra 800 Da Mịn", "Kodak Gold 200 Nắng Vàng", "Kodak Ektar 100 Rực Sắc",
        "Kodachrome 64 Kinh Điển", "Cinestill 800T Đêm Đèn", "Cinestill 50D Ban Ngày", "Kodak Vision3 500T",
        "Kodak Vision3 250D", "Kodak ColorPlus 200", "Fuji Pro 400H Dịu Xanh", "Fuji Velvia 50 Tươi Rực",
        "Fuji Provia 100F Sạch", "Fuji Eterna Cinema Mềm", "Fuji Classic Chrome", "Fuji Nostalgic Neg",
        "Fuji Superia X-Tra 400", "Fuji Astia Da Hồng Hào", "Agfa Vista 200 Đỏ Ấm", "Ilford XP2 Sắc Lạnh",
        "Lomography 800 Tương Phản", "Kodak Ultramax 400", "Fuji Acros Đậm Khối", "Ektachrome E100 Trong", "Kodak Aerochrome Tím"
      ],
      palettes: [
        ["#f59e0b", "#d97706", "#fef3c7"], ["#10b981", "#86efac", "#ecfdf5"], ["#f43f5e", "#fb923c", "#fffbeb"],
        ["#0ea5e9", "#f43f5e", "#1e293b"], ["#a16207", "#facc15", "#292524"], ["#16a34a", "#bbf7d0", "#14532d"]
      ]
    },
    {
      category: "camera-log",
      baseNames: [
        "ARRI LogC3 Chuẩn Rec709", "ARRI LogC4 Điện Ảnh Mới", "Sony S-Log3 S-Gamut3", "Sony S-Cinetone Da Đẹp",
        "RED IPP2 Medium Contrast", "RED IPP2 Soft Highlight", "Canon C-Log2 Cinema", "Canon C-Log3 Vlog Tự Nhiên",
        "Blackmagic BRAW Film Gen5", "Panasonic V-Log Studio", "DJI D-Log M Flycam Sáng", "DJI D-Cinelike Màu Mượt",
        "Apple Log iPhone 15/16 Pro", "GoPro Protune Flat Crisp", "Fujifilm F-Log2 Mềm", "Nikon N-Log Tự Nhiên",
        "Leica L-Log Sang Trọng", "Z-Cam Z-Log2 Đậm", "ACEScct Studio Chuẩn", "Rec.709 Punch Contrast",
        "Rec.2020 HDR Rực Rỡ", "Phantom Flex Slow-Mo Grade", "Kinefinity KineLOG3", "SIGMA Fp Color Sắc", "Pocket 6K Clean Grade"
      ],
      palettes: [
        ["#334155", "#94a3b8", "#f1f5f9"], ["#0f172a", "#38bdf8", "#e2e8f0"], ["#27272a", "#fb923c", "#fafafa"],
        ["#1e293b", "#10b981", "#d1fae5"], ["#3f3f46", "#a855f7", "#f3e8ff"]
      ]
    },
    {
      category: "asian-trend",
      baseNames: [
        "Pastel Hàn Quốc Sáng Da", "Douyin Nét Căng Hồng Đào", "Tokyo Xanh Bạc Hà Mát", "Kyoto Lá Đỏ Mùa Thu",
        "Đà Lạt Sương Mù Sáng", "Sài Gòn Hoàng Hôn Ấm", "Seoul Cafe Tối Giản", "Hồng Kông Vương Gia Vệ",
        "Đài Bắc Ngày Mưa Nhẹ", "Okinawa Biển Ngọc Bích", "Bangkok Đường Phố Đêm", "Thanh Xuân Vườn Trường",
        "Trà Sữa Kem Béo Ngọt", "K-Pop MV Ánh Kim", "Ulzzang Trong Veo Sạch", "Nhật Bản Kawaii Sáng",
        "Việt Nam Phim Độc Lập", "Hà Nội Cổ Kính Vàng", "Hội An Đèn Lồng Ấm", "Phú Quốc Nắng Hoàng Hôn",
        "Shanghai Cyberpunk Tím", "Cổ Trang Trung Hoa Trầm", "Anime Shinkai Bầu Trời", "Minimal Nhật Trong Trẻo", "Tiktok Trend Trắng Hồng"
      ],
      palettes: [
        ["#fbcfe8", "#bae6fd", "#fef9c3"], ["#2dd4bf", "#f0fdfa", "#115e59"], ["#f43f5e", "#fda4af", "#fff1f2"],
        ["#15803d", "#facc15", "#09090b"], ["#60a5fa", "#a78bfa", "#eff6ff"], ["#fb923c", "#fde047", "#431407"]
      ]
    },
    {
      category: "vintage-retro",
      baseNames: [
        "Thập Niên 1960 Sepia", "Thập Niên 1970 Nắng Cũ", "Thập Niên 1980 VHS Ấm", "Thập Niên 1990 Tạp Chí",
        "Y2K 2000 Xanh Lục Nhẹ", "Máy Ảnh Film Hết Hạn", "Polaroid SX-70 Mơ Màng", "Băng Từ Betamax Cổ",
        "Super 8mm Kỷ Niệm", "16mm Tài Liệu Cổ", "Ảnh Cũ Ngả Vàng Nặng", "Xanh Phai Lomo Cổ",
        "Rạp Chiếu Bóng Cũ", "Bưu Thiếp Paris 1950", "Mùa Hè 1988 Ngọt Ngào", "Disco Thập Niên 70",
        "Synthwave Sunset 1984", "Walkman Băng Cassette", "Quán Cà Phê Cổ Điển", "Thư Viện Sách Cũ",
        "Đầu Máy Chiếu Slide", "Ký Ức Gia Đình Fade", "Tạp Chí Vogue 1994", "Giấy Báo Cổ Ngả Màu", "Tĩnh Vật Baroque Trầm"
      ],
      palettes: [
        ["#b45309", "#fde68a", "#451a03"], ["#7c2d12", "#fdba74", "#292524"], ["#3f6212", "#d9f99d", "#1a2e05"],
        ["#9d174d", "#fbcfe8", "#4c0519"], ["#78716c", "#d6d3d1", "#292524"]
      ]
    },
    {
      category: "moody-dark",
      baseNames: [
        "Dark Moody Điện Ảnh Sâu", "Shadow Xám Đen Sang Trọng", "Xanh Đêm Mưa Rơi", "Nâu Espresso Đậm Đặc",
        "Than Chì Công Nghệ Lạnh", "Đỏ Đô Huyền Bí Tối", "Tím Nửa Đêm Sâu", "Rừng Sâu Phủ Sương",
        "Hành Động Bleach Bypass", "Văn Phòng Tối Minimal", "Ánh Nến Tối Ấm Cúng", "Hẻm Đêm Cyberpunk Tối",
        "Bão Tố Xám Xịt Mạnh", "Lạnh Lẽo Bắc Âu", "Đêm Bạc Lấp Lánh", "Tâm Trạng Buồn Đậm",
        "Góc Khuất Đen Đặc", "Đồng Hồ Cơ Kim Loại", "Siêu Xe Trong Hầm Tối", "Nhạc Rap Đen Đỏ",
        "Kinh Dị Xanh Rêu Lạnh", "Thám Tử Noir U Ám", "Cà Phê Đá Đen Thẫm", "Mùa Đông Đóng Băng", "Bí Ẩn Bóng Đêm"
      ],
      palettes: [
        ["#0f172a", "#334155", "#64748b"], ["#18181b", "#71717a", "#27272a"], ["#451a03", "#92400e", "#1c1917"],
        ["#064e3b", "#047857", "#022c22"], ["#4c0519", "#be123c", "#09090b"]
      ]
    },
    {
      category: "vibrant-commercial",
      baseNames: [
        "TVC Quảng Cáo Sáng Bóng", "Mỹ Phẩm Cao Cấp Trong", "Ẩm Thực Ngon Mắt Tươi", "Thể Thao Nike Đậm Contrast",
        "Công Nghệ Apple Sạch Tinh", "Du Lịch Biển Nắng Vàng", "Thời Trang Đường Phố Pop", "Review Xe Hơi Bóng Loáng",
        "Bất Động Sản Sang Trọng", "Giờ Vàng Rực Rỡ Nhất", "Đồ Uống Mát Lạnh Xanh", "Cây Cối Thiên Nhiên Tươi",
        "Bữa Sáng Sáng Sủa Sạch", "TikTok Bán Hàng Nét Căng", "Unboxing Studio Sạch Sẽ", "Yoga Sức Khỏe Sáng",
        "Văn Phòng Hiện Đại Sáng", "Neon Party Bùng Nổ", "Lễ Hội Âm Nhạc Sặc Sỡ", "Mùa Xuân Hoa Nở Rực",
        "Cam Chanh Nhiệt Đới", "Xanh Dương Bầu Trời Căng", "Hồng Phấn Kẹo Ngọt", "High-Key Thời Trang", "Siêu Nét HDR Thương Mại"
      ],
      palettes: [
        ["#0ea5e9", "#22c55e", "#facc15"], ["#ff2e63", "#08d9d6", "#252a34"], ["#f97316", "#fde047", "#ffffff"],
        ["#ec4899", "#8b5cf6", "#38bdf8"], ["#10b981", "#34d399", "#ecfdf5"]
      ]
    },
    {
      category: "bw-monochrome",
      baseNames: [
        "Đen Trắng Noir Đậm", "Ilford HP5 Hạt Đẹp", "Kodak Tri-X 400 Cổ", "Leica Monochrom Tinh Tế",
        "Trắng Đen Dịu Nhẹ Vlog", "Tương Phản Cực Mạnh", "Xám Bạc Phim Cũ 1940", "Đen Trắng Ánh Xanh Selenium",
        "Đen Trắng Nâu Sepia Nhẹ", "Đen Trắng High Key Sáng", "Đen Trắng Low Key Tối", "Chân Dung Studio Cổ",
        "Đường Phố Đen Trắng Bụi", "Kiến Trúc Hình Khối Đen", "Mưa Đêm Đen Trắng", "Bóng Đổ Dài Đen Sâu",
        "Than Chì Mềm Mại", "Báo Giấy Đen Trắng", "Kịch Câm Câm Lặng 1920", "Phim Pháp Làn Sóng Mới",
        "Bạc Sáng Lấp Lánh", "Bóng Râm Mùa Hè", "Chữ Ký Nghệ Thuật", "Ánh Sáng Cửa Sổ Noir", "Tĩnh Lặng Đen Trắng"
      ],
      palettes: [
        ["#09090b", "#52525b", "#f4f4f5"], ["#18181b", "#71717a", "#e4e4e7"], ["#27272a", "#a1a1aa", "#ffffff"],
        ["#292524", "#78716c", "#e7e5e4"], ["#1e293b", "#64748b", "#f1f5f9"]
      ]
    }
  ];

  const luts = [
    { id: "none", name: "Mặc Định (Gốc)", code: "RAW-00", category: "camera-log", swatch: ["#475569", "#94a3b8", "#e2e8f0"], css: "", ffmpeg: "" }
  ];

  groups.forEach((grp) => {
    grp.baseNames.forEach((name, idx) => {
      // Skip 1 extra at very end so exact total is 200 (1 default + 199 generated -> or replace first)
      if (luts.length >= 200) return;
      const num = String(idx + 1).padStart(2, "0");
      const id = `${grp.category}-${num}`;
      const swatch = grp.palettes[idx % grp.palettes.length];

      let contrast = 1.04 + (idx % 6) * 0.045;
      let brightness = 0.96 + (idx % 5) * 0.03;
      let saturate = 1.05 + (idx % 6) * 0.065;
      let sepia = 0;
      let hue = ((idx * 9) % 32) - 16;

      let rs = 0, gs = 0, bs = 0, rh = 0, gh = 0, bh = 0;
      if (grp.category === "hollywood") {
        rs = (idx % 2 === 0 ? -0.09 : 0.07);
        bs = -rs;
        rh = 0.07;
        bh = -0.06;
        contrast += 0.08;
      } else if (grp.category === "kodak-fuji") {
        sepia = 0.08 + (idx % 4) * 0.04;
        rs = 0.06; gs = 0.02; bs = -0.05;
        hue = -4 + (idx % 4) * 3;
      } else if (grp.category === "camera-log") {
        contrast = 1.0 + (idx % 5) * 0.05;
        saturate = 0.95 + (idx % 5) * 0.07;
        hue = 0;
      } else if (grp.category === "asian-trend") {
        brightness = 1.04 + (idx % 4) * 0.025;
        contrast = 0.94 + (idx % 4) * 0.04;
        saturate = 0.92 + (idx % 5) * 0.05;
        rh = 0.04; bh = 0.05;
      } else if (grp.category === "vintage-retro") {
        sepia = 0.18 + (idx % 5) * 0.07;
        contrast = 1.02 + (idx % 4) * 0.04;
        saturate = 0.8 + (idx % 4) * 0.06;
        rs = 0.08; bs = -0.1;
      } else if (grp.category === "moody-dark") {
        brightness = 0.85 + (idx % 4) * 0.03;
        contrast = 1.15 + (idx % 5) * 0.05;
        saturate = 0.68 + (idx % 4) * 0.07;
        bs = 0.06; rs = -0.04;
      } else if (grp.category === "vibrant-commercial") {
        brightness = 1.03 + (idx % 3) * 0.02;
        contrast = 1.10 + (idx % 4) * 0.05;
        saturate = 1.20 + (idx % 5) * 0.07;
      } else if (grp.category === "bw-monochrome") {
        saturate = 0;
        contrast = 1.08 + (idx % 6) * 0.07;
        brightness = 0.94 + (idx % 4) * 0.04;
        sepia = (idx % 5 === 4) ? 0.18 : 0;
        hue = 0;
      }

      const cssParts = [
        grp.category === "bw-monochrome" ? "grayscale(1)" : "",
        `contrast(${contrast.toFixed(2)})`,
        `brightness(${brightness.toFixed(2)})`,
        grp.category === "bw-monochrome" ? "" : `saturate(${saturate.toFixed(2)})`,
        sepia > 0.01 ? `sepia(${sepia.toFixed(2)})` : "",
        Math.abs(hue) > 1 ? `hue-rotate(${hue}deg)` : ""
      ].filter(Boolean);

      const ffBrightness = Math.max(-0.4, Math.min(0.4, brightness - 1));
      const ffParts = [
        grp.category === "bw-monochrome" ? "hue=s=0" : "",
        `eq=contrast=${contrast.toFixed(2)}:brightness=${ffBrightness.toFixed(2)}:saturation=${saturate.toFixed(2)}`,
        (rs || gs || bs || rh || bh) ? `colorbalance=rs=${rs.toFixed(2)}:gs=${gs.toFixed(2)}:bs=${bs.toFixed(2)}:rh=${rh.toFixed(2)}:bh=${bh.toFixed(2)}` : ""
      ].filter(Boolean);

      luts.push({
        id,
        name,
        code: `${grp.category.slice(0, 3).toUpperCase()}-${num}`,
        category: grp.category,
        swatch,
        css: cssParts.join(" "),
        ffmpeg: ffParts.join(",")
      });
    });
  });

  return luts;
}

function build200Vfx() {
  const groups = [
    {
      category: "glitch-digital",
      icon: "⚡", color: "#ec4899",
      names: [
        "Glitch RGB Sọc Ngang", "Glitch Khối Số Hóa", "Lỗi Tín Hiệu HDMI", "Chớp Tách Kênh Đỏ Xanh", "Nhiễu Màn Hình TV Hỏng",
        "Pixelate Khảm 8-Bit", "Cyber Matrix Xanh Chạy", "Ma Trận Điểm Ảnh", "Rung Glitch Dọc Mạnh", "Đứt Gãy Khung Hình",
        "Sọc TV Kép Quét Nhanh", "Chuyển Mạch Dữ Liệu", "Glitch Neon Tím Hồng", "Nhiễu Sóng Radio Cao", "Biến Dạng Tín Hiệu Số",
        "Bitcrush Thấp Độ Phân Giải", "Lệch Kênh Cyan Red", "Màn Hình Đóng Băng", "Tia Quét Scanner Laser", "Glitch Phóng Đại Tâm",
        "Nhiễu Rác Nén MP4", "Màn Hình CRT Cong", "Quét Dòng Tốc Độ Cao", "Lặp Ảnh Dư Ảnh Glitch", "Cyber Overload Sáng Chói"
      ],
      overlayFn: (i) => `repeating-linear-gradient(${(i * 15) % 180}deg, rgba(236,72,153,0.12) 0px, rgba(34,211,238,0.12) 2px, transparent 3px, transparent ${5 + (i % 5)}px)`,
      animFn: (i) => (i % 2 === 0 ? "vfx-glitch-jitter 0.16s steps(2) infinite" : "")
    },
    {
      category: "light-glow",
      icon: "☀️", color: "#f97316",
      names: [
        "Lóe Sáng Cam Ấm Góc Trái", "Quầng Sáng Halation Đỏ", "Nắng Chiều Xuyên Kính", "Lóe Sáng Cầu Vồng Góc", "Chói Đèn Sân Khấu",
        "Light Leak Đỏ Tía Mờ", "Ánh Sáng Cửa Sổ Vàng", "Hào Quang Thiên Thần", "Mơ Màng Pro-Mist 1/4", "Pro-Mist 1/2 Mềm Da",
        "Lóe Sáng Vàng Kim Phim", "Tia Nắng Xiên Chéo", "Ánh Sáng Đèn Neon Xanh", "Chớp Flash Máy Ảnh Mềm", "Vầng Sáng Trung Tâm",
        "Sáng Tỏa Bồng Bềnh", "Light Leak Dọc Cạnh Phải", "Ánh Nắng Hoàng Hôn", "Sương Sáng Ban Mai", "Bùng Sáng Giữa Cảnh",
        "Đốm Sáng Anamorphic Ngang", "Tia Xanh Ống Kính Điện Ảnh", "Lửa Cháy Mờ Góc Dưới", "Hồng Phấn Lấp Lánh", "Hào Quang Bạc Sáng"
      ],
      overlayFn: (i) => `linear-gradient(${105 + i * 11}deg, rgba(249,115,22,${(0.28 + (i % 4) * 0.08).toFixed(2)}) 0%, rgba(250,204,21,0.18) 28%, transparent 62%)`,
      animFn: () => ""
    },
    {
      category: "retro-film",
      icon: "🎞️", color: "#d97706",
      names: [
        "Băng VHS 1998 Gốc", "Hạt Phim 35mm Mịn", "Hạt Phim 16mm Đậm", "Vết Xước Phim Cổ", "Bụi Phim Chấm Đen Trắng",
        "Băng Cassette Nhòe Màu", "Viền Tối Khung Phim 8mm", "Khung Phim Nhựa Đục Lỗ", "Màn Hình Camcorder Có REC", "Độ Phơi Sáng Cháy Cạnh",
        "Ký Ức Tivi Hộp 1985", "Mờ Cạnh Ống Kính Cũ", "Màu Giấy Ảnh Phai Nắng", "Phim Trắng Đen Xước", "Tăng Nhiễu ISO Cao",
        "Sọc Băng Từ Trượt Dọc", "Viền Nâu Cổ Cháy Nắng", "Đốm Mốc Ống Kính Cũ", "Rung Cổng Phim Chiếu", "Nứt Mặt Kính Cũ",
        "Phim Tài Liệu Thời Sự", "Ảnh Rọi Phòng Tối Đỏ", "Màn Hình Máy Chiếu Slide", "Nhòe Sắc Tím Hoài Cổ", "Bụi Mờ Thời Gian"
      ],
      overlayFn: (i) => `repeating-linear-gradient(180deg, rgba(255,255,255,0.06) 0 1px, rgba(0,0,0,${(0.10 + (i % 4) * 0.04).toFixed(2)}) 1px 3px)`,
      animFn: () => ""
    },
    {
      category: "motion-camera",
      icon: "💓", color: "#a855f7",
      names: [
        "Nhịp Tim Phóng Đều", "Rung Máy Cầm Tay Nhẹ", "Rung Mạnh Động Đất", "Tia Tốc Độ Anime Trắng", "Tia Tốc Độ Đen Kịch Tính",
        "Lia Máy Trái Phải Nhanh", "Thở Nhẹ Máy Ảnh Vlog", "Lắc Lư Thuyền Biển", "Zoom Giật Nhịp Bass", "Quay Tay Nhanh Chóng Mặt",
        "Rung Cận Cảnh Hành Động", "Nảy Lên Theo Nhịp", "Tăng Tốc Phóng Vào Tâm", "Thu Nhỏ Thoát Cảnh Mềm", "Rung Nhòe Chuyển Động",
        "Gió Thổi Rung Cành", "Cú Đánh Mạnh Chấn Động", "Chuyển Động Bập Bênh", "Chạy Bộ Góc Nhìn Thứ Nhất", "Lướt Bay Camera Flycam",
        "Lắc Ngang Liên Tục", "Nhịp Đập Disco Phóng", "Khung Hình Đảo Nhẹ", "Giật Mình Phóng Tức Thì", "Sóng Rung Thấp Tần"
      ],
      overlayFn: () => "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.09) 0deg 2deg, transparent 2deg 16deg)",
      animFn: (i) => (i % 2 === 0 ? "vfx-zoom-pulse 0.75s ease-in-out infinite alternate" : "vfx-camera-shake 0.28s linear infinite")
    },
    {
      category: "frame-letterbox",
      icon: "🎬", color: "#475569",
      names: [
        "Khung Điện Ảnh 2.35:1", "Khung Siêu Rộng 2.76:1", "Khung Polaroid Trắng", "Khung Tivi Cổ Bo Tròn", "Khung Viền Đen Trắng Tinh",
        "Viền Neon Hồng Rực", "Viền Neon Xanh Cyan", "Viền Vàng Kim Sang Trọng", "Khung Đóng Dấu REC 4K", "Khung Ngắm Ống Kính Viewfinder",
        "Khung Cuộn Phim Hai Bên", "Khung Vuông 1:1 Giữa", "Khung Split 2 Màn Hình", "Khung Trái Tim Lồng", "Khung Bo Góc Tròn Sâu",
        "Viền Băng Dính Góc", "Khung Kính Vỡ Vụn", "Khung Khói Mờ Viền", "Viền Đỏ Cảnh Báo", "Khung Bìa Tạp Chí",
        "Khung Bảng Đen Lớp Học", "Khung Cửa Sổ Máy Bay", "Khung Kính Hiển Vi", "Viền Cầu Vồng Nhẹ", "Khung Chấm Phá Tối Giản"
      ],
      overlayFn: (i) => i === 0 ? "" : `inset 0 0 0 ${4 + (i % 5) * 3}px rgba(15,23,42,0.88)`,
      isBoxShadow: true,
      animFn: () => ""
    },
    {
      category: "atmosphere-weather",
      icon: "🫧", color: "#38bdf8",
      names: [
        "Bụi Sáng Bokeh Lung Linh", "Hạt Tuyết Rơi Nhẹ", "Mưa Rơi Chéo Màn Hình", "Sương Mù Đáy Khung Hình", "Khói Trắng Lơ Lửng",
        "Tia Lửa Bay Đỏ Cam", "Cánh Hoa Anh Đào Mơ", "Đom Đóm Đêm Vàng", "Bọt Biển Xanh Lấp Lánh", "Bão Tuyết Mù Mịt",
        "Hạt Bụi Vàng Kim Tuyến", "Ánh Sao Bầu Trời Đêm", "Khói Sân Khấu Đậm", "Giọt Nước Đọng Mặt Kính", "Làn Hơi Nóng Sa Mạc",
        "Nắng Xuyên Tán Lá", "Mưa Neon Thành Phố", "Tia Chớp Sáng Lóe", "Lá Thu Rơi Chậm", "Mây Trôi Bồng Bềnh",
        "Ánh Cực Quang Xanh Tím", "Bụi Phấn Nhẹ Nhàng", "Hạt Sáng Trái Tim", "Bong Bóng Xà Phòng", "Không Khí Tĩnh Lặng"
      ],
      overlayFn: (i) => `radial-gradient(circle at ${(15 + i * 13) % 85}% ${(20 + i * 17) % 80}%, rgba(255,255,255,0.45) 2px, transparent 8px), radial-gradient(circle at ${(75 - i * 9) % 85}% ${(60 + i * 11) % 85}%, rgba(186,230,253,0.42) 3px, transparent 10px)`,
      animFn: () => ""
    },
    {
      category: "lens-distortion",
      icon: "🔍", color: "#06b6d4",
      names: [
        "Mắt Cá Nhẹ Góc Rộng", "Mờ Viền Radial Focus", "Kính Mờ Sương Đều", "Tâm Nổi Bật Đèn Pha", "Gương Phản Chiếu Ngang",
        "Gương Phản Chiếu Dọc", "Kính Vạn Hoa Nhẹ", "Tách Sắc Chromatic Viền", "Mờ Chuyển Động Ngang", "Ống Kính Tiêu Cự Dài",
        "Chân Dung Xóa Phông Viền", "Vignette Hầm Sâu Tối", "Tâm Sáng Bóng Đèn", "Mặt Nước Gợn Sóng Nhẹ", "Khúc Xạ Pha Lê Cạnh",
        "Mờ Nửa Màn Hình Dưới", "Mờ Nửa Màn Hình Trên", "Tập Trung Dải Ngang", "Ống Nhòm Hai Vòng Tròn", "Mắt Kính Cận Mờ Đều",
        "Biến Dạng Sóng Nhiệt", "Mặt Kính Ướt Nhoè", "Lăng Kính Ba Màu", "Phóng To Góc Trên", "Thu Hẹp Tâm Đen"
      ],
      overlayFn: (i) => `radial-gradient(circle at 50% 48%, transparent ${26 + (i % 4) * 6}%, rgba(0,0,0,${(0.55 + (i % 4) * 0.08).toFixed(2)}) 90%)`,
      animFn: () => ""
    },
    {
      category: "color-fx",
      icon: "🌈", color: "#14b8a6",
      names: [
        "Đảo Ngược Âm Bản", "Tách 2 Tông Xanh Cam", "Phát Sáng Neon Tím", "X-Quang Xanh Lạnh", "Camera Nhiệt Hồng Ngoại",
        "Siêu Bão Hòa Pop Art", "Tẩy Màu Bạc Giữa Cảnh", "Ánh Xanh Nước Biển Sâu", "Vàng Đồng Kim Loại", "Hồng Pastel Toàn Khung",
        "Lục Bảo Rừng Đêm", "Đơn Sắc Đỏ Kịch Tính", "Đơn Sắc Xanh Kỷ Niệm", "Nét Vẽ Tranh Sơn Dầu", "Nét Bút Chì Tương Phản",
        "Poster In Lưới 4 Màu", "Bạc Phim Ánh Kim", "Chuyển Sắc Cầu Vồng Mờ", "Xanh Neon Ma Mị", "Hổ Phách Rượu Vang",
        "Bạc Hà Tươi Mát", "Oải Hương Mộng Mơ", "Cháy Sáng Highlights", "Bóng Xanh Cyan Sâu", "Ngọc Trai Sáng Mịn"
      ],
      overlayFn: (i) => `linear-gradient(${45 + i * 14}deg, hsla(${(i * 23) % 360}, 85%, 55%, 0.20), hsla(${(i * 23 + 120) % 360}, 85%, 55%, 0.16))`,
      animFn: () => ""
    }
  ];

  const vfxList = [];
  groups.forEach((grp) => {
    grp.names.forEach((name, idx) => {
      const num = String(idx + 1).padStart(2, "0");
      const id = `${grp.category}-${num}`;
      const specialId = (grp.category === "frame-letterbox" && idx === 0) ? "cinema-235"
        : (grp.category === "glitch-digital" && idx === 0) ? "glitch-rgb"
        : (grp.category === "retro-film" && idx === 0) ? "vhs-1998"
        : id;

      let cssFilter = "";
      if (grp.category === "color-fx") {
        if (idx === 0) cssFilter = "invert(0.9)";
        else if (idx === 4) cssFilter = "hue-rotate(150deg) saturate(2.1) contrast(1.3)";
        else cssFilter = `saturate(${(1.2 + (idx % 5) * 0.25).toFixed(2)}) hue-rotate(${(idx * 17) % 360}deg)`;
      } else if (grp.category === "lens-distortion" && idx === 2) {
        cssFilter = "blur(1.5px) brightness(1.06)";
      }

      let ffmpegFilter = "";
      if (grp.category === "glitch-digital") ffmpegFilter = "rgbashift=rh=-5:bh=5";
      else if (grp.category === "retro-film") ffmpegFilter = "noise=alls=14:allf=t+u";
      else if (specialId === "cinema-235") ffmpegFilter = "cinema_bars";
      else if (grp.category === "lens-distortion") ffmpegFilter = "vignette=PI/3";
      else if (grp.category === "color-fx") ffmpegFilter = `hue=h=${(idx * 15) % 180}:s=1.25`;

      vfxList.push({
        id: specialId,
        name,
        category: grp.category,
        icon: grp.icon,
        color: grp.color,
        desc: `${grp.category.replace("-", " ").toUpperCase()} • Hiệu ứng #${num}`,
        overlayBg: grp.isBoxShadow ? "" : grp.overlayFn(idx),
        overlayShadow: grp.isBoxShadow ? grp.overlayFn(idx) : "",
        cssFilter,
        animCss: grp.animFn(idx),
        isCinemaBars: specialId === "cinema-235",
        isMirror: (grp.category === "lens-distortion" && idx === 4),
        isPixelate: (grp.category === "glitch-digital" && idx === 5),
        ffmpeg: ffmpegFilter
      });
    });
  });

  return vfxList;
}

function build200Graphics() {
  const groups = [
    { category: "lower-third", type: "card", badge: "LIVE", title: "Nguyễn Minh Tuấn", sub: "Creative Director & Editor", bg: "#0f172a", txt: "#f8fafc", acc: "#38bdf8", w: 62, h: 13 },
    { category: "cta-social", type: "cta", badge: "🔔", title: "FOLLOW ĐỂ XEM TIẾP", sub: "Like & Subscribe kênh ngay!", bg: "#dc2626", txt: "#ffffff", acc: "#facc15", w: 58, h: 12 },
    { category: "card-callout", type: "card", badge: "💡", title: "MẸO DỰNG VIDEO HAY", sub: "Cắt nhanh theo nhịp nhạc 120 BPM", bg: "#1e1b4b", txt: "#eef2ff", acc: "#a855f7", w: 60, h: 14 },
    { category: "kpi-data", type: "stat", badge: "📈", title: "+340% LƯỢT XEM", sub: "Chỉ sau 7 ngày tối ưu Hook", bg: "#064e3b", txt: "#ecfdf5", acc: "#34d399", w: 54, h: 13 },
    { category: "badge-pill", type: "pill", badge: "★", title: "CÔNG CỤ MIỄN PHÍ", sub: "", bg: "#18181b", txt: "#f4f4f5", acc: "#f59e0b", w: 48, h: 8 },
    { category: "code-tech", type: "code", badge: "AI", title: "$ ffmpeg -crf 18 -preset slow", sub: "Render Lossless 4K 60fps ✓", bg: "#09090b", txt: "#4ade80", acc: "#22c55e", w: 64, h: 13 },
    { category: "chapter-quote", type: "chapter", badge: "01", title: "PHẦN 01: MỞ ĐẦU ẤN TƯỢNG", sub: "Bắt trọn sự chú ý trong 3 giây đầu", bg: "#312e81", txt: "#ffffff", acc: "#38bdf8", w: 66, h: 14 },
    { category: "pointer-sticker", type: "arrow", badge: "↗", title: "XEM CHI TIẾT TẠI ĐÂY!", sub: "Link ghim ở phần mô tả", bg: "#f59e0b", txt: "#09090b", acc: "#ef4444", w: 50, h: 11 }
  ];

  const colorVariations = [
    ["#0f172a", "#f8fafc", "#38bdf8"], ["#18181b", "#ffffff", "#f43f5e"], ["#1e1b4b", "#e0e7ff", "#818cf8"],
    ["#064e3b", "#ecfdf5", "#10b981"], ["#7c2d12", "#fff7ed", "#fb923c"], ["#4c0519", "#ffe4e6", "#fb7185"],
    ["#312e81", "#ffffff", "#22d3ee"], ["#fef3c7", "#451a03", "#d97706"], ["#ffffff", "#0f172a", "#0284c7"],
    ["rgba(15,23,42,0.78)", "#ffffff", "#f472b6"]
  ];

  const titleVariants = [
    "Giới thiệu Chủ Đề", "Nhấn Mạnh Điểm Chính", "Bước Thực Hiện Nhanh", "So Sánh Trước & Sau", "Thống Kê Đáng Chú Ý",
    "Công Cụ Khuyên Dùng", "Cảnh Báo Sai Lầm", "Bí Quyết Chuyên Gia", "Tổng Kết Kịch Bản", "Kêu Gọi Hành Động CTA",
    "Thông Tin Tác Giả", "Địa Điểm Ghi Hình", "Thời Gian Thực Hiện", "Ghi Chú Phiên Bản", "Mục Tiêu Video",
    "Nhắc Nhở Follow Kênh", "Thẻ Kính Mờ Hiện Đại", "Nhãn Trạng Thái Live", "Câu Trích Dẫn Truyền Cảm", "Phân Đoạn Chương",
    "Lệnh Terminal Kỹ Thuật", "Mũi Tên Chỉ Dẫn", "Đánh Giá 5 Sao", "Tiến Độ Hoàn Thành", "Huy Hiệu Pro Studio"
  ];

  const graphics = [];
  groups.forEach((grp) => {
    for (let i = 0; i < 25; i++) {
      const num = String(i + 1).padStart(2, "0");
      const [bgColor, textColor, accentColor] = colorVariations[(i + grp.category.length) % colorVariations.length];
      const titleWord = titleVariants[i];
      graphics.push({
        id: `gfx-${grp.category}-${num}`,
        name: `${titleWord} #${num}`,
        category: grp.category,
        type: grp.type,
        title: i === 0 ? grp.title : `${titleWord}`,
        subtitle: grp.sub,
        badge: grp.badge,
        badgeText: `${grp.category.split("-")[0].toUpperCase()} ${num}`,
        bgColor: i === 0 ? grp.bg : bgColor,
        textColor: i === 0 ? grp.txt : textColor,
        accentColor: i === 0 ? grp.acc : accentColor,
        w: grp.w,
        h: grp.h,
        fontSize: 14 + (i % 4),
        borderRadius: 6 + (i % 4) * 4
      });
    }
  });
  return graphics;
}

function build200TextStyles() {
  const groups = [
    { category: "viral-short", sample: "BÍ QUYẾT TRIỆU VIEW", font: "Montserrat, sans-serif", upper: true },
    { category: "cinematic-title", sample: "CHƯƠNG MỘT: KHỞI ĐẦU", font: "'Playfair Display', serif", upper: true },
    { category: "neon-cyber", sample: "CYBER STUDIO AI", font: "Orbitron, sans-serif", upper: true },
    { category: "minimal-editorial", sample: "Góc Nhìn Tối Giản", font: "'Be Vietnam Pro', sans-serif", upper: false },
    { category: "vlog-lifestyle", sample: "một ngày cùng mình ✨", font: "Quicksand, sans-serif", upper: false },
    { category: "bold-impact", sample: "DỪNG LẠI XEM NGAY!", font: "Anton, Impact, sans-serif", upper: true },
    { category: "gradient-3d", sample: "HIỆU ỨNG NỔI BẬT", font: "Oswald, sans-serif", upper: true },
    { category: "karaoke-sub", sample: "Phụ đề đồng bộ từng câu", font: "Nunito, sans-serif", upper: false }
  ];

  const colorCombos = [
    { text: "#facc15", stroke: "#000000", bg: "transparent", pill: false },
    { text: "#111827", stroke: "transparent", bg: "#facc15", pill: true },
    { text: "#ffffff", stroke: "#000000", bg: "transparent", pill: false },
    { text: "#ffffff", stroke: "transparent", bg: "#dc2626", pill: true },
    { text: "#09090b", stroke: "transparent", bg: "#ffffff", pill: true },
    { text: "#38bdf8", stroke: "#082f49", bg: "rgba(15,23,42,0.8)", pill: true },
    { text: "#f472b6", stroke: "#500724", bg: "transparent", pill: false },
    { text: "#4ade80", stroke: "#052e16", bg: "rgba(5,46,22,0.78)", pill: true },
    { text: "#fde68a", stroke: "#451a03", bg: "transparent", pill: false },
    { text: "#064e3b", stroke: "transparent", bg: "#a7f3d0", pill: true }
  ];

  const styles = [];
  groups.forEach((grp) => {
    for (let i = 0; i < 25; i++) {
      const num = String(i + 1).padStart(2, "0");
      const combo = colorCombos[(i + grp.category.length) % colorCombos.length];
      styles.push({
        id: `txt-${grp.category}-${num}`,
        name: `${grp.category.replace("-", " ").toUpperCase()} #${num}`,
        category: grp.category,
        text: grp.sample,
        textColor: combo.text,
        strokeColor: combo.stroke,
        bgColor: combo.bg,
        bgHighlight: combo.pill,
        fontSize: 22 + (i % 6) * 2,
        fontFamily: grp.font,
        fontWeight: 700 + (i % 3) * 100,
        letterSpacing: `${(i % 4) * 0.5}px`,
        uppercase: grp.upper || (i % 5 === 0)
      });
    }
  });
  return styles;
}

function build200Fonts() {
  const families = [
    { category: "sans-modern", base: "Be Vietnam Pro", list: ["Be Vietnam Pro", "Inter", "Plus Jakarta Sans", "Montserrat", "Nunito Sans"] },
    { category: "display-bold", base: "Anton", list: ["Anton", "Oswald", "Bebas Neue", "Archivo Black", "Righteous"] },
    { category: "serif-cinema", base: "Playfair Display", list: ["Playfair Display", "Merriweather", "Lora", "Roboto Slab", "Cormorant Garamond"] },
    { category: "script-hand", base: "Pacifico", list: ["Pacifico", "Dancing Script", "Comfortaa", "Caveat", "Patrick Hand"] },
    { category: "tech-cyber", base: "Orbitron", list: ["Orbitron", "Chakra Petch", "Space Grotesk", "Audiowide", "Exo 2"] },
    { category: "rounded-vlog", base: "Quicksand", list: ["Quicksand", "Nunito", "Comfortaa", "Varela Round", "Fredoka"] },
    { category: "mono-code", base: "JetBrains Mono", list: ["JetBrains Mono", "Fira Code", "Space Mono", "IBM Plex Mono", "Source Code Pro"] },
    { category: "condensed-poster", base: "Barlow Condensed", list: ["Barlow Condensed", "Oswald", "Saira Condensed", "Anton", "Bangers"] }
  ];

  const weights = [
    { suffix: "Mỏng Thanh Lịch (300)", w: 300, italic: false, ls: "0px" },
    { suffix: "Thường Sạch (400)", w: 400, italic: false, ls: "0px" },
    { suffix: "Đậm Vừa (600)", w: 600, italic: false, ls: "0.3px" },
    { suffix: "Siêu Đậm (800)", w: 800, italic: false, ls: "0.5px" },
    { suffix: "Nghiêng Nghệ Thuật (700i)", w: 700, italic: true, ls: "1.2px" }
  ];

  const fonts = [];
  families.forEach((grp) => {
    for (let i = 0; i < 25; i++) {
      const num = String(i + 1).padStart(2, "0");
      const fam = grp.list[Math.floor(i / 5) % grp.list.length];
      const wStyle = weights[i % 5];
      fonts.push({
        id: `font-${grp.category}-${num}`,
        name: `${fam} — ${wStyle.suffix}`,
        category: grp.category,
        fontFamily: `'${fam}', sans-serif`,
        fontWeight: wStyle.w,
        fontStyle: wStyle.italic ? "italic" : "normal",
        letterSpacing: wStyle.ls,
        sampleText: "Chữ Mẫu Tiếng Việt 123"
      });
    }
  });
  return fonts;
}

const TRANSITIONS = [
  { id: "none", name: "Cắt Thẳng (Cut)", icon: "✂️", duration: 0 },
  { id: "crossfade", name: "Mờ Dần (Crossfade)", icon: "🌫️", duration: 0.45 },
  { id: "flash-white", name: "Chớp Trắng (Flash)", icon: "⚡", duration: 0.30 },
  { id: "flash-black", name: "Tối Dần (Fade Black)", icon: "🌑", duration: 0.40 },
  { id: "glitch-cut", name: "Chuyển Glitch RGB", icon: "📺", duration: 0.35 },
  { id: "zoom-in", name: "Phóng To Vào (Zoom In)", icon: "🔍", duration: 0.35 },
  { id: "zoom-out", name: "Thu Nhỏ Ra (Zoom Out)", icon: "🔎", duration: 0.35 },
  { id: "slide-left", name: "Trượt Sang Trái", icon: "⬅️", duration: 0.40 },
  { id: "slide-right", name: "Trượt Sang Phải", icon: "➡️", duration: 0.40 },
  { id: "slide-up", name: "Trượt Lên Trên", icon: "⬆️", duration: 0.40 },
  { id: "slide-down", name: "Trượt Xuống Dưới", icon: "⬇️", duration: 0.40 },
  { id: "whip-blur", name: "Lia Nhanh (Whip Pan)", icon: "💨", duration: 0.30 },
  { id: "iris-circle", name: "Mở Vòng Tròn (Iris)", icon: "⭕", duration: 0.50 },
  { id: "spin-whip", name: "Xoay Vòng Nhanh (Spin)", icon: "🌀", duration: 0.40 },
  { id: "burn-film", name: "Cháy Phim (Film Burn)", icon: "🔥", duration: 0.45 },
  { id: "luma-wipe", name: "Quét Ánh Sáng (Luma)", icon: "☀️", duration: 0.45 },
  { id: "pixelate", name: "Vỡ Hạt Pixel", icon: "👾", duration: 0.35 },
  { id: "dream-dissolve", name: "Hòa Tan Mơ Màng", icon: "☁️", duration: 0.55 },
  { id: "rgb-split", name: "Tách Kênh Màu RGB", icon: "🌈", duration: 0.35 },
  { id: "shake-cut", name: "Rung Va Chạm (Shake)", icon: "📳", duration: 0.30 }
];

const COLOR_LUTS = build200Luts();
const VFX_FILTERS = build200Vfx();
const GRAPHIC_PRESETS = build200Graphics();
const TEXT_STYLES = build200TextStyles();
const FONT_PRESETS = build200Fonts();

module.exports = {
  COLOR_LUTS,
  VFX_FILTERS,
  GRAPHIC_PRESETS,
  TEXT_STYLES,
  FONT_PRESETS,
  TRANSITIONS
};
