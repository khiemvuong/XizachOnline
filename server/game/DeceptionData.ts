import type {
  MeansCard,
  ClueCard,
  SceneTile,
  SceneTileOption,
} from "./DeceptionTypes";

// ─── Means Cards (90 cards from base game) ───

export const MEANS_CARDS: MeansCard[] = [
  // ── blade ──
  { id: 1,  english: "Axe",            vietnamese: "Rìu",              group: "blade",      description: "Chặt hoặc đập bằng rìu nặng" },
  { id: 2,  english: "Bamboo Tip",     vietnamese: "Ngọn tre nhọn",   group: "blade",      description: "Dùng ngọn tre sắc đâm thủng" },
  { id: 3,  english: "Box Cutter",     vietnamese: "Dao rọc giấy",    group: "blade",      description: "Dao nhỏ sắc bén cắt da thịt" },
  { id: 4,  english: "Cleaver",        vietnamese: "Dao chặt thịt",   group: "blade",      description: "Dao to chặt xương/thịt" },
  { id: 5,  english: "Dagger",         vietnamese: "Dao găm",         group: "blade",      description: "Dao ngắn đâm chí mạng" },
  { id: 6,  english: "Hook",           vietnamese: "Móc sắt",         group: "blade",      description: "Móc và xé rách da thịt" },
  { id: 7,  english: "Knife And Fork", vietnamese: "Dao và nĩa",      group: "blade",      description: "Đâm bằng bộ dao nĩa" },
  { id: 8,  english: "Machete",        vietnamese: "Dao rựa",         group: "blade",      description: "Chém bằng dao rựa lớn" },
  { id: 9,  english: "Razor Blade",    vietnamese: "Lưỡi dao cạo",    group: "blade",      description: "Cắt cổ họng hoặc mạch máu" },
  { id: 10, english: "Scissors",       vietnamese: "Kéo",             group: "blade",      description: "Đâm hoặc cắt bằng kéo" },
  { id: 11, english: "Throat Slit",    vietnamese: "Cắt cổ",          group: "blade",      description: "Cắt đứt động mạch cổ" },
  // ── blunt ──
  { id: 12, english: "Bat",            vietnamese: "Gậy bóng chày",   group: "blunt",      description: "Đánh bằng gậy gây chấn thương sọ" },
  { id: 13, english: "Brick",          vietnamese: "Gạch",            group: "blunt",      description: "Ném hoặc đập bằng gạch" },
  { id: 14, english: "Candlestick",    vietnamese: "Chân nến",        group: "blunt",      description: "Đập bằng chân nến kim loại" },
  { id: 15, english: "Crutch",         vietnamese: "Nạng",            group: "blunt",      description: "Đánh bằng nạng kim loại/gỗ" },
  { id: 16, english: "Dumbbell",       vietnamese: "Tạ tay",          group: "blunt",      description: "Đập bằng quả tạ nặng" },
  { id: 17, english: "Folding Chair",  vietnamese: "Ghế gấp",         group: "blunt",      description: "Đập bằng ghế gấp" },
  { id: 18, english: "Hammer",         vietnamese: "Búa",             group: "blunt",      description: "Đập đầu bằng búa" },
  { id: 19, english: "Ice Skates",     vietnamese: "Giày trượt băng", group: "blunt",      description: "Cắt bằng lưỡi giày sắc" },
  { id: 20, english: "Kick",           vietnamese: "Đá",              group: "blunt",      description: "Đá mạnh gây nội thương" },
  { id: 21, english: "Punch",          vietnamese: "Đấm",             group: "blunt",      description: "Đấm tay không chí mạng" },
  { id: 22, english: "Sculpture",      vietnamese: "Tượng",           group: "blunt",      description: "Đập bằng tượng nặng" },
  { id: 23, english: "Steel Tube",     vietnamese: "Ống thép",        group: "blunt",      description: "Đánh bằng ống thép" },
  { id: 24, english: "Stone",          vietnamese: "Đá",              group: "blunt",      description: "Ném đá hoặc đập đá" },
  { id: 25, english: "Trophy",         vietnamese: "Cúp",             group: "blunt",      description: "Đập bằng cúp kim loại" },
  { id: 26, english: "Wrench",         vietnamese: "Cờ lê",           group: "blunt",      description: "Đập bằng cờ lê lớn" },
  { id: 78, english: "Potted Plant",   vietnamese: "Chậu cây",        group: "blunt",      description: "Đập bằng chậu cây" },
  { id: 90, english: "Trowel",         vietnamese: "Xẻng nhỏ",        group: "blunt",      description: "Đập hoặc đâm bằng xẻng" },
  // ── poison ──
  { id: 27, english: "Alcohol",        vietnamese: "Rượu / Chất cồn", group: "poison",     description: "Ngộ độc bằng rượu pha độc" },
  { id: 29, english: "Arsenic",        vietnamese: "Thạch tín",       group: "poison",     description: "Chất độc cổ điển" },
  { id: 30, english: "Chemicals",      vietnamese: "Hóa chất",        group: "poison",     description: "Hóa chất ăn mòn da/thận" },
  { id: 32, english: "Illegal Drug",   vietnamese: "Ma túy",          group: "poison",     description: "Quá liều ma túy" },
  { id: 33, english: "Injection",      vietnamese: "Tiêm chích",      group: "poison",     description: "Tiêm độc trực tiếp" },
  { id: 34, english: "Liquid Drug",    vietnamese: "Thuốc lỏng",      group: "poison",     description: "Uống hoặc tiêm thuốc độc" },
  { id: 35, english: "Mercury",        vietnamese: "Thủy ngân",       group: "poison",     description: "Ngộ độc thủy ngân" },
  { id: 36, english: "Pesticide",      vietnamese: "Thuốc trừ sâu",   group: "poison",     description: "Uống thuốc trừ sâu" },
  { id: 37, english: "Pill",           vietnamese: "Viên thuốc",      group: "poison",     description: "Nuốt viên thuốc độc" },
  { id: 40, english: "Poisonous Needle",vietnamese: "Kim độc",         group: "poison",     description: "Đâm kim tẩm độc" },
  { id: 41, english: "Powder Drug",    vietnamese: "Bột thuốc",       group: "poison",     description: "Hít hoặc nuốt bột độc" },
  { id: 42, english: "Sulfuric Acid",  vietnamese: "Axit sulfuric",   group: "poison",     description: "Đổ axit ăn mòn" },
  { id: 77, english: "Overdose",       vietnamese: "Quá liều",        group: "poison",     description: "Quá liều thuốc" },
  { id: 86, english: "Wine",           vietnamese: "Rượu vang",       group: "poison",     description: "Rượu vang pha độc" },
  // ── biological ──
  { id: 28, english: "Amoeba",         vietnamese: "Amip",            group: "biological", description: "Nhiễm ký sinh trùng amip" },
  { id: 31, english: "Dirty Water",    vietnamese: "Nước bẩn",        group: "biological", description: "Ngộ độc nước nhiễm khuẩn" },
  { id: 38, english: "Plague",         vietnamese: "Dịch hạch",       group: "biological", description: "Lây bệnh dịch" },
  { id: 43, english: "Venomous Scorpion",vietnamese: "Bọ cạp độc",    group: "biological", description: "Cắn bởi bọ cạp" },
  { id: 44, english: "Venomous Snake", vietnamese: "Rắn độc",         group: "biological", description: "Cắn bởi rắn độc" },
  { id: 45, english: "Virus",          vietnamese: "Virus",           group: "biological", description: "Nhiễm virus chí mạng" },
  { id: 74, english: "Mad Dog",        vietnamese: "Chó dại",         group: "biological", description: "Bị chó dại cắn" },
  // ── asphyxia ──
  { id: 39, english: "Poisonous Gas",  vietnamese: "Khí độc",         group: "asphyxia",   description: "Hít phải khí độc" },
  { id: 46, english: "Belt",           vietnamese: "Thắt lưng",       group: "asphyxia",   description: "Siết cổ bằng thắt lưng" },
  { id: 47, english: "Bury",           vietnamese: "Chôn sống",       group: "asphyxia",   description: "Chôn nạn nhân còn sống" },
  { id: 48, english: "Drown",          vietnamese: "Đuối nước",       group: "asphyxia",   description: "Nhúng đầu vào nước" },
  { id: 49, english: "Pillow",         vietnamese: "Gối",             group: "asphyxia",   description: "Bịt miệng bằng gối" },
  { id: 50, english: "Plastic Bag",    vietnamese: "Túi ni lông",     group: "asphyxia",   description: "Bịt đầu bằng túi" },
  { id: 51, english: "Rope",           vietnamese: "Dây thừng",       group: "asphyxia",   description: "Thắt cổ bằng dây" },
  { id: 52, english: "Scarf",          vietnamese: "Khăn quàng",      group: "asphyxia",   description: "Siết cổ bằng khăn" },
  { id: 53, english: "Towel",          vietnamese: "Khăn tắm",        group: "asphyxia",   description: "Bịt miệng/mũi" },
  { id: 54, english: "Packing Tape",   vietnamese: "Băng keo",        group: "asphyxia",   description: "Băng kín miệng/mũi" },
  { id: 66, english: "Smoke",          vietnamese: "Khói",            group: "asphyxia",   description: "Ngạt khói" },
  { id: 75, english: "Metal Chain",    vietnamese: "Xích sắt",        group: "asphyxia",   description: "Đánh hoặc siết bằng xích" },
  { id: 76, english: "Metal Wire",     vietnamese: "Dây thép",        group: "asphyxia",   description: "Siết hoặc cắt bằng dây thép" },
  { id: 87, english: "Wire",           vietnamese: "Dây điện",        group: "asphyxia",   description: "Siết hoặc giật bằng dây" },
  // ── electric ──
  { id: 55, english: "Electric Baton", vietnamese: "Roi điện",        group: "electric",   description: "Roi gây giật điện" },
  { id: 56, english: "Electric Current",vietnamese: "Dòng điện",       group: "electric",   description: "Giật điện trực tiếp" },
  { id: 57, english: "E-Bike",         vietnamese: "Xe đạp điện",     group: "electric",   description: "Đâm bằng xe điện" },
  { id: 58, english: "Video Game Console",vietnamese: "Máy chơi game", group: "electric",   description: "Dùng thiết bị điện giết" },
  { id: 59, english: "Machine",        vietnamese: "Máy móc",         group: "electric",   description: "Bị máy nghiền" },
  // ── fire ──
  { id: 60, english: "Arson",          vietnamese: "Đốt phá",         group: "fire",       description: "Đốt lửa thiêu sống" },
  { id: 61, english: "Explosives",     vietnamese: "Chất nổ",         group: "fire",       description: "Bom hoặc chất nổ" },
  { id: 62, english: "Gunpowder",      vietnamese: "Thuốc súng",      group: "fire",       description: "Nổ bằng thuốc súng" },
  { id: 63, english: "Kerosene",       vietnamese: "Dầu hỏa",         group: "fire",       description: "Đốt bằng dầu hỏa" },
  { id: 64, english: "Lighter",        vietnamese: "Bật lửa",         group: "fire",       description: "Đốt bằng bật lửa" },
  { id: 65, english: "Match",          vietnamese: "Que diêm",        group: "fire",       description: "Châm lửa" },
  // ── misc ──
  { id: 67, english: "Bite And Tear",  vietnamese: "Cắn xé",          group: "misc",       description: "Cắn và xé thịt" },
  { id: 68, english: "Blender",        vietnamese: "Máy xay sinh tố", group: "misc",       description: "Xay nạn nhân" },
  { id: 69, english: "Blood Release",  vietnamese: "Thả máu",         group: "misc",       description: "Làm chảy máu đến chết" },
  { id: 70, english: "Chainsaw",       vietnamese: "Cưa xích",        group: "misc",       description: "Cưa điện cắt rời" },
  { id: 71, english: "Dismember",      vietnamese: "Phân thây",       group: "misc",       description: "Cắt rời cơ thể" },
  { id: 72, english: "Drill",          vietnamese: "Khoan điện",      group: "misc",       description: "Khoan thủng đầu" },
  { id: 73, english: "Locked Room",    vietnamese: "Phòng khóa",      group: "misc",       description: "Giết trong phòng bí mật" },
  { id: 79, english: "Push",           vietnamese: "Đẩy",             group: "misc",       description: "Đẩy từ trên cao" },
  { id: 80, english: "Radiation",      vietnamese: "Bức xạ",          group: "misc",       description: "Tiếp xúc phóng xạ" },
  { id: 81, english: "Sniper",         vietnamese: "Súng bắn tỉa",    group: "misc",       description: "Bắn tỉa từ xa" },
  { id: 82, english: "Starvation",     vietnamese: "Nhịn đói",        group: "misc",       description: "Để nạn nhân chết đói" },
  { id: 83, english: "Surgery",        vietnamese: "Phẫu thuật",      group: "misc",       description: "Phẫu thuật sai" },
  { id: 84, english: "Unarmed",        vietnamese: "Tay không",       group: "misc",       description: "Giết bằng tay không" },
  { id: 85, english: "Whip",           vietnamese: "Roi da",          group: "misc",       description: "Đánh bằng roi" },
  { id: 88, english: "Work",           vietnamese: "Công việc (mệt mỏi)", group: "misc",  description: "Làm việc kiệt sức" },
  { id: 89, english: "Pistol",         vietnamese: "Súng ngắn",       group: "misc",       description: "Bắn bằng súng ngắn" },
];

// ─── Clue Cards (70 cards from base game) ───

export const CLUE_CARDS: ClueCard[] = [
  { "id": 1,  "english": "Earrings",       "vietnamese": "Hoa tai",                  "group": "accessory", "description": "Hoa tai rơi hoặc bị kéo đứt" },
  { "id": 2,  "english": "High Heel",      "vietnamese": "Giày cao gót",             "group": "accessory", "description": "Giày cao gót bị gãy hoặc in dấu" },
  { "id": 3,  "english": "Lace",           "vietnamese": "Ren / Dây buộc",           "group": "accessory", "description": "Dây ren hoặc dây buộc quần áo" },
  { "id": 4,  "english": "Necklace",       "vietnamese": "Dây chuyền",               "group": "accessory", "description": "Dây chuyền bị đứt tại hiện trường" },
  { "id": 5,  "english": "Scarf (Clue)",   "vietnamese": "Khăn quàng (Manh mối)",    "group": "accessory", "description": "Khăn quàng rách hoặc dùng siết" },
  { "id": 6,  "english": "Shoe Print",     "vietnamese": "Dấu giày",                 "group": "accessory", "description": "Dấu chân giày rõ ràng" },
  { "id": 7,  "english": "Sunglasses",     "vietnamese": "Kính râm",                 "group": "accessory", "description": "Kính râm vỡ hoặc rơi" },
  { "id": 8,  "english": "Toupee",         "vietnamese": "Tóc giả",                  "group": "accessory", "description": "Tóc giả rụng hoặc bị kéo" },
  { "id": 9,  "english": "Wallet",         "vietnamese": "Ví tiền",                  "group": "accessory", "description": "Ví tiền rơi, chứa giấy tờ" },
  { "id": 10, "english": "Button",         "vietnamese": "Cúc áo",                   "group": "accessory", "description": "Cúc áo bị rách rơi" },
  { "id": 11, "english": "Zipper",         "vietnamese": "Khóa kéo",                 "group": "accessory", "description": "Khóa kéo quần áo bị hỏng" },
  { "id": 12, "english": "Glove",          "vietnamese": "Găng tay",                 "group": "accessory", "description": "Găng tay da hoặc vải" },
  { "id": 13, "english": "Briefcase",      "vietnamese": "Cặp tài liệu",             "group": "document",  "description": "Cặp da đựng giấy tờ quan trọng" },
  { "id": 14, "english": "For Sale Sign",  "vietnamese": "Bảng bán nhà",             "group": "document",  "description": "Bảng bán hoặc cho thuê" },
  { "id": 15, "english": "Greetings Card", "vietnamese": "Thiệp chúc mừng",          "group": "document",  "description": "Thiệp có chữ viết tay" },
  { "id": 16, "english": "Shredded Paper", "vietnamese": "Giấy vụn",                 "group": "document",  "description": "Giấy tài liệu bị xé nhỏ" },
  { "id": 17, "english": "Ticket",         "vietnamese": "Vé",                       "group": "document",  "description": "Vé tàu, xe, máy bay hoặc sự kiện" },
  { "id": 18, "english": "Business Card",  "vietnamese": "Danh thiếp",               "group": "document",  "description": "Danh thiếp cá nhân" },
  { "id": 19, "english": "Receipt",        "vietnamese": "Hóa đơn",                  "group": "document",  "description": "Hóa đơn mua hàng" },
  { "id": 20, "english": "Diary",          "vietnamese": "Nhật ký",                  "group": "document",  "description": "Sổ tay ghi chép cá nhân" },
  { "id": 21, "english": "Letter",         "vietnamese": "Thư",                      "group": "document",  "description": "Thư tay hoặc in" },
  { "id": 22, "english": "Cigarette Butt", "vietnamese": "Mẩu thuốc lá",             "group": "forensic",  "description": "Mẩu thuốc lá hút dở" },
  { "id": 23, "english": "Hair Strand",    "vietnamese": "Sợi tóc",                  "group": "forensic",  "description": "Sợi tóc rụng" },
  { "id": 24, "english": "Partial Print",  "vietnamese": "Dấu vân tay một phần",     "group": "forensic",  "description": "Dấu vân tay không đầy đủ" },
  { "id": 25, "english": "Blood Stain",    "vietnamese": "Vết máu",                  "group": "forensic",  "description": "Vết máu nhỏ giọt" },
  { "id": 26, "english": "Fingernail",     "vietnamese": "Móng tay",                 "group": "forensic",  "description": "Móng tay gãy hoặc vết xước" },
  { "id": 27, "english": "Lipstick Mark",  "vietnamese": "Dấu son môi",              "group": "forensic",  "description": "Dấu son trên ly hoặc khăn" },
  { "id": 28, "english": "Fingerprint",    "vietnamese": "Dấu vân tay",              "group": "forensic",  "description": "Dấu vân tay rõ" },
  { "id": 29, "english": "Blister Pack",   "vietnamese": "Vỉ thuốc",                 "group": "household", "description": "Vỉ thuốc (có thể chứa độc)" },
  { "id": 30, "english": "Coaster",        "vietnamese": "Đế lót ly",                "group": "household", "description": "Đế lót cốc uống nước" },
  { "id": 31, "english": "Picture Frame",  "vietnamese": "Khung ảnh",                "group": "household", "description": "Khung ảnh vỡ hoặc có vết" },
  { "id": 32, "english": "Pipe",           "vietnamese": "Ống nước / Ống dẫn",       "group": "household", "description": "Ống kim loại hoặc nhựa" },
  { "id": 33, "english": "Table Lamp",     "vietnamese": "Đèn bàn",                  "group": "household", "description": "Đèn bàn vỡ hoặc nặng" },
  { "id": 34, "english": "Umbrella",       "vietnamese": "Ô",                        "group": "household", "description": "Ô gãy hoặc dùng làm vũ khí" },
  { "id": 35, "english": "Key",            "vietnamese": "Chìa khóa",                "group": "household", "description": "Chìa khóa nhà hoặc xe" },
  { "id": 36, "english": "Remote Control", "vietnamese": "Điều khiển từ xa",         "group": "household", "description": "Remote TV hoặc máy lạnh" },
  { "id": 37, "english": "Candle",         "vietnamese": "Nến",                      "group": "household", "description": "Nến cháy dở hoặc sáp" },
  { "id": 38, "english": "Wine Glass",     "vietnamese": "Ly rượu vang",             "group": "household", "description": "Ly rượu có dấu son hoặc vết" },
  { "id": 39, "english": "Compass",        "vietnamese": "La bàn",                   "group": "tech",      "description": "La bàn định hướng" },
  { "id": 40, "english": "Detonator",      "vietnamese": "Bộ kích nổ",               "group": "tech",      "description": "Thiết bị kích nổ bom" },
  { "id": 41, "english": "Floppy Disk",    "vietnamese": "Đĩa mềm",                  "group": "tech",      "description": "Đĩa lưu trữ cũ" },
  { "id": 42, "english": "Memory Card",    "vietnamese": "Thẻ nhớ",                  "group": "tech",      "description": "Thẻ nhớ máy ảnh hoặc camera" },
  { "id": 43, "english": "Phone",          "vietnamese": "Điện thoại",               "group": "tech",      "description": "Điện thoại di động rơi" },
  { "id": 44, "english": "Sat Nav",        "vietnamese": "Thiết bị GPS",             "group": "tech",      "description": "Máy dẫn đường vệ tinh" },
  { "id": 45, "english": "Stopwatch",      "vietnamese": "Đồng hồ bấm giờ",         "group": "tech",      "description": "Đồng hồ đo thời gian" },
  { "id": 46, "english": "USB Drive",      "vietnamese": "USB lưu trữ",              "group": "tech",      "description": "Ổ USB chứa dữ liệu" },
  { "id": 47, "english": "Laptop",         "vietnamese": "Máy tính xách tay",        "group": "tech",      "description": "Laptop hoặc máy tính" },
  { "id": 48, "english": "Headphone",      "vietnamese": "Tai nghe",                 "group": "tech",      "description": "Tai nghe rơi" },
  { "id": 49, "english": "Garbage",        "vietnamese": "Rác thải",                 "group": "container", "description": "Túi rác hoặc rác tại hiện trường" },
  { "id": 50, "english": "Pig",            "vietnamese": "Heo (đồ chơi/mô hình)",   "group": "outdoor",   "description": "Đồ chơi heo hoặc dấu vết lạ" },
  { "id": 51, "english": "Sea Shell",      "vietnamese": "Vỏ sò biển",              "group": "outdoor",   "description": "Vỏ sò hoặc vỏ ốc" },
  { "id": 52, "english": "Tricycle",       "vietnamese": "Xe đạp ba bánh",           "group": "outdoor",   "description": "Xe đạp trẻ em" },
  { "id": 53, "english": "Twine",          "vietnamese": "Dây xe chỉ",              "group": "outdoor",   "description": "Dây buộc nhỏ" },
  { "id": 54, "english": "Tyre Tracks",    "vietnamese": "Dấu lốp xe",              "group": "outdoor",   "description": "Dấu bánh xe ô tô" },
  { "id": 55, "english": "Broken Vase",    "vietnamese": "Bình hoa vỡ",             "group": "household", "description": "Mảnh bình hoa sứ vỡ" },
  { "id": 56, "english": "Claw Hammer",    "vietnamese": "Búa chim",                "group": "household", "description": "Búa chim (có thể là vũ khí)" },
  { "id": 57, "english": "Trowel",         "vietnamese": "Xẻng nhỏ (Manh mối)",    "group": "household", "description": "Xẻng làm vườn nhỏ" },
  { "id": 58, "english": "Clown Nose",     "vietnamese": "Mũi hề khổng lồ",        "group": "outdoor",   "description": "Mũi hề nhựa lớn (rất lạ)" },
  { "id": 59, "english": "Book",           "vietnamese": "Sách",                    "group": "document",  "description": "Sách hoặc trang sách" },
  { "id": 60, "english": "Newspaper",      "vietnamese": "Báo",                     "group": "document",  "description": "Báo cũ có tin tức" },
  { "id": 61, "english": "Map",            "vietnamese": "Bản đồ",                  "group": "document",  "description": "Bản đồ khu vực" },
  { "id": 62, "english": "Photo",          "vietnamese": "Ảnh",                     "group": "document",  "description": "Ảnh chụp cá nhân" },
  { "id": 63, "english": "Credit Card",    "vietnamese": "Thẻ tín dụng",            "group": "accessory", "description": "Thẻ tín dụng rơi" },
  { "id": 64, "english": "Ring",           "vietnamese": "Nhẫn",                    "group": "accessory", "description": "Nhẫn kim cương hoặc cưới" },
  { "id": 65, "english": "Bracelet",       "vietnamese": "Vòng tay",                "group": "accessory", "description": "Vòng tay bị đứt" },
  { "id": 66, "english": "Hat",            "vietnamese": "Mũ",                      "group": "accessory", "description": "Mũ rơi" },
  { "id": 67, "english": "Backpack",       "vietnamese": "Ba lô",                   "group": "container", "description": "Ba lô chứa đồ" },
  { "id": 68, "english": "Suitcase",       "vietnamese": "Va li",                   "group": "container", "description": "Va li du lịch" },
  { "id": 69, "english": "Fishing Rod",    "vietnamese": "Cần câu cá",             "group": "outdoor",   "description": "Cần câu" },
  { "id": 70, "english": "Golf Club",      "vietnamese": "Gậy golf",               "group": "outdoor",   "description": "Gậy golf" },

  { "id": 71, "english": "Watch",          "vietnamese": "Đồng hồ đeo tay",         "group": "accessory", "description": "Đồng hồ dừng đúng giờ xảy ra vụ án" },
  { "id": 72, "english": "Belt Buckle",    "vietnamese": "Khóa thắt lưng",          "group": "accessory", "description": "Khóa thắt lưng kim loại nặng rơi lại" },
  { "id": 73, "english": "Necktie",        "vietnamese": "Cà vạt",                  "group": "accessory", "description": "Cà vạt lụa bị rách hoặc kéo lệch" },
  { "id": 74, "english": "Handbag",        "vietnamese": "Túi xách tay",            "group": "accessory", "description": "Túi xách bị lục lọc vứt bỏ" },
  { "id": 75, "english": "Face Mask",      "vietnamese": "Khẩu trang",              "group": "accessory", "description": "Khẩu trang dùng che mặt hoặc lọc" },
  { "id": 76, "english": "Hair Pin",       "vietnamese": "Kẹp tóc",                 "group": "accessory", "description": "Kẹp tóc rơi trong lúc xô xát" },
  { "id": 77, "english": "Brooch",         "vietnamese": "Ghim cài áo",             "group": "accessory", "description": "Ghim cài trang trí mất khỏi người" },
  { "id": 78, "english": "Anklet",         "vietnamese": "Vòng cổ chân",            "group": "accessory", "description": "Vòng chân bị đứt hoặc kéo rơi" },
  { "id": 79, "english": "Cufflink",       "vietnamese": "Khuy măng sét",           "group": "accessory", "description": "Khuy tay áo đắt tiền rơi xuống sàn" },
  { "id": 80, "english": "Name Tag",       "vietnamese": "Thẻ tên",                 "group": "accessory", "description": "Thẻ đeo tên bị giật ra" },
  { "id": 81, "english": "Headband",       "vietnamese": "Băng đô",                 "group": "accessory", "description": "Băng đầu vải còn dính vài sợi tóc" },
  { "id": 82, "english": "Key Chain",      "vietnamese": "Móc chìa khóa",           "group": "accessory", "description": "Móc chìa khóa có hình đặc trưng" },
  { "id": 83, "english": "Wristband",      "vietnamese": "Vòng tay thể thao",       "group": "accessory", "description": "Vòng cao su ghi sự kiện hoặc nhóm máu" },

  { "id": 84,  "english": "Will",               "vietnamese": "Di chúc",                 "group": "document",  "description": "Di chúc chia tài sản đang tranh chấp" },
  { "id": 85,  "english": "Contract",            "vietnamese": "Hợp đồng",                "group": "document",  "description": "Hợp đồng có chữ ký giả mạo" },
  { "id": 86,  "english": "Insurance Policy",    "vietnamese": "Hợp đồng bảo hiểm",      "group": "document",  "description": "Hợp đồng bảo hiểm nhân thọ giá trị lớn" },
  { "id": 87,  "english": "Certificate",         "vietnamese": "Chứng chỉ / Bằng khen",  "group": "document",  "description": "Bằng khen hoặc chứng nhận chuyên môn" },
  { "id": 88,  "english": "Ransom Note",          "vietnamese": "Thư đòi tiền chuộc",     "group": "document",  "description": "Thư cắt ghép chữ từ nhiều nguồn" },
  { "id": 89,  "english": "Sticky Note",          "vietnamese": "Tờ ghi chú nhỏ",         "group": "document",  "description": "Mảnh giấy ghi vội số điện thoại hoặc địa chỉ" },
  { "id": 90,  "english": "Prescription",         "vietnamese": "Đơn thuốc",               "group": "document",  "description": "Đơn thuốc kê loại dược phẩm đặc biệt" },
  { "id": 91,  "english": "ID Card",              "vietnamese": "Thẻ căn cước",            "group": "document",  "description": "Thẻ căn cước hoặc chứng minh nhân dân" },
  { "id": 92,  "english": "Passport",             "vietnamese": "Hộ chiếu",                "group": "document",  "description": "Hộ chiếu đã hết hạn hoặc nhiều visa" },
  { "id": 93,  "english": "Textbook",             "vietnamese": "Sách giáo khoa",          "group": "document",  "description": "Sách học có ghi chú bí ẩn bằng mực mờ" },
  { "id": 94,  "english": "Love Letter",          "vietnamese": "Thư tình",                "group": "document",  "description": "Thư tình bị xé rồi dán lại" },
  { "id": 95,  "english": "Threatening Letter",   "vietnamese": "Thư đe dọa",              "group": "document",  "description": "Thư cảnh báo tính mạng không rõ nguồn gốc" },
  { "id": 96,  "english": "Blueprint",            "vietnamese": "Bản vẽ thiết kế",         "group": "document",  "description": "Sơ đồ mặt bằng tòa nhà hoặc kế hoạch" },
  { "id": 97,  "english": "Report Card",          "vietnamese": "Học bạ",                  "group": "document",  "description": "Học bạ ghi chú điểm số và hạnh kiểm" },
  { "id": 98,  "english": "Arrest Warrant",       "vietnamese": "Lệnh bắt giữ",            "group": "document",  "description": "Giấy tờ pháp lý liên quan đến vụ án" },

  { "id": 99,  "english": "Bite Mark",         "vietnamese": "Dấu cắn",                  "group": "forensic",  "description": "Vết cắn hằn trên da hoặc vật thể" },
  { "id": 100, "english": "Scratch Mark",      "vietnamese": "Vết trầy xước",            "group": "forensic",  "description": "Vết cào xước dài trên bề mặt" },
  { "id": 101, "english": "Saliva",            "vietnamese": "Nước bọt",                 "group": "forensic",  "description": "Vết nước bọt còn lại trên vật thể" },
  { "id": 102, "english": "Soil Sample",       "vietnamese": "Mẫu đất",                  "group": "forensic",  "description": "Cục đất bùn bám vào giày hoặc quần áo" },
  { "id": 103, "english": "Fabric Fiber",      "vietnamese": "Sợi vải",                  "group": "forensic",  "description": "Sợi vải mắc kẹt từ quần áo hung thủ" },
  { "id": 104, "english": "Pollen Trace",      "vietnamese": "Dấu phấn hoa",             "group": "forensic",  "description": "Phấn hoa lạ bám trên quần áo hoặc da" },
  { "id": 105, "english": "Sweat Stain",       "vietnamese": "Vết mồ hôi",               "group": "forensic",  "description": "Vết mồ hôi trên quần áo hoặc tay cầm" },
  { "id": 106, "english": "Burnt Residue",     "vietnamese": "Tàn cháy",                 "group": "forensic",  "description": "Tàn tro hoặc cặn cháy còn lưu lại" },
  { "id": 107, "english": "Drug Residue",      "vietnamese": "Cặn chất kích thích",      "group": "forensic",  "description": "Cặn bột hoặc tinh thể trên bề mặt" },
  { "id": 108, "english": "Eyelash",           "vietnamese": "Lông mi",                  "group": "forensic",  "description": "Sợi lông mi rơi gần thi thể" },
  { "id": 109, "english": "Paint Chip",        "vietnamese": "Mảnh sơn",                 "group": "forensic",  "description": "Mảnh sơn bong từ xe hoặc tường" },
  { "id": 110, "english": "Glass Shard",       "vietnamese": "Mảnh thủy tinh",           "group": "forensic",  "description": "Mảnh kính nhỏ rải gần hiện trường" },
  { "id": 111, "english": "Mud Stain",         "vietnamese": "Vết bùn",                  "group": "forensic",  "description": "Vết bùn đặc trên sàn hoặc bề mặt" },
  { "id": 112, "english": "Wax Residue",       "vietnamese": "Cặn sáp nến",             "group": "forensic",  "description": "Sáp nến nhỏ giọt hoặc đông cứng" },
  { "id": 113, "english": "Insect Trace",      "vietnamese": "Dấu côn trùng",            "group": "forensic",  "description": "Côn trùng hoặc ấu trùng giúp xác định thời điểm" },
  { "id": 114, "english": "Rope Fiber",        "vietnamese": "Sợi dây thừng",            "group": "forensic",  "description": "Sợi xơ dây mắc kẹt trên tay hoặc vật thể" },
  { "id": 115, "english": "Chalk Dust",        "vietnamese": "Bụi phấn",                 "group": "forensic",  "description": "Bụi phấn trắng dính trên tay hoặc quần áo" },
  { "id": 116, "english": "Chemical Stain",    "vietnamese": "Vết hóa chất",             "group": "forensic",  "description": "Vết ăn mòn hoặc đổi màu bất thường" },
  { "id": 117, "english": "Sole Impression",   "vietnamese": "Dấu đế giày",              "group": "forensic",  "description": "Hoa văn đế giày in rõ trên bụi hoặc máu" },
  { "id": 118, "english": "Grease Stain",      "vietnamese": "Vết dầu mỡ",               "group": "forensic",  "description": "Vết dầu máy hoặc mỡ bôi trơn dính lại" },
  { "id": 119, "english": "Rust Flake",        "vietnamese": "Mảnh gỉ sắt",              "group": "forensic",  "description": "Mảnh gỉ sắt bong ra từ vũ khí kim loại" },

  { "id": 120, "english": "Ashtray",           "vietnamese": "Gạt tàn thuốc",            "group": "household", "description": "Gạt tàn đầy mẩu thuốc hoặc bị đổ" },
  { "id": 121, "english": "Wall Clock",        "vietnamese": "Đồng hồ treo tường",       "group": "household", "description": "Đồng hồ tường dừng lại bất thường" },
  { "id": 122, "english": "Mirror",            "vietnamese": "Gương",                    "group": "household", "description": "Gương có vết bàn tay hoặc nứt vỡ" },
  { "id": 123, "english": "Bottle",            "vietnamese": "Chai lọ",                  "group": "household", "description": "Chai lọ vỡ hoặc còn chất lỏng bên trong" },
  { "id": 124, "english": "Plate",             "vietnamese": "Đĩa ăn",                   "group": "household", "description": "Đĩa sứ bị vỡ vụn tại hiện trường" },
  { "id": 125, "english": "Blanket",           "vietnamese": "Chăn",                     "group": "household", "description": "Chăn vò nát hoặc dùng che đậy vật thể" },
  { "id": 126, "english": "Curtain",           "vietnamese": "Rèm cửa",                  "group": "household", "description": "Rèm bị xé rách hoặc còn dấu bám" },
  { "id": 127, "english": "Door Handle",       "vietnamese": "Tay nắm cửa",              "group": "household", "description": "Tay nắm cửa bị lau sạch bất thường" },
  { "id": 128, "english": "Bar of Soap",       "vietnamese": "Bánh xà phòng",            "group": "household", "description": "Xà phòng còn in hình ngón tay" },
  { "id": 129, "english": "Toolbox",           "vietnamese": "Hộp đồ nghề",              "group": "household", "description": "Hộp dụng cụ bị mở và thiếu một số vật" },
  { "id": 130, "english": "Ladder",            "vietnamese": "Thang",                    "group": "household", "description": "Thang gấp dựng sát tường không rõ lý do" },
  { "id": 131, "english": "Ruler",             "vietnamese": "Thước kẻ",                 "group": "household", "description": "Thước gỗ bị gãy đôi" },
  { "id": 132, "english": "Eraser",            "vietnamese": "Tẩy",                      "group": "household", "description": "Tẩy nhỏ có vết dơ bất thường" },
  { "id": 133, "english": "Chalkboard Eraser", "vietnamese": "Khăn lau bảng",            "group": "household", "description": "Khăn lau bảng đầy bụi phấn mới" },
  { "id": 134, "english": "Filing Cabinet",    "vietnamese": "Tủ hồ sơ",                "group": "household", "description": "Tủ hồ sơ bị cạy mở hoặc ngăn kéo trống" },
  { "id": 135, "english": "Cooking Pot",       "vietnamese": "Nồi nấu ăn",               "group": "household", "description": "Nồi đun sôi còn hơi nóng hoặc chứa thứ lạ" },

  { "id": 136, "english": "Camera",            "vietnamese": "Máy ảnh",                  "group": "tech",      "description": "Máy ảnh bị xóa toàn bộ dữ liệu" },
  { "id": 137, "english": "CCTV Recording",    "vietnamese": "Băng ghi hình",            "group": "tech",      "description": "Đoạn video camera an ninh bị cắt xén" },
  { "id": 138, "english": "Walkie Talkie",     "vietnamese": "Bộ đàm",                   "group": "tech",      "description": "Bộ đàm còn bật kênh liên lạc cuối" },
  { "id": 139, "english": "Drone",             "vietnamese": "Máy bay không người lái",  "group": "tech",      "description": "Drone bị rơi hoặc cánh quạt vỡ" },
  { "id": 140, "english": "Smartwatch",        "vietnamese": "Đồng hồ thông minh",       "group": "tech",      "description": "Đồng hồ thông minh ghi nhịp tim cuối" },
  { "id": 141, "english": "Tablet",            "vietnamese": "Máy tính bảng",            "group": "tech",      "description": "Máy tính bảng bị khóa mật khẩu hoặc vỡ" },
  { "id": 142, "english": "Printer",           "vietnamese": "Máy in",                   "group": "tech",      "description": "Máy in còn lưu tài liệu in cuối cùng" },
  { "id": 143, "english": "Hard Drive",        "vietnamese": "Ổ cứng",                   "group": "tech",      "description": "Ổ cứng bị tháo ra và dữ liệu bị xóa" },
  { "id": 144, "english": "Voice Recorder",    "vietnamese": "Máy ghi âm",               "group": "tech",      "description": "Máy ghi âm chứa đoạn âm thanh bí ẩn" },
  { "id": 145, "english": "Binoculars",        "vietnamese": "Ống nhòm",                 "group": "tech",      "description": "Ống nhòm hướng về địa điểm đặc biệt" },
  { "id": 146, "english": "Laser Pointer",     "vietnamese": "Bút laser",                "group": "tech",      "description": "Bút laser in vết lên tường hoặc người" },
  { "id": 147, "english": "Calculator",        "vietnamese": "Máy tính cầm tay",         "group": "tech",      "description": "Máy tính bỏ túi hiển thị dãy số bí ẩn" },
  { "id": 148, "english": "Radio",             "vietnamese": "Máy radio",                "group": "tech",      "description": "Radio đang phát kênh hoặc tần số lạ" },
  { "id": 149, "english": "Night Vision Goggles","vietnamese": "Kính nhìn đêm",          "group": "tech",      "description": "Kính quan sát ban đêm bị bỏ lại" },
  { "id": 150, "english": "Tracking Device",   "vietnamese": "Thiết bị định vị",         "group": "tech",      "description": "GPS bí mật giấu dưới gầm xe hoặc trong đồ" },
  { "id": 151, "english": "Security Card",     "vietnamese": "Thẻ bảo mật",              "group": "tech",      "description": "Thẻ từ mở cửa khu vực hạn chế" },
  { "id": 152, "english": "Microphone",        "vietnamese": "Micro nghe lén",           "group": "tech",      "description": "Micro nhỏ giấu để theo dõi" },
  { "id": 153, "english": "Signal Jammer",     "vietnamese": "Thiết bị gây nhiễu",       "group": "tech",      "description": "Thiết bị cắt sóng điện thoại trong khu vực" },
  { "id": 154, "english": "Electronic Lock",   "vietnamese": "Khóa điện tử",             "group": "tech",      "description": "Khóa kỹ thuật số bị bẻ hoặc giả mã" },

  { "id": 155, "english": "Trash Can",         "vietnamese": "Thùng rác",                "group": "container", "description": "Thùng rác chứa vật thể đáng ngờ bên trong" },
  { "id": 156, "english": "Cardboard Box",     "vietnamese": "Thùng carton",             "group": "container", "description": "Thùng bìa bị đóng lại hoặc chuyển vội" },
  { "id": 157, "english": "Wooden Crate",      "vietnamese": "Thùng gỗ",                 "group": "container", "description": "Thùng gỗ đóng đinh kín bí ẩn" },
  { "id": 158, "english": "Metal Barrel",      "vietnamese": "Thùng phi kim loại",       "group": "container", "description": "Thùng phi nặng mùi lạ hoặc bị hàn kín" },
  { "id": 159, "english": "Glass Jar",         "vietnamese": "Lọ thủy tinh",             "group": "container", "description": "Lọ thủy tinh chứa chất lỏng không nhãn" },
  { "id": 160, "english": "Tin Can",           "vietnamese": "Hộp thiếc",                "group": "container", "description": "Hộp thiếc chứa vật thể nhỏ bí ẩn" },
  { "id": 161, "english": "Sealed Envelope",   "vietnamese": "Phong bì dán kín",         "group": "container", "description": "Phong bì niêm phong chưa mở hoặc bị mở vụng" },
  { "id": 162, "english": "Lunch Box",         "vietnamese": "Hộp cơm",                  "group": "container", "description": "Hộp cơm học sinh còn nguyên chưa ăn" },
  { "id": 163, "english": "Shopping Bag",      "vietnamese": "Túi mua sắm",              "group": "container", "description": "Túi xách có hóa đơn bên trong còn mới" },
  { "id": 164, "english": "Desk Drawer",       "vietnamese": "Ngăn kéo bàn",             "group": "container", "description": "Ngăn kéo bị cậy mở hoặc thiếu vật" },
  { "id": 165, "english": "Safe",              "vietnamese": "Két sắt",                  "group": "container", "description": "Két sắt bị phá hoặc để mở không khóa" },
  { "id": 166, "english": "Cooler Box",        "vietnamese": "Thùng giữ lạnh",           "group": "container", "description": "Thùng đựng đồ lạnh mùi khác thường" },
  { "id": 167, "english": "Medicine Bottle",   "vietnamese": "Chai thuốc",               "group": "container", "description": "Chai thuốc không nhãn hoặc đã rỗng" },
  { "id": 168, "english": "Test Tube",         "vietnamese": "Ống nghiệm",               "group": "container", "description": "Ống thủy tinh đựng chất lỏng màu lạ" },
  { "id": 169, "english": "Gasoline Can",      "vietnamese": "Can xăng",                 "group": "container", "description": "Can xăng rỗng hoặc vẫn còn sót xăng" },
  { "id": 170, "english": "Flower Pot",        "vietnamese": "Chậu hoa",                 "group": "container", "description": "Chậu cây bị đào xới hoặc chôn vật lạ" },
  { "id": 171, "english": "Mailbox",           "vietnamese": "Hộp thư",                  "group": "container", "description": "Hộp thư đầy thư chưa lấy nhiều ngày" },
  { "id": 172, "english": "Toy Box",           "vietnamese": "Hộp đồ chơi",              "group": "container", "description": "Hộp đồ chơi trẻ em bị lục tung" },
  { "id": 173, "english": "Ammunition Box",    "vietnamese": "Hộp đạn",                  "group": "container", "description": "Hộp đựng đạn thiếu một số viên" },
  { "id": 174, "english": "Paint Bucket",      "vietnamese": "Xô sơn",                   "group": "container", "description": "Xô sơn còn ướt hoặc đổ tràn trên sàn" },
  { "id": 175, "english": "Water Bucket",      "vietnamese": "Xô nước",                  "group": "container", "description": "Xô nước bị lật úp hoặc còn đầy ắp" },
  { "id": 176, "english": "Pencil Case",       "vietnamese": "Hộp bút",                  "group": "container", "description": "Hộp bút học sinh chứa vật không thuộc học cụ" },
  { "id": 177, "english": "Thermos",           "vietnamese": "Bình giữ nhiệt",            "group": "container", "description": "Bình nước giữ nhiệt chứa chất lỏng lạ" },
  { "id": 178, "english": "First Aid Kit",     "vietnamese": "Hộp sơ cứu",               "group": "container", "description": "Hộp y tế bị lục và thiếu nhiều thuốc" },
  { "id": 179, "english": "Bag of Cement",     "vietnamese": "Bao xi măng",              "group": "container", "description": "Bao xi măng mở và còn vết mới trộn" },
  { "id": 180, "english": "Trash Bag",         "vietnamese": "Túi đựng rác đen",         "group": "container", "description": "Túi rác đen buộc chặt để ở vị trí lạ" },

  { "id": 181, "english": "Fallen Leaf",        "vietnamese": "Lá rụng",                 "group": "outdoor",   "description": "Đống lá bị xáo trộn bất thường" },
  { "id": 182, "english": "Broken Branch",      "vietnamese": "Cành cây gãy",            "group": "outdoor",   "description": "Cành gãy gục như chịu lực mạnh tác động" },
  { "id": 183, "english": "Muddy Boot Print",   "vietnamese": "Dấu ủng lấm bùn",        "group": "outdoor",   "description": "Vết ủng in sâu trên đất mềm ẩm" },
  { "id": 184, "english": "Fence Post",         "vietnamese": "Cột hàng rào",            "group": "outdoor",   "description": "Cột hàng rào bị bẻ cong hoặc đổ bất thường" },
  { "id": 185, "english": "Flower Petal",       "vietnamese": "Cánh hoa",               "group": "outdoor",   "description": "Cánh hoa rải rác không đúng chỗ" },
  { "id": 186, "english": "Spider Web",         "vietnamese": "Mạng nhện",               "group": "outdoor",   "description": "Mạng nhện còn nguyên — khu vực ít người qua" },
  { "id": 187, "english": "Bird Feather",       "vietnamese": "Lông chim",               "group": "outdoor",   "description": "Lông chim lạ không thuộc loài sống ở đây" },
  { "id": 188, "english": "Campfire Ash",       "vietnamese": "Tro lửa trại",            "group": "outdoor",   "description": "Tàn tro đống lửa đã nguội từ lâu" },
  { "id": 189, "english": "Shovel",             "vietnamese": "Xẻng đào đất",           "group": "outdoor",   "description": "Xẻng còn dính đất mới đào và ẩm" },
  { "id": 190, "english": "Garden Hose",        "vietnamese": "Ống tưới cây",            "group": "outdoor",   "description": "Ống nước vườn bị cắt đứt hoặc vứt bỏ" },
  { "id": 191, "english": "Signpost",           "vietnamese": "Biển chỉ đường",          "group": "outdoor",   "description": "Biển chỉ đường bị bẻ hoặc xoay sai hướng" },
  { "id": 192, "english": "Bench",              "vietnamese": "Ghế công viên",           "group": "outdoor",   "description": "Ghế đá có vết trầy hoặc mảnh vật thể" },
  { "id": 193, "english": "Dog Leash",          "vietnamese": "Dây xích chó",            "group": "outdoor",   "description": "Dây xích còn vòng cổ nhưng không còn chó" },
  { "id": 194, "english": "Bird Cage",          "vietnamese": "Lồng chim",               "group": "outdoor",   "description": "Lồng chim cửa mở hoặc bị phá khóa" },
  { "id": 195, "english": "Animal Bone",        "vietnamese": "Xương động vật",          "group": "outdoor",   "description": "Xương thú nhỏ còn mới hoặc được sắp xếp lạ" },
  { "id": 196, "english": "Tire Iron",          "vietnamese": "Thanh tháo bánh xe",      "group": "outdoor",   "description": "Dụng cụ tháo lốp vứt gần hiện trường" },
  { "id": 197, "english": "Abandoned Bicycle",  "vietnamese": "Xe đạp bỏ lại",          "group": "outdoor",   "description": "Xe đạp vứt lại đột ngột không có khóa" },
  { "id": 198, "english": "Swing",              "vietnamese": "Xích đu",                 "group": "outdoor",   "description": "Xích đu vẫn còn đung đưa khi tìm thấy" },
  { "id": 199, "english": "Cracked Pavement",   "vietnamese": "Vỉa hè nứt vỡ",          "group": "outdoor",   "description": "Nền đường hoặc sàn xi măng nứt bất thường" },
  { "id": 200, "english": "Discarded Rope",     "vietnamese": "Sợi dây vứt bỏ",         "group": "outdoor",   "description": "Dây thừng hoặc dây nylon vứt gần hiện trường" }
];

// ─── Scene Tiles ───

function opt(en: string, vi: string): SceneTileOption {
  return { text: en, textVi: vi };
}

export const CAUSE_OF_DEATH_TILE: Omit<SceneTile, "id" | "markerIndex"> = {
  name: "Cause of Death",
  nameVi: "Nguyên nhân tử vong",
  type: "mandatory_purple",
  options: [
    opt("Suffocation", "Ngạt thở"),
    opt("Severe Injury", "Chấn thương nghiêm trọng"),
    opt("Loss of Blood", "Mất máu"),
    opt("Illness / Disease", "Bệnh tật"),
    opt("Poisoning", "Trúng độc"),
    opt("Accident", "Tai nạn"),
  ],
};

export const LOCATION_TILES: Omit<SceneTile, "id" | "markerIndex">[] = [
  {
    name: "Location (Home)",
    nameVi: "Địa điểm (Nhà ở)",
    type: "mandatory_green",
    options: [
      opt("Living Room", "Phòng khách"),
      opt("Bedroom", "Phòng ngủ"),
      opt("Washroom", "Phòng vệ sinh"),
      opt("Kitchen", "Nhà bếp"),
      opt("Balcony", "Ban công"),
      opt("Vacation Home", "Nhà nghỉ mát"),
    ],
  },
  {
    name: "Location (Services)",
    nameVi: "Địa điểm (Dịch vụ)",
    type: "mandatory_green",
    options: [
      opt("Pub", "Quán rượu"),
      opt("Bookstore", "Hiệu sách"),
      opt("Restaurant", "Nhà hàng"),
      opt("Hotel", "Khách sạn"),
      opt("Hospital", "Bệnh viện"),
      opt("Building Site", "Công trường"),
    ],
  },
  {
    name: "Location (School)",
    nameVi: "Địa điểm (Trường học)",
    type: "mandatory_green",
    options: [
      opt("Playground", "Sân chơi"),
      opt("Classroom", "Phòng học"),
      opt("Dormitory", "Ký túc xá"),
      opt("Cafeteria", "Căng tin"),
      opt("Elevator", "Thang máy"),
      opt("Toilet", "Nhà vệ sinh"),
    ],
  },
  {
    name: "Location (Outdoors)",
    nameVi: "Địa điểm (Ngoài trời)",
    type: "mandatory_green",
    options: [
      opt("Forest", "Rừng cây"),
      opt("Field", "Cánh đồng"),
      opt("Mountain", "Đồi núi"),
      opt("Park", "Công viên"),
      opt("Alley", "Hẻm nhỏ"),
      opt("Woods", "Bụi rậm"),
    ],
  },
];

export const EVIDENCE_TILES: Omit<SceneTile, "id" | "markerIndex">[] = [
  {
    name: "Time of Death",
    nameVi: "Thời gian tử vong",
    type: "evidence_brown",
    options: [
      opt("Dawn", "Bình minh"),
      opt("Morning", "Buổi sáng"),
      opt("Noon", "Buổi trưa"),
      opt("Afternoon", "Buổi chiều"),
      opt("Evening", "Buổi tối"),
      opt("Midnight", "Nửa đêm"),
    ],
  },
  {
    name: "Corpse Condition",
    nameVi: "Tình trạng thi thể",
    type: "evidence_brown",
    options: [
      opt("Still Warm", "Còn hơi ấm"),
      opt("Stiff", "Tê cứng"),
      opt("Decayed", "Phân hủy"),
      opt("Incomplete", "Không nguyên vẹn"),
      opt("Intact", "Nguyên vẹn"),
      opt("Twisted", "Bị vặn xoắn"),
    ],
  },
  {
    name: "Victim's Expression",
    nameVi: "Cảm xúc nạn nhân",
    type: "evidence_brown",
    options: [
      opt("Peaceful", "Thanh thản"),
      opt("Struggling", "Vật vã"),
      opt("Frightened", "Sợ hãi"),
      opt("In Pain", "Đau đớn"),
      opt("Blank", "Vô hồn"),
      opt("Angry", "Tức giận"),
    ],
  },
  {
    name: "Hint on Corpse",
    nameVi: "Dấu vết trên thi thể",
    type: "evidence_brown",
    options: [
      opt("Head", "Phần Đầu"),
      opt("Chest", "Phần Ngực"),
      opt("Belly", "Phần Bụng"),
      opt("Arm/Leg", "Tay/Chân"),
      opt("Partial", "Một phần"),
      opt("All Over", "Toàn thân"),
    ],
  },
  {
    name: "Duration of Crime",
    nameVi: "Thời gian gây án",
    type: "evidence_brown",
    options: [
      opt("Instantaneous", "Tức thì"),
      opt("Brief", "Chóng vánh"),
      opt("Gradual", "Kéo dài"),
      opt("Prolonged", "Từ từ"),
      opt("Few Days", "Vài ngày"),
      opt("Unclear", "Không rõ"),
    ],
  },
  {
    name: "Motive of Crime",
    nameVi: "Động cơ gây án",
    type: "evidence_brown",
    options: [
      opt("Hatred", "Thù hận"),
      opt("Power", "Quyền lực"),
      opt("Money", "Tiền bạc"),
      opt("Love", "Tình ái"),
      opt("Jealousy", "Ghen tuông"),
      opt("Justice", "Công lý"),
    ],
  },
  {
    name: "Trace at the Scene",
    nameVi: "Dấu vết tại hiện trường",
    type: "evidence_brown",
    options: [
      opt("Fingerprint", "Dấu vân tay"),
      opt("Footprint", "Dấu chân"),
      opt("Bruise", "Vết bầm tím"),
      opt("Blood Stain", "Vết máu"),
      opt("Body Fluid", "Chất dịch"),
      opt("Scar", "Vết sẹo"),
    ],
  },
  {
    name: "Evidence Left Behind",
    nameVi: "Chứng cứ để lại",
    type: "evidence_brown",
    options: [
      opt("Natural", "Tự nhiên"),
      opt("Synthetic", "Nhân tạo"),
      opt("Personal", "Đồ cá nhân"),
      opt("General", "Đồ phổ thông"),
      opt("Liquid", "Chất lỏng"),
      opt("Solid", "Chất rắn"),
    ],
  },
  {
    name: "Scene of Crime",
    nameVi: "Vị trí chính xác",
    type: "evidence_brown",
    options: [
      opt("Door/Window", "Cửa ra vào/Cửa sổ"),
      opt("Wall", "Bức tường"),
      opt("Floor", "Sàn nhà"),
      opt("Bed/Chair", "Giường/Ghế"),
      opt("Table/Desk", "Bàn"),
      opt("Ceiling", "Trần nhà"),
    ],
  },
  {
    name: "Victim's Clothes",
    nameVi: "Trang phục nạn nhân",
    type: "evidence_brown",
    options: [
      opt("Neat", "Gọn gàng"),
      opt("Untidy", "Xộc xệch"),
      opt("Elegant", "Sang trọng"),
      opt("Shabby", "Tồi tàn"),
      opt("Bizarre", "Kỳ quái"),
      opt("Naked", "Khỏa thân"),
    ],
  },
  {
    name: "Weather",
    nameVi: "Thời tiết",
    type: "evidence_brown",
    options: [
      opt("Sunny", "Nắng"),
      opt("Stormy", "Bão"),
      opt("Dry", "Khô hanh"),
      opt("Humid", "Ẩm ướt"),
      opt("Cold", "Lạnh lẽo"),
      opt("Hot", "Nóng nực"),
    ],
  },
  {
    name: "Social Relationship",
    nameVi: "Mối quan hệ xã hội",
    type: "evidence_brown",
    options: [
      opt("Relatives", "Người thân"),
      opt("Friends", "Bạn bè"),
      opt("Colleagues", "Đồng nghiệp"),
      opt("Employer/Employee", "Chủ/Tớ"),
      opt("Lovers", "Người tình"),
      opt("Strangers", "Người lạ"),
    ],
  },
  {
    name: "State of Belongings",
    nameVi: "Trạng thái vật dụng",
    type: "evidence_brown",
    options: [
      opt("Smashed/Broken", "Đồ vật bị đập vỡ"),
      opt("Ransacked", "Bị lục lọi"),
      opt("Unusually Tidy", "Ngăn nắp lạ thường"),
      opt("Half-used items", "Đồ dùng dở dang"),
      opt("Partially Cleaned", "Bị dọn dẹp một phần"),
      opt("Substituted/Swapped", "Bị đánh tráo"),
    ],
  },
  {
    name: "Last Known Activity",
    nameVi: "Hoạt động cuối cùng",
    type: "evidence_brown",
    options: [
      opt("Resting/Sleeping", "Đang nghỉ ngơi/Ngủ"),
      opt("Working/Studying", "Đang làm việc/Học tập"),
      opt("Eating/Drinking", "Đang ăn uống"),
      opt("Entertaining", "Đang giải trí"),
      opt("Preparing to leave", "Sắp sửa rời đi"),
      opt("Housekeeping", "Đang dọn dẹp"),
    ],
  },
  {
    name: "Day of Crime",
    nameVi: "Ngày xảy ra vụ án",
    type: "evidence_brown",
    options: [
      opt("Weekday", "Ngày thường"),
      opt("Weekend", "Cuối tuần"),
      opt("Spring", "Mùa Xuân"),
      opt("Summer", "Mùa Hè"),
      opt("Autumn", "Mùa Thu"),
      opt("Winter", "Mùa Đông"),
    ],
  },
  {
    name: "General Impression",
    nameVi: "Ấn tượng chung",
    type: "evidence_brown",
    options: [
      opt("Common", "Bình thường"),
      opt("Bizarre", "Kỳ quái"),
      opt("Passionate", "Đầy cảm xúc"),
      opt("Cruel", "Tàn nhẫn"),
      opt("Professional", "Chuyên nghiệp"),
      opt("Messy", "Bừa bộn"),
    ],
  },
  {
    name: "Sudden Incident",
    nameVi: "Sự cố bất ngờ",
    type: "evidence_brown",
    options: [
      opt("Power Outage", "Cúp điện"),
      opt("Fire", "Hỏa hoạn"),
      opt("Conflict", "Xung đột"),
      opt("Loss of Valuables", "Mất tài sản"),
      opt("Scream", "Tiếng hét"),
      opt("Nothing", "Không có gì"),
    ],
  },
  {
    name: "Murderer's Personality",
    nameVi: "Tính cách hung thủ",
    type: "evidence_brown",
    options: [
      opt("Arrogant", "Kiêu ngạo"),
      opt("Despicable", "Đê tiện"),
      opt("Furious", "Nóng nảy"),
      opt("Greedy", "Tham lam"),
      opt("Forceful", "Bạo lực"),
      opt("Perverted", "Biến thái"),
    ],
  },
  {
    name: "State of Mind",
    nameVi: "Tâm lý nạn nhân trước khi chết",
    type: "evidence_brown",
    options: [
      opt("Calm", "Bình tĩnh"),
      opt("Flustered", "Bối rối"),
      opt("Happy", "Vui vẻ"),
      opt("Depressed", "Tuyệt vọng"),
      opt("Confused", "Lú lẫn"),
      opt("Frightened", "Sợ hãi"),
    ],
  },
  {
    name: "Status of the Crime",
    nameVi: "Tình trạng án mạng",
    type: "evidence_brown",
    options: [
      opt("Ongoing", "Đang diễn ra"),
      opt("Recently Finished", "Vừa mới xong"),
      opt("Finished Long Ago", "Xong từ lâu"),
      opt("Abandoned", "Bị bỏ dở"),
      opt("Interrupted", "Bị gián đoạn"),
      opt("Disguised", "Bị ngụy tạo"),
    ],
  },
  {
    name: "Method of Approach",
    nameVi: "Phương thức tiếp cận",
    type: "evidence_brown",
    options: [
      opt("Frontal", "Trực diện"),
      opt("Ambush", "Phục kích"),
      opt("Deception", "Lừa gạt"),
      opt("Stealth", "Lén lút"),
      opt("Blackmail", "Tống tiền"),
      opt("Invitation", "Được mời"),
    ],
  },
];

// ─── Easy Mode Evidence Tiles (24 thẻ — cụ thể, cảm quan, dễ suy luận) ───

export const EVIDENCE_TILES_EASY: Omit<SceneTile, "id" | "markerIndex">[] = [
  {
    name: "Weather",
    nameVi: "Thời tiết",
    type: "evidence_brown",
    options: [
      opt("Sunny", "Nắng"),
      opt("Rainy", "Mưa"),
      opt("Snowy", "Tuyết"),
      opt("Stormy", "Bão"),
      opt("Overcast", "U ám"),
      opt("Foggy", "Sương mù"),
    ],
  },
  {
    name: "Last Known Activity",
    nameVi: "Hoạt động cuối cùng",
    type: "evidence_brown",
    options: [
      opt("Sleeping", "Đang ngủ"),
      opt("Working", "Đang làm việc"),
      opt("Eating", "Đang ăn"),
      opt("Playing", "Đang vui chơi"),
      opt("Cleaning", "Đang dọn dẹp"),
      opt("Bathing", "Đang tắm"),
    ],
  },
  {
    name: "Victim's Clothes",
    nameVi: "Trang phục nạn nhân",
    type: "evidence_brown",
    options: [
      opt("Designer Wear", "Đồ hiệu"),
      opt("Ragged", "Rách rưới"),
      opt("Pajamas", "Đồ ngủ"),
      opt("Uniform", "Đồng phục"),
      opt("Swimwear", "Đồ bơi"),
      opt("Casual", "Bình thường"),
    ],
  },
  {
    name: "Victim's Expression",
    nameVi: "Biểu cảm nạn nhân",
    type: "evidence_brown",
    options: [
      opt("Terrified", "Sợ hãi"),
      opt("Calm", "Bình thản"),
      opt("Surprised", "Ngạc nhiên"),
      opt("In Pain", "Đau đớn"),
      opt("Angry", "Tức giận"),
      opt("Smiling", "Cười"),
    ],
  },
  {
    name: "State of the Body",
    nameVi: "Tình trạng tử thi",
    type: "evidence_brown",
    options: [
      opt("Intact", "Nguyên vẹn"),
      opt("Dismembered", "Bị chặt nhỏ"),
      opt("Stiffened", "Cứng đờ"),
      opt("Decomposed", "Thối rữa"),
      opt("Desiccated", "Khô héo"),
      opt("Still Warm", "Còn ấm"),
    ],
  },
  {
    name: "Sudden Note",
    nameVi: "Vật để lại hiện trường",
    type: "evidence_brown",
    options: [
      opt("Written in Blood", "Viết bằng máu"),
      opt("Diary", "Nhật ký"),
      opt("Suicide Note", "Thư tuyệt mệnh"),
      opt("Drawing", "Bản vẽ"),
      opt("Symbol", "Ký hiệu"),
      opt("Anonymous Letter", "Thư nặc danh"),
    ],
  },
  {
    name: "Time of Death",
    nameVi: "Thời gian tử vong",
    type: "evidence_brown",
    options: [
      opt("Dawn", "Rạng sáng"),
      opt("Morning", "Buổi sáng"),
      opt("Noon", "Trưa"),
      opt("Afternoon", "Chiều"),
      opt("Evening", "Tối"),
      opt("Midnight", "Đêm khuya"),
    ],
  },
  {
    name: "Duration of Crime",
    nameVi: "Độ dài gây án",
    type: "evidence_brown",
    options: [
      opt("Instantaneous", "Rất nhanh"),
      opt("A Few Minutes", "Vài phút"),
      opt("A Few Hours", "Vài giờ"),
      opt("The Whole Day", "Cả ngày"),
      opt("Extended Period", "Kéo dài lâu"),
      opt("Unclear", "Không rõ"),
    ],
  },
  {
    name: "General Impression",
    nameVi: "Ấn tượng chung",
    type: "evidence_brown",
    options: [
      opt("Chaotic", "Hỗn loạn"),
      opt("Tidy", "Gọn gàng"),
      opt("Bizarre", "Kỳ quái"),
      opt("Normal", "Bình thường"),
      opt("Brutal", "Tàn khốc"),
      opt("Artistic", "Nghệ thuật"),
    ],
  },
  {
    name: "Trace at the Scene",
    nameVi: "Dấu vết hiện trường",
    type: "evidence_brown",
    options: [
      opt("Footprint", "Dấu chân"),
      opt("Fingerprint", "Vân tay"),
      opt("Blood Stain", "Vết máu"),
      opt("Hair / Fur", "Lông tóc"),
      opt("Fabric Fiber", "Sợi vải"),
      opt("Ash / Dust", "Tro bụi"),
    ],
  },
  {
    name: "Evidence Left Behind",
    nameVi: "Bằng chứng để lại",
    type: "evidence_brown",
    options: [
      opt("Personal Belonging", "Đồ cá nhân"),
      opt("Fake Weapon", "Hung khí giả"),
      opt("Letter / Note", "Thư từ"),
      opt("Jewelry", "Trang sức"),
      opt("Cash", "Tiền mặt"),
      opt("Nothing", "Không có gì"),
    ],
  },
  {
    name: "Hint on the Victim",
    nameVi: "Gợi ý trên nạn nhân",
    type: "evidence_brown",
    options: [
      opt("Tattoo", "Hình xăm"),
      opt("Scar", "Vết sẹo"),
      opt("Makeup", "Trang điểm"),
      opt("Fingernail", "Móng tay"),
      opt("Jewelry", "Đồ trang sức"),
      opt("Bruise", "Vết bầm"),
    ],
  },
  {
    name: "Social Relationship",
    nameVi: "Mối quan hệ xã hội",
    type: "evidence_brown",
    options: [
      opt("Family", "Gia đình"),
      opt("Friend", "Bạn bè"),
      opt("Enemy", "Kẻ thù"),
      opt("Colleague", "Đồng nghiệp"),
      opt("Stranger", "Người lạ"),
      opt("Lover", "Người yêu"),
    ],
  },
  {
    name: "Occupation of Victim",
    nameVi: "Nghề nghiệp nạn nhân",
    type: "evidence_brown",
    options: [
      opt("Intellectual", "Trí thức"),
      opt("Manual Laborer", "Lao động tay chân"),
      opt("Artist", "Nghệ sĩ"),
      opt("Student", "Học sinh"),
      opt("Homeless", "Vô gia cư"),
      opt("Unknown", "Không rõ"),
    ],
  },
  {
    name: "Personality of Victim",
    nameVi: "Tính cách nạn nhân",
    type: "evidence_brown",
    options: [
      opt("Kind", "Hiền lành"),
      opt("Aggressive", "Hung dữ"),
      opt("Arrogant", "Kiêu ngạo"),
      opt("Timid", "Nhút nhát"),
      opt("Cautious", "Cẩn thận"),
      opt("Cheerful", "Vui vẻ"),
    ],
  },
  {
    name: "Day of Crime",
    nameVi: "Ngày gây án",
    type: "evidence_brown",
    options: [
      opt("Holiday", "Ngày lễ"),
      opt("Weekend", "Cuối tuần"),
      opt("Weekday", "Ngày thường"),
      opt("Anniversary", "Kỷ niệm"),
      opt("Day Off", "Ngày nghỉ"),
      opt("Unknown", "Không rõ"),
    ],
  },
  {
    name: "Noticed by Bystander",
    nameVi: "Người chứng kiến chú ý",
    type: "evidence_brown",
    options: [
      opt("Loud Noise", "Tiếng động lớn"),
      opt("Flash of Light", "Ánh sáng"),
      opt("Strange Odor", "Mùi hôi"),
      opt("Strange Behavior", "Hành động lạ"),
      opt("Smoke", "Khói"),
      opt("Nothing", "Không có gì"),
    ],
  },
  {
    name: "Scene of the Crime",
    nameVi: "Không gian hiện trường",
    type: "evidence_brown",
    options: [
      opt("Enclosed Room", "Phòng kín"),
      opt("Open Space", "Không gian mở"),
      opt("Public Place", "Nơi công cộng"),
      opt("Remote Location", "Nơi hẻo lánh"),
      opt("Rooftop", "Mái nhà"),
      opt("Underground", "Dưới lòng đất"),
    ],
  },
  {
    name: "Severity of Injuries",
    nameVi: "Mức độ thương tích",
    type: "evidence_brown",
    options: [
      opt("Minor", "Nhẹ"),
      opt("Severe", "Nặng"),
      opt("Head Trauma", "Chấn thương đầu"),
      opt("Stab Wound", "Vết đâm"),
      opt("Burns", "Bị bỏng"),
      opt("No External Injury", "Không vết ngoài"),
    ],
  },
  {
    name: "Lighting at the Scene",
    nameVi: "Ánh sáng hiện trường",
    type: "evidence_brown",
    options: [
      opt("Brightly Lit", "Sáng rực"),
      opt("Pitch Dark", "Tối om"),
      opt("Colored Lights", "Ánh đèn màu"),
      opt("Dim", "Mờ ảo"),
      opt("Sunlight", "Ánh nắng"),
      opt("Flickering", "Nhấp nháy"),
    ],
  },
  {
    name: "Sound at the Scene",
    nameVi: "Âm thanh hiện trường",
    type: "evidence_brown",
    options: [
      opt("Silence", "Yên tĩnh"),
      opt("Noisy", "Ồn ào"),
      opt("Music", "Tiếng nhạc"),
      opt("Screaming", "Tiếng hét"),
      opt("Machinery", "Tiếng máy móc"),
      opt("TV / Radio", "TV / Radio"),
    ],
  },
  {
    name: "Odor at the Scene",
    nameVi: "Mùi hương hiện trường",
    type: "evidence_brown",
    options: [
      opt("Foul Smell", "Mùi hôi"),
      opt("Perfume", "Nước hoa"),
      opt("Burnt Smell", "Mùi khét"),
      opt("Chemicals", "Hóa chất"),
      opt("Food", "Mùi thức ăn"),
      opt("No Odor", "Không mùi"),
    ],
  },
  {
    name: "Victim's Identity",
    nameVi: "Thân phận nạn nhân",
    type: "evidence_brown",
    options: [
      opt("Celebrity", "Người nổi tiếng"),
      opt("Criminal", "Kẻ tội phạm"),
      opt("Tourist", "Khách du lịch"),
      opt("Local Resident", "Người địa phương"),
      opt("Foreigner", "Người nước ngoài"),
      opt("Unknown", "Không rõ"),
    ],
  },
  {
    name: "Motive of Crime",
    nameVi: "Động cơ gây án",
    type: "evidence_brown",
    options: [
      opt("Revenge", "Trả thù"),
      opt("Money", "Tiền bạc"),
      opt("Love", "Tình ái"),
      opt("Jealousy", "Ghen tuông"),
      opt("Accident", "Tai nạn"),
      opt("Politics", "Chính trị"),
    ],
  },
];


// ─── Utility: shuffle array in place (Fisher-Yates) ───

export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Utility: group-diverse sampling ───
// Returns `count` items such that no two consecutive (or same-round) items
// share the same group. Interleaves shuffled per-group buckets.
// Falls back to plain shuffle if groups are insufficient.
export function sampleGroupDiverse<T extends { group?: string }>(
  pool: T[],
  count: number,
): T[] {
  if (count <= 0) return [];

  // Build per-group buckets, each independently shuffled
  const buckets = new Map<string, T[]>();
  for (const item of pool) {
    const g = item.group ?? "__ungrouped__";
    if (!buckets.has(g)) buckets.set(g, []);
    buckets.get(g)!.push(item);
  }
  for (const bucket of buckets.values()) shuffle(bucket);

  // Interleave: round-robin across groups until we have `count` items
  const result: T[] = [];
  const groupKeys = shuffle([...buckets.keys()]);
  let round = 0;

  while (result.length < count) {
    let addedThisRound = false;
    for (const key of groupKeys) {
      const bucket = buckets.get(key)!;
      if (bucket.length > round) {
        result.push(bucket[round]);
        if (result.length === count) break;
        addedThisRound = true;
      }
    }
    // If no group contributed this round, all buckets exhausted — stop
    if (!addedThisRound) break;
    round++;
  }

  // Fallback: if we couldn't reach `count` (not enough unique groups),
  // fill remaining slots from whatever is left
  if (result.length < count) {
    const used = new Set(result);
    const remaining = pool.filter((x) => !used.has(x));
    shuffle(remaining);
    result.push(...remaining.slice(0, count - result.length));
  }

  return result;
}

// ─── Generate scene tiles for a new round ───

let tileIdCounter = 0;

function toSceneTile(
  template: Omit<SceneTile, "id" | "markerIndex">,
): SceneTile {
  return {
    ...template,
    id: `tile-${++tileIdCounter}-${Date.now()}`,
    markerIndex: null,
  };
}

export function generateSceneTiles(difficulty: "easy" | "hard" = "hard"): {
  active: SceneTile[];
  pool: SceneTile[];
} {
  const evidencePool = difficulty === "easy" ? EVIDENCE_TILES_EASY : EVIDENCE_TILES;

  const causeOfDeath = toSceneTile(CAUSE_OF_DEATH_TILE);
  const locationTile = toSceneTile(
    LOCATION_TILES[Math.floor(Math.random() * LOCATION_TILES.length)],
  );

  const shuffledEvidence = shuffle([...evidencePool]);
  const pickedEvidence = shuffledEvidence.slice(0, 4).map(toSceneTile);
  const poolEvidence = shuffledEvidence.slice(4).map(toSceneTile);

  return {
    active: [causeOfDeath, locationTile, ...pickedEvidence],
    pool: poolEvidence,
  };
}
