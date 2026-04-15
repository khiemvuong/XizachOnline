import type { MeansCard, ClueCard, SceneTile, SceneTileOption } from "./DeceptionTypes";

// ─── Means Cards (90 cards from base game) ───

export const MEANS_CARDS: MeansCard[] = [
  { id: 1, english: "Axe", vietnamese: "Rìu", description: "Chặt hoặc đập bằng rìu nặng" },
  { id: 2, english: "Bamboo Tip", vietnamese: "Ngọn tre nhọn", description: "Dùng ngọn tre sắc đâm thủng" },
  { id: 3, english: "Box Cutter", vietnamese: "Dao rọc giấy", description: "Dao nhỏ sắc bén cắt da thịt" },
  { id: 4, english: "Cleaver", vietnamese: "Dao chặt thịt", description: "Dao to chặt xương/thịt" },
  { id: 5, english: "Dagger", vietnamese: "Dao găm", description: "Dao ngắn đâm chí mạng" },
  { id: 6, english: "Hook", vietnamese: "Móc sắt", description: "Móc và xé rách da thịt" },
  { id: 7, english: "Knife And Fork", vietnamese: "Dao và nĩa", description: "Đâm bằng bộ dao nĩa" },
  { id: 8, english: "Machete", vietnamese: "Dao rựa", description: "Chém bằng dao rựa lớn" },
  { id: 9, english: "Razor Blade", vietnamese: "Lưỡi dao cạo", description: "Cắt cổ họng hoặc mạch máu" },
  { id: 10, english: "Scissors", vietnamese: "Kéo", description: "Đâm hoặc cắt bằng kéo" },
  { id: 11, english: "Throat Slit", vietnamese: "Cắt cổ", description: "Cắt đứt động mạch cổ" },
  { id: 12, english: "Bat", vietnamese: "Gậy bóng chày", description: "Đánh bằng gậy gây chấn thương sọ" },
  { id: 13, english: "Brick", vietnamese: "Gạch", description: "Ném hoặc đập bằng gạch" },
  { id: 14, english: "Candlestick", vietnamese: "Chân nến", description: "Đập bằng chân nến kim loại" },
  { id: 15, english: "Crutch", vietnamese: "Nạng", description: "Đánh bằng nạng kim loại/gỗ" },
  { id: 16, english: "Dumbbell", vietnamese: "Tạ tay", description: "Đập bằng quả tạ nặng" },
  { id: 17, english: "Folding Chair", vietnamese: "Ghế gấp", description: "Đập bằng ghế gấp" },
  { id: 18, english: "Hammer", vietnamese: "Búa", description: "Đập đầu bằng búa" },
  { id: 19, english: "Ice Skates", vietnamese: "Giày trượt băng", description: "Cắt bằng lưỡi giày sắc" },
  { id: 20, english: "Kick", vietnamese: "Đá", description: "Đá mạnh gây nội thương" },
  { id: 21, english: "Punch", vietnamese: "Đấm", description: "Đấm tay không chí mạng" },
  { id: 22, english: "Sculpture", vietnamese: "Tượng", description: "Đập bằng tượng nặng" },
  { id: 23, english: "Steel Tube", vietnamese: "Ống thép", description: "Đánh bằng ống thép" },
  { id: 24, english: "Stone", vietnamese: "Đá", description: "Ném đá hoặc đập đá" },
  { id: 25, english: "Trophy", vietnamese: "Cúp", description: "Đập bằng cúp kim loại" },
  { id: 26, english: "Wrench", vietnamese: "Cờ lê", description: "Đập bằng cờ lê lớn" },
  { id: 27, english: "Alcohol", vietnamese: "Rượu / Chất cồn", description: "Ngộ độc bằng rượu pha độc" },
  { id: 28, english: "Amoeba", vietnamese: "Amip", description: "Nhiễm ký sinh trùng amip" },
  { id: 29, english: "Arsenic", vietnamese: "Thạch tín", description: "Chất độc cổ điển" },
  { id: 30, english: "Chemicals", vietnamese: "Hóa chất", description: "Hóa chất ăn mòn da/thận" },
  { id: 31, english: "Dirty Water", vietnamese: "Nước bẩn", description: "Ngộ độc nước nhiễm khuẩn" },
  { id: 32, english: "Illegal Drug", vietnamese: "Ma túy", description: "Quá liều ma túy" },
  { id: 33, english: "Injection", vietnamese: "Tiêm chích", description: "Tiêm độc trực tiếp" },
  { id: 34, english: "Liquid Drug", vietnamese: "Thuốc lỏng", description: "Uống hoặc tiêm thuốc độc" },
  { id: 35, english: "Mercury", vietnamese: "Thủy ngân", description: "Ngộ độc thủy ngân" },
  { id: 36, english: "Pesticide", vietnamese: "Thuốc trừ sâu", description: "Uống thuốc trừ sâu" },
  { id: 37, english: "Pill", vietnamese: "Viên thuốc", description: "Nuốt viên thuốc độc" },
  { id: 38, english: "Plague", vietnamese: "Dịch hạch", description: "Lây bệnh dịch" },
  { id: 39, english: "Poisonous Gas", vietnamese: "Khí độc", description: "Hít phải khí độc" },
  { id: 40, english: "Poisonous Needle", vietnamese: "Kim độc", description: "Đâm kim tẩm độc" },
  { id: 41, english: "Powder Drug", vietnamese: "Bột thuốc", description: "Hít hoặc nuốt bột độc" },
  { id: 42, english: "Sulfuric Acid", vietnamese: "Axit sulfuric", description: "Đổ axit ăn mòn" },
  { id: 43, english: "Venomous Scorpion", vietnamese: "Bọ cạp độc", description: "Cắn bởi bọ cạp" },
  { id: 44, english: "Venomous Snake", vietnamese: "Rắn độc", description: "Cắn bởi rắn độc" },
  { id: 45, english: "Virus", vietnamese: "Virus", description: "Nhiễm virus chí mạng" },
  { id: 46, english: "Belt", vietnamese: "Thắt lưng", description: "Siết cổ bằng thắt lưng" },
  { id: 47, english: "Bury", vietnamese: "Chôn sống", description: "Chôn nạn nhân còn sống" },
  { id: 48, english: "Drown", vietnamese: "Đuối nước", description: "Nhúng đầu vào nước" },
  { id: 49, english: "Pillow", vietnamese: "Gối", description: "Bịt miệng bằng gối" },
  { id: 50, english: "Plastic Bag", vietnamese: "Túi ni lông", description: "Bịt đầu bằng túi" },
  { id: 51, english: "Rope", vietnamese: "Dây thừng", description: "Thắt cổ bằng dây" },
  { id: 52, english: "Scarf", vietnamese: "Khăn quàng", description: "Siết cổ bằng khăn" },
  { id: 53, english: "Towel", vietnamese: "Khăn tắm", description: "Bịt miệng/mũi" },
  { id: 54, english: "Packing Tape", vietnamese: "Băng keo", description: "Băng kín miệng/mũi" },
  { id: 55, english: "Electric Baton", vietnamese: "Roi điện", description: "Roi gây giật điện" },
  { id: 56, english: "Electric Current", vietnamese: "Dòng điện", description: "Giật điện trực tiếp" },
  { id: 57, english: "E-Bike", vietnamese: "Xe đạp điện", description: "Đâm bằng xe điện" },
  { id: 58, english: "Video Game Console", vietnamese: "Máy chơi game", description: "Dùng thiết bị điện giết" },
  { id: 59, english: "Machine", vietnamese: "Máy móc", description: "Bị máy nghiền" },
  { id: 60, english: "Arson", vietnamese: "Đốt phá", description: "Đốt lửa thiêu sống" },
  { id: 61, english: "Explosives", vietnamese: "Chất nổ", description: "Bom hoặc chất nổ" },
  { id: 62, english: "Gunpowder", vietnamese: "Thuốc súng", description: "Nổ bằng thuốc súng" },
  { id: 63, english: "Kerosene", vietnamese: "Dầu hỏa", description: "Đốt bằng dầu hỏa" },
  { id: 64, english: "Lighter", vietnamese: "Bật lửa", description: "Đốt bằng bật lửa" },
  { id: 65, english: "Match", vietnamese: "Que diêm", description: "Châm lửa" },
  { id: 66, english: "Smoke", vietnamese: "Khói", description: "Ngạt khói" },
  { id: 67, english: "Bite And Tear", vietnamese: "Cắn xé", description: "Cắn và xé thịt" },
  { id: 68, english: "Blender", vietnamese: "Máy xay sinh tố", description: "Xay nạn nhân" },
  { id: 69, english: "Blood Release", vietnamese: "Thả máu", description: "Làm chảy máu đến chết" },
  { id: 70, english: "Chainsaw", vietnamese: "Cưa xích", description: "Cưa điện cắt rời" },
  { id: 71, english: "Dismember", vietnamese: "Phân thây", description: "Cắt rời cơ thể" },
  { id: 72, english: "Drill", vietnamese: "Khoan điện", description: "Khoan thủng đầu" },
  { id: 73, english: "Locked Room", vietnamese: "Phòng khóa", description: "Giết trong phòng bí mật" },
  { id: 74, english: "Mad Dog", vietnamese: "Chó dại", description: "Bị chó dại cắn" },
  { id: 75, english: "Metal Chain", vietnamese: "Xích sắt", description: "Đánh hoặc siết bằng xích" },
  { id: 76, english: "Metal Wire", vietnamese: "Dây thép", description: "Siết hoặc cắt bằng dây thép" },
  { id: 77, english: "Overdose", vietnamese: "Quá liều", description: "Quá liều thuốc" },
  { id: 78, english: "Potted Plant", vietnamese: "Chậu cây", description: "Đập bằng chậu cây" },
  { id: 79, english: "Push", vietnamese: "Đẩy", description: "Đẩy từ trên cao" },
  { id: 80, english: "Radiation", vietnamese: "Bức xạ", description: "Tiếp xúc phóng xạ" },
  { id: 81, english: "Sniper", vietnamese: "Súng bắn tỉa", description: "Bắn tỉa từ xa" },
  { id: 82, english: "Starvation", vietnamese: "Nhịn đói", description: "Để nạn nhân chết đói" },
  { id: 83, english: "Surgery", vietnamese: "Phẫu thuật", description: "Phẫu thuật sai" },
  { id: 84, english: "Unarmed", vietnamese: "Tay không", description: "Giết bằng tay không" },
  { id: 85, english: "Whip", vietnamese: "Roi da", description: "Đánh bằng roi" },
  { id: 86, english: "Wine", vietnamese: "Rượu vang", description: "Rượu vang pha độc" },
  { id: 87, english: "Wire", vietnamese: "Dây điện", description: "Siết hoặc giật bằng dây" },
  { id: 88, english: "Work", vietnamese: "Công việc (mệt mỏi)", description: "Làm việc kiệt sức" },
  { id: 89, english: "Pistol", vietnamese: "Súng ngắn", description: "Bắn bằng súng ngắn" },
  { id: 90, english: "Trowel", vietnamese: "Xẻng nhỏ", description: "Đập hoặc đâm bằng xẻng" },
];

// ─── Clue Cards (70 cards from base game) ───

export const CLUE_CARDS: ClueCard[] = [
  { id: 1, english: "Earrings", vietnamese: "Hoa tai", description: "Hoa tai rơi hoặc bị kéo đứt" },
  { id: 2, english: "High Heel", vietnamese: "Giày cao gót", description: "Giày cao gót bị gãy hoặc in dấu" },
  { id: 3, english: "Lace", vietnamese: "Ren / Dây buộc", description: "Dây ren hoặc dây buộc quần áo" },
  { id: 4, english: "Necklace", vietnamese: "Dây chuyền", description: "Dây chuyền bị đứt tại hiện trường" },
  { id: 5, english: "Scarf", vietnamese: "Khăn quàng", description: "Khăn quàng rách hoặc dùng siết" },
  { id: 6, english: "Shoe Print", vietnamese: "Dấu giày", description: "Dấu chân giày rõ ràng" },
  { id: 7, english: "Sunglasses", vietnamese: "Kính râm", description: "Kính râm vỡ hoặc rơi" },
  { id: 8, english: "Toupee", vietnamese: "Tóc giả", description: "Tóc giả rụng hoặc bị kéo" },
  { id: 9, english: "Wallet", vietnamese: "Ví tiền", description: "Ví tiền rơi, chứa giấy tờ" },
  { id: 10, english: "Button", vietnamese: "Cúc áo", description: "Cúc áo bị rách rơi" },
  { id: 11, english: "Zipper", vietnamese: "Khóa kéo", description: "Khóa kéo quần áo bị hỏng" },
  { id: 12, english: "Glove", vietnamese: "Găng tay", description: "Găng tay da hoặc vải" },
  { id: 13, english: "Briefcase", vietnamese: "Cặp tài liệu", description: "Cặp da đựng giấy tờ quan trọng" },
  { id: 14, english: "For Sale Sign", vietnamese: "Bảng bán nhà", description: "Bảng bán hoặc cho thuê" },
  { id: 15, english: "Greetings Card", vietnamese: "Thiệp chúc mừng", description: "Thiệp có chữ viết tay" },
  { id: 16, english: "Shredded Paper", vietnamese: "Giấy vụn", description: "Giấy tài liệu bị xé nhỏ" },
  { id: 17, english: "Ticket", vietnamese: "Vé", description: "Vé tàu, xe, máy bay hoặc sự kiện" },
  { id: 18, english: "Business Card", vietnamese: "Danh thiếp", description: "Danh thiếp cá nhân" },
  { id: 19, english: "Receipt", vietnamese: "Hóa đơn", description: "Hóa đơn mua hàng" },
  { id: 20, english: "Diary", vietnamese: "Nhật ký", description: "Sổ tay ghi chép cá nhân" },
  { id: 21, english: "Letter", vietnamese: "Thư", description: "Thư tay hoặc in" },
  { id: 22, english: "Cigarette Butt", vietnamese: "Mẩu thuốc lá", description: "Mẩu thuốc lá hút dở" },
  { id: 23, english: "Hair Strand", vietnamese: "Sợi tóc", description: "Sợi tóc rụng" },
  { id: 24, english: "Partial Print", vietnamese: "Dấu vân tay một phần", description: "Dấu vân tay không đầy đủ" },
  { id: 25, english: "Blood Stain", vietnamese: "Vết máu", description: "Vết máu nhỏ giọt" },
  { id: 26, english: "Fingernail", vietnamese: "Móng tay", description: "Móng tay gãy hoặc vết xước" },
  { id: 27, english: "Lipstick Mark", vietnamese: "Dấu son môi", description: "Dấu son trên ly hoặc khăn" },
  { id: 28, english: "Fingerprint", vietnamese: "Dấu vân tay", description: "Dấu vân tay rõ" },
  { id: 29, english: "Blister Pack", vietnamese: "Vỉ thuốc", description: "Vỉ thuốc (có thể chứa độc)" },
  { id: 30, english: "Coaster", vietnamese: "Đế lót ly", description: "Đế lót cốc uống nước" },
  { id: 31, english: "Picture Frame", vietnamese: "Khung ảnh", description: "Khung ảnh vỡ hoặc có vết" },
  { id: 32, english: "Pipe", vietnamese: "Ống nước / Ống dẫn", description: "Ống kim loại hoặc nhựa" },
  { id: 33, english: "Table Lamp", vietnamese: "Đèn bàn", description: "Đèn bàn vỡ hoặc nặng" },
  { id: 34, english: "Umbrella", vietnamese: "Ô", description: "Ô gãy hoặc dùng làm vũ khí" },
  { id: 35, english: "Key", vietnamese: "Chìa khóa", description: "Chìa khóa nhà hoặc xe" },
  { id: 36, english: "Remote Control", vietnamese: "Điều khiển từ xa", description: "Remote TV hoặc máy lạnh" },
  { id: 37, english: "Candle", vietnamese: "Nến", description: "Nến cháy dở hoặc sáp" },
  { id: 38, english: "Wine Glass", vietnamese: "Ly rượu vang", description: "Ly rượu có dấu son hoặc vết" },
  { id: 39, english: "Compass", vietnamese: "La bàn", description: "La bàn định hướng" },
  { id: 40, english: "Detonator", vietnamese: "Bộ kích nổ", description: "Thiết bị kích nổ bom" },
  { id: 41, english: "Floppy Disk", vietnamese: "Đĩa mềm", description: "Đĩa lưu trữ cũ" },
  { id: 42, english: "Memory Card", vietnamese: "Thẻ nhớ", description: "Thẻ nhớ máy ảnh hoặc camera" },
  { id: 43, english: "Phone", vietnamese: "Điện thoại", description: "Điện thoại di động rơi" },
  { id: 44, english: "Sat Nav", vietnamese: "Thiết bị GPS", description: "Máy dẫn đường vệ tinh" },
  { id: 45, english: "Stopwatch", vietnamese: "Đồng hồ bấm giờ", description: "Đồng hồ đo thời gian" },
  { id: 46, english: "USB Drive", vietnamese: "USB lưu trữ", description: "Ổ USB chứa dữ liệu" },
  { id: 47, english: "Laptop", vietnamese: "Máy tính xách tay", description: "Laptop hoặc máy tính" },
  { id: 48, english: "Headphone", vietnamese: "Tai nghe", description: "Tai nghe rơi" },
  { id: 49, english: "Garbage", vietnamese: "Rác thải", description: "Túi rác hoặc rác tại hiện trường" },
  { id: 50, english: "Pig", vietnamese: "Heo (đồ chơi hoặc mô hình)", description: "Đồ chơi heo hoặc dấu vết lạ" },
  { id: 51, english: "Sea Shell", vietnamese: "Vỏ sò biển", description: "Vỏ sò hoặc vỏ ốc" },
  { id: 52, english: "Tricycle", vietnamese: "Xe đạp ba bánh", description: "Xe đạp trẻ em" },
  { id: 53, english: "Twine", vietnamese: "Dây xe chỉ", description: "Dây buộc nhỏ" },
  { id: 54, english: "Tyre Tracks", vietnamese: "Dấu lốp xe", description: "Dấu bánh xe ô tô" },
  { id: 55, english: "Broken Vase", vietnamese: "Bình hoa vỡ", description: "Mảnh bình hoa sứ vỡ" },
  { id: 56, english: "Claw Hammer", vietnamese: "Búa chim", description: "Búa chim (có thể là vũ khí)" },
  { id: 57, english: "Trowel", vietnamese: "Xẻng nhỏ", description: "Xẻng làm vườn nhỏ" },
  { id: 58, english: "Outsized Novelty Clown Nose", vietnamese: "Mũi hề khổng lồ", description: "Mũi hề nhựa lớn (rất lạ)" },
  { id: 59, english: "Book", vietnamese: "Sách", description: "Sách hoặc trang sách" },
  { id: 60, english: "Newspaper", vietnamese: "Báo", description: "Báo cũ có tin tức" },
  { id: 61, english: "Map", vietnamese: "Bản đồ", description: "Bản đồ khu vực" },
  { id: 62, english: "Photo", vietnamese: "Ảnh", description: "Ảnh chụp cá nhân" },
  { id: 63, english: "Credit Card", vietnamese: "Thẻ tín dụng", description: "Thẻ tín dụng rơi" },
  { id: 64, english: "Ring", vietnamese: "Nhẫn", description: "Nhẫn kim cương hoặc cưới" },
  { id: 65, english: "Bracelet", vietnamese: "Vòng tay", description: "Vòng tay bị đứt" },
  { id: 66, english: "Hat", vietnamese: "Mũ", description: "Mũ rơi" },
  { id: 67, english: "Backpack", vietnamese: "Ba lô", description: "Ba lô chứa đồ" },
  { id: 68, english: "Suitcase", vietnamese: "Va li", description: "Va li du lịch" },
  { id: 69, english: "Fishing Rod", vietnamese: "Cần câu cá", description: "Cần câu" },
  { id: 70, english: "Golf Club", vietnamese: "Gậy golf", description: "Gậy golf" },
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
    name: "Time of Death", nameVi: "Thời gian tử vong", type: "evidence_brown",
    options: [opt("Dawn", "Bình minh"), opt("Morning", "Buổi sáng"), opt("Noon", "Buổi trưa"), opt("Afternoon", "Buổi chiều"), opt("Evening", "Buổi tối"), opt("Midnight", "Nửa đêm")],
  },
  {
    name: "Corpse Condition", nameVi: "Tình trạng thi thể", type: "evidence_brown",
    options: [opt("Still Warm", "Còn hơi ấm"), opt("Stiff", "Tê cứng"), opt("Decayed", "Phân hủy"), opt("Incomplete", "Không nguyên vẹn"), opt("Intact", "Nguyên vẹn"), opt("Twisted", "Bị vặn xoắn")],
  },
  {
    name: "Victim's Expression", nameVi: "Cảm xúc nạn nhân", type: "evidence_brown",
    options: [opt("Peaceful", "Thanh thản"), opt("Struggling", "Vật vã"), opt("Frightened", "Sợ hãi"), opt("In Pain", "Đau đớn"), opt("Blank", "Vô hồn"), opt("Angry", "Tức giận")],
  },
  {
    name: "Hint on Corpse", nameVi: "Dấu vết trên thi thể", type: "evidence_brown",
    options: [opt("Head", "Phần Đầu"), opt("Chest", "Phần Ngực"), opt("Belly", "Phần Bụng"), opt("Arm/Leg", "Tay/Chân"), opt("Partial", "Một phần"), opt("All Over", "Toàn thân")],
  },
  {
    name: "Duration of Crime", nameVi: "Thời gian gây án", type: "evidence_brown",
    options: [opt("Instantaneous", "Tức thì"), opt("Brief", "Chóng vánh"), opt("Gradual", "Kéo dài"), opt("Prolonged", "Từ từ"), opt("Few Days", "Vài ngày"), opt("Unclear", "Không rõ")],
  },
  {
    name: "Motive of Crime", nameVi: "Động cơ gây án", type: "evidence_brown",
    options: [opt("Hatred", "Thù hận"), opt("Power", "Quyền lực"), opt("Money", "Tiền bạc"), opt("Love", "Tình ái"), opt("Jealousy", "Ghen tuông"), opt("Justice", "Công lý")],
  },
  {
    name: "Trace at the Scene", nameVi: "Dấu vết tại hiện trường", type: "evidence_brown",
    options: [opt("Fingerprint", "Dấu vân tay"), opt("Footprint", "Dấu chân"), opt("Bruise", "Vết bầm tím"), opt("Blood Stain", "Vết máu"), opt("Body Fluid", "Chất dịch"), opt("Scar", "Vết sẹo")],
  },
  {
    name: "Evidence Left Behind", nameVi: "Chứng cứ để lại", type: "evidence_brown",
    options: [opt("Natural", "Tự nhiên"), opt("Synthetic", "Nhân tạo"), opt("Personal", "Đồ cá nhân"), opt("General", "Đồ phổ thông"), opt("Liquid", "Chất lỏng"), opt("Solid", "Chất rắn")],
  },
  {
    name: "Scene of Crime", nameVi: "Vị trí chính xác", type: "evidence_brown",
    options: [opt("Door/Window", "Cửa ra vào/Cửa sổ"), opt("Wall", "Bức tường"), opt("Floor", "Sàn nhà"), opt("Bed/Chair", "Giường/Ghế"), opt("Table/Desk", "Bàn"), opt("Ceiling", "Trần nhà")],
  },
  {
    name: "Victim's Clothes", nameVi: "Trang phục nạn nhân", type: "evidence_brown",
    options: [opt("Neat", "Gọn gàng"), opt("Untidy", "Xộc xệch"), opt("Elegant", "Sang trọng"), opt("Shabby", "Tồi tàn"), opt("Bizarre", "Kỳ quái"), opt("Naked", "Khỏa thân")],
  },
  {
    name: "Weather", nameVi: "Thời tiết", type: "evidence_brown",
    options: [opt("Sunny", "Nắng"), opt("Stormy", "Bão"), opt("Dry", "Khô hanh"), opt("Humid", "Ẩm ướt"), opt("Cold", "Lạnh lẽo"), opt("Hot", "Nóng nực")],
  },
  {
    name: "Social Relationship", nameVi: "Mối quan hệ xã hội", type: "evidence_brown",
    options: [opt("Relatives", "Người thân"), opt("Friends", "Bạn bè"), opt("Colleagues", "Đồng nghiệp"), opt("Employer/Employee", "Chủ/Tớ"), opt("Lovers", "Người tình"), opt("Strangers", "Người lạ")],
  },
  {
    name: "Victim's Build", nameVi: "Thể trạng nạn nhân", type: "evidence_brown",
    options: [opt("Large", "To lớn"), opt("Stout", "Mập mạp"), opt("Average", "Bình thường"), opt("Thin", "Gầy gò"), opt("Tall", "Cao"), opt("Short", "Thấp")],
  },
  {
    name: "Victim's Identity", nameVi: "Danh tính nạn nhân", type: "evidence_brown",
    options: [opt("Child", "Trẻ em"), opt("Young Adult", "Thanh niên"), opt("Middle-Aged", "Trung niên"), opt("Senior", "Người già"), opt("Male", "Nam"), opt("Female", "Nữ")],
  },
  {
    name: "Day of Crime", nameVi: "Ngày xảy ra vụ án", type: "evidence_brown",
    options: [opt("Weekday", "Ngày thường"), opt("Weekend", "Cuối tuần"), opt("Spring", "Mùa Xuân"), opt("Summer", "Mùa Hè"), opt("Autumn", "Mùa Thu"), opt("Winter", "Mùa Đông")],
  },
  {
    name: "General Impression", nameVi: "Ấn tượng chung", type: "evidence_brown",
    options: [opt("Common", "Bình thường"), opt("Bizarre", "Kỳ quái"), opt("Passionate", "Đầy cảm xúc"), opt("Cruel", "Tàn nhẫn"), opt("Professional", "Chuyên nghiệp"), opt("Messy", "Bừa bộn")],
  },
  {
    name: "Sudden Incident", nameVi: "Sự cố bất ngờ", type: "evidence_brown",
    options: [opt("Power Outage", "Cúp điện"), opt("Fire", "Hỏa hoạn"), opt("Conflict", "Xung đột"), opt("Loss of Valuables", "Mất tài sản"), opt("Scream", "Tiếng hét"), opt("Nothing", "Không có gì")],
  },
  {
    name: "Murderer's Personality", nameVi: "Tính cách hung thủ", type: "evidence_brown",
    options: [opt("Arrogant", "Kiêu ngạo"), opt("Despicable", "Đê tiện"), opt("Furious", "Nóng nảy"), opt("Greedy", "Tham lam"), opt("Forceful", "Bạo lực"), opt("Perverted", "Biến thái")],
  },
  {
    name: "State of Mind", nameVi: "Tâm lý nạn nhân trước khi chết", type: "evidence_brown",
    options: [opt("Calm", "Bình tĩnh"), opt("Flustered", "Bối rối"), opt("Happy", "Vui vẻ"), opt("Depressed", "Tuyệt vọng"), opt("Confused", "Lú lẫn"), opt("Frightened", "Sợ hãi")],
  },
  {
    name: "Status of the Crime", nameVi: "Tình trạng án mạng", type: "evidence_brown",
    options: [opt("Ongoing", "Đang diễn ra"), opt("Recently Finished", "Vừa mới xong"), opt("Finished Long Ago", "Xong từ lâu"), opt("Abandoned", "Bị bỏ dở"), opt("Interrupted", "Bị gián đoạn"), opt("Disguised", "Bị ngụy tạo")],
  },
  {
    name: "Method of Approach", nameVi: "Phương thức tiếp cận", type: "evidence_brown",
    options: [opt("Frontal", "Trực diện"), opt("Ambush", "Phục kích"), opt("Deception", "Lừa gạt"), opt("Stealth", "Lén lút"), opt("Blackmail", "Tống tiền"), opt("Invitation", "Được mời")],
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

// ─── Generate scene tiles for a new round ───

let tileIdCounter = 0;

function toSceneTile(template: Omit<SceneTile, "id" | "markerIndex">): SceneTile {
  return { ...template, id: `tile-${++tileIdCounter}-${Date.now()}`, markerIndex: null };
}

export function generateSceneTiles(): { active: SceneTile[]; pool: SceneTile[] } {
  const causeOfDeath = toSceneTile(CAUSE_OF_DEATH_TILE);
  const locationTile = toSceneTile(LOCATION_TILES[Math.floor(Math.random() * LOCATION_TILES.length)]);

  const shuffledEvidence = shuffle([...EVIDENCE_TILES]);
  const pickedEvidence = shuffledEvidence.slice(0, 4).map(toSceneTile);
  const poolEvidence = shuffledEvidence.slice(4).map(toSceneTile);

  return {
    active: [causeOfDeath, locationTile, ...pickedEvidence],
    pool: poolEvidence,
  };
}
