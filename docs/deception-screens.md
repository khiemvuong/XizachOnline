# Deception: Murder in Hong Kong — Screen Specifications

> Tài liệu dành cho thiết kế trên Stitch. Mỗi section mô tả 1 màn hình.
> **Chủ đề chung:** Noir Detective / Hong Kong Crime Thriller
> **Tông màu:** Nền tối (#0A0A0F → #141420), accent đỏ neon (#FF2D55), xanh neon (#00D4FF), vàng amber (#FFB800), tím evidence (#8B5CF6)
> **Font style:** Sans-serif sắc sảo, headings uppercase tracking wide
> **Orientation:** Force landscape trên mobile

---

## Screen 1: LOBBY — Trang chủ tạo/tham gia phòng

### Layout
- **Landscape mobile-first** (giống Avalon lobby nhưng theme noir)
- Chia 2 phần: Trái = Tạo phòng | Phải = Nhập mã phòng
- Divider dọc ở giữa

### Thành phần UI

| Element | Mô tả |
|---------|-------|
| **Title** | "DECEPTION" — font lớn, uppercase, tracking wide, glow effect đỏ neon |
| **Subtitle** | "Murder in Hong Kong" — font nhỏ hơn, màu xám nhạt |
| **Nút "Tạo Phòng"** | Button lớn, nền đỏ neon (#FF2D55), text trắng, rounded-xl |
| **Numpad** | Grid 3×4 nhập mã phòng 4 số, giống Avalon |
| **Code display** | 4 ô vuông hiển thị mã phòng đang nhập |
| **Nút Join** | Icon Play, active khi đủ 4 số |
| **Background** | Tối đen, texture subtle crime scene tape hoặc pattern fingerprint mờ |

### Theme/Mood
- **Cảm giác:** Bước vào sở cảnh sát Hong Kong lúc nửa đêm
- **Hiệu ứng:** Subtle neon flicker trên title, glassmorphism trên card container
- Không có ảnh nhân vật — chỉ typography + neon effects

---

## Screen 2: LOBBY ROOM — Phòng chờ trước khi chơi

### Layout
- Header: Mã phòng + nút chia sẻ
- Giữa: Danh sách người chơi (avatars + tên)
- Dưới: Settings panel + nút Start

### Thành phần UI

| Element | Mô tả |
|---------|-------|
| **Room Code** | Hiển thị lớn "PHÒNG: 1234", tap to copy |
| **Player List** | Grid 2-3 hàng avatars tròn, tên bên dưới, viền sáng khi connected |
| **Host Badge** | Icon ngôi sao vàng trên avatar host |
| **Spectator Toggle** | Nút nhỏ để chuyển spectator mode |
| **Settings Panel** | Collapsible panel (chỉ host thấy controls) |
| — Timer | Slider: 60s → 600s, mặc định 180s, hiển thị "3:00" |
| — Accomplice | Toggle on/off (auto on khi 6+ người) |
| — Witness | Toggle on/off (auto on khi 6+ người) |
| **Start Button** | Button lớn "BẮT ĐẦU ĐIỀU TRA" — chỉ host bấm được, disabled khi < 4 người |
| **Chat** | Text chat panel nhỏ ở góc phải |

### Theme/Mood
- Nền tối, cards glassmorphism với viền mỏng sáng
- Avatar mặc định: silhouette người với dấu hỏi

---

## Screen 3: ROLE REVEAL — Hiển thị vai trò

### Layout
- Fullscreen overlay, centered content
- Ảnh vai trò lớn ở giữa + tên vai trò + mô tả ngắn
- Nút "Đã sẵn sàng" ở dưới

### Thành phần UI

| Element | Mô tả |
|---------|-------|
| **Background** | Tối đen hoàn toàn, particle effects nhẹ (dust/smoke) |
| **Role Image** | Ảnh vai trò lớn (200×260px), viền phát sáng theo phe |
| **Role Name** | Viết hoa, glow effect. FS=xanh, Murderer=đỏ, Investigator=amber, Accomplice=tím, Witness=trắng |
| **Team Badge** | "PHE ĐIỀU TRA" (xanh) hoặc "PHE SÁT NHÂN" (đỏ) |
| **Description** | 1-2 dòng mô tả nhiệm vụ, text nhỏ màu xám |
| **Ready Button** | "ĐÃ SẴN SÀNG" — button viền sáng, animation pulse |
| **Ready Counter** | "3/6 sẵn sàng" — hiển thị nhỏ ở góc |

### Vai trò cụ thể

**Forensic Scientist:**
- Glow xanh cyan (#00D4FF)
- Text: "Bạn là Nhà Khoa Học Pháp Y. Hãy dẫn dắt điều tra bằng ô hiện trường."

**Murderer:**
- Glow đỏ neon (#FF2D55)
- Text: "Bạn là Kẻ Giết Người. Chọn hung khí và manh mối, rồi che giấu tội ác."

**Investigator:**
- Glow vàng amber (#FFB800)
- Text: "Bạn là Điều Tra Viên. Phân tích gợi ý và tìm ra hung thủ."

**Accomplice:**
- Glow tím (#8B5CF6)
- Text: "Bạn là Đồng Phạm. Bạn biết hung thủ và lời giải. Đánh lạc hướng!"

**Witness:**
- Glow trắng xanh (#E0F7FF)
- Text: "Bạn là Nhân Chứng. Bạn biết ai là hung thủ. Ẩn mình để sống sót!"

---

## Screen 4: NIGHT PHASE — Đêm tối

### Layout — Cho MURDERER
- Fullscreen dark overlay với text "ĐÊM XUỐNG..."
- 2 hàng thẻ của Murderer: Means (trên) + Clue (dưới)
- Murderer tap chọn 1 Means + 1 Clue
- Nút "Xác nhận lời giải" khi đã chọn đủ 2

### Layout — Cho NGƯỜI KHÁC
- Fullscreen dark overlay
- Text "Nhắm mắt lại... Đang chờ hung thủ hành động"
- Animation: mắt nhắm hoặc particles tối

### Thành phần UI (Murderer view)

| Element | Mô tả |
|---------|-------|
| **Overlay** | Nền đen 95% opacity, subtle red particles |
| **Instruction** | "CHỌN HUNG KHÍ & MANH MỐI CỦA BẠN" — text đỏ neon, uppercase |
| **Means Row** | 4 thẻ ngang, text only: tên Anh + tên Việt, viền xám. Selected = viền đỏ glow |
| **Clue Row** | 4 thẻ ngang, text only, tương tự. Selected = viền đỏ glow |
| **Confirm Button** | "XÁC NHẬN" — active khi chọn đủ 2, nền đỏ pulse |

### Thành phần UI (Witness view — nếu có)

| Element | Mô tả |
|---------|-------|
| **Info Card** | "Kẻ Giết Người là: [Tên]" + "Đồng Phạm là: [Tên]" |
| **Warning** | "GIỮ BÍ MẬT! Nếu bị phát hiện, bạn sẽ bị ám sát." text đỏ nhỏ |

### Thành phần UI (Accomplice view — nếu có)

| Element | Mô tả |
|---------|-------|
| **Info Card** | "Kẻ Giết Người: [Tên]" + "Lời giải: [Means] + [Clue]" |

---

## Screen 5: FORENSIC — Scene Setup (chỉ Pháp y thấy)

### Layout
- Header: "THIẾT LẬP HIỆN TRƯỜNG" + Lời giải (Means+Clue thật)
- Grid 3×2: 6 Scene Tiles
- Mỗi tile có dropdown/radio chọn option
- Footer: Nút "HOÀN TẤT ĐẶT DẤU"

### Thành phần UI

| Element | Mô tả |
|---------|-------|
| **Solution Bar** | Strip nổi bật ở trên: "Lời giải: 🔪 [Means] + 🔍 [Clue]", nền đỏ tối |
| **Tile Grid** | 3 cột × 2 hàng tiles |
| **Tile Card** | Mỗi tile: Tên tile (header) + 6 radio options, chọn 1 |
| **Tile Color** | Tím cho Cause of Death, Xanh cho Location, Nâu cho Evidence |
| **Marker Visual** | Option được chọn: dot đỏ ● bên trái + highlight background |
| **Confirm** | "HOÀN TẤT ĐẶT DẤU" — active khi tất cả 6 tiles đã có marker |

### Theme
- Cảm giác đang đặt ghim lên bảng điều tra
- Tiles có texture giấy cũ/corkboard

---

## Screen 6: GAME MAIN — Màn chơi chính (Investigators + Murderer + Accomplice + Witness)

### Layout
- **Header bar** (fixed top): Round indicator + Timer + Action buttons
- **Player row** (scrollable horizontal): Avatars nhỏ của tất cả người chơi
- **My Cards** (fixed bottom): 4 Means + 4 Clue của bản thân
- **Popups** (on-demand): Scene Board, Player Cards, Solving Wizard, Chat

### Header Bar

| Element | Vị trí | Mô tả |
|---------|--------|-------|
| **Round** | Trái | "R1" / "R2" / "R3" — dot màu đỏ/vàng/xanh |
| **Timer** | Giữa-trái | "2:30" countdown, blink đỏ khi < 30s. "--:--" nếu chưa start |
| **Board Button** | Giữa-phải | Icon 📋 — mở Scene Board popup |
| **Badge Button** | Phải | Icon 🔍 — mở Solving Wizard (Investigators only, ẩn nếu hết badge) |
| **Chat Button** | Phải cùng | Icon 💬 — mở chat panel |
| **Voice** | Phải cùng | Icon mic — LiveKit controls |

### Player Row

| Element | Mô tả |
|---------|-------|
| **Avatar** | Tròn 40×40, ảnh investigator với color tint khác nhau per player |
| **Name** | Text nhỏ dưới avatar |
| **Badge Icon** | Huy hiệu nhỏ bên cạnh — hiện nếu còn badge, ❌ nếu đã dùng |
| **FS Icon** | 🔬 icon cho Forensic Scientist |
| **Tap Action** | Tap avatar → mở popup xem 8 thẻ của người đó |

### My Cards Section

| Element | Mô tả |
|---------|-------|
| **Means Row** | 4 thẻ ngang, label "HUNG KHÍ", text: tên Việt (tên Anh nhỏ) |
| **Clue Row** | 4 thẻ ngang, label "MANH MỐI", text: tên Việt (tên Anh nhỏ) |
| **Card Style** | Nền tối, viền mỏng, text trắng. Tap → popup mô tả chi tiết |
| **Murderer Only** | Thẻ đã chọn làm lời giải có viền đỏ subtle (chỉ mình thấy) |

---

## Screen 6a: FORENSIC GAME MAIN — Màn chơi chính (Forensic Scientist)

### Khác biệt so với Screen 6
- **KHÔNG CÓ My Cards** (Pháp y không có thẻ)
- Thay bằng: **Scene Board inline** (6 tiles hiển thị trực tiếp, không cần popup)
- **Solution Bar** luôn hiển thị ở trên (chỉ Pháp y thấy)
- **Nút "Bắt đầu thảo luận"** thay cho Badge button
- **Solving Response** button khi có người phá án: "ĐÚNG ✓" / "SAI ✗"

### Thành phần đặc biệt

| Element | Mô tả |
|---------|-------|
| **Solution Bar** | "🔪 [Means] + 🔍 [Clue]" — strip đỏ tối ở top, chỉ FS thấy |
| **Start Discussion** | Nút lớn "▶ BẮT ĐẦU THẢO LUẬN" — kích hoạt timer |
| **Scene Tiles** | 3×2 grid chiếm phần chính màn hình, hiển thị markers đã đặt |
| **Tile Replace** | Round 2/3: 1 tile cũ bị fade out, tile mới slide in, Pháp y chọn marker mới |
| **Solving Alert** | Popup overlay: "[Tên] đang phá án! [Người] + [Means] + [Clue]" + 2 nút ĐÚNG/SAI |

---

## Screen 7: POPUP — Scene Board (Bàn Hiện Trường)

### Layout
- Bottom-sheet hoặc fullscreen overlay (tuỳ screen size)
- Grid 3×2 tiles
- Nút đóng ở góc

### Thành phần UI

| Element | Mô tả |
|---------|-------|
| **Title** | "BÀN HIỆN TRƯỜNG" — centered, uppercase |
| **Tiles Grid** | 3 cột × 2 hàng |
| **Each Tile** | Card với header (tên tile, màu theo type) + 6 options dọc |
| **Marker** | Option có marker: ● dot đỏ + background highlight nhẹ |
| **Tile Colors** | Header tím (#8B5CF6) cho Cause, xanh (#10B981) cho Location, nâu (#92400E) cho Evidence |
| **Close Button** | "✕ Đóng" hoặc swipe down để đóng |
| **New Tile Badge** | Tile mới thêm có badge "MỚI" nhỏ amber ở góc |

---

## Screen 8: POPUP — Player Cards (Thẻ người chơi)

### Layout
- Bottom-sheet popup, kích hoạt khi tap avatar
- Header: Tên người + Badge status
- Body: 2 hàng thẻ (Means + Clue)

### Thành phần UI

| Element | Mô tả |
|---------|-------|
| **Header** | Tên người chơi + icon badge (✓ còn / ✗ hết) |
| **Means Section** | Label "HUNG KHÍ" + 4 thẻ text ngang |
| **Clue Section** | Label "MANH MỐI" + 4 thẻ text ngang |
| **Close** | "✕" hoặc tap outside |

---

## Screen 9: POPUP — Solving Wizard (Phá án)

### Layout 
- Fullscreen overlay, wizard 4 bước

### Step 1: Chọn nghi phạm
| Element | Mô tả |
|---------|-------|
| **Title** | "BẠN TỐ CÁO AI?" |
| **Grid** | Avatar + tên tất cả người chơi (trừ Pháp y và bản thân) |
| **Selected** | Viền đỏ glow khi chọn |
| **Next** | "TIẾP THEO →" |

### Step 2: Chọn hung khí
| Element | Mô tả |
|---------|-------|
| **Title** | "HUNG KHÍ NÀO?" |
| **Grid** | 4 Means cards của người bị tố |
| **Selected** | Viền đỏ glow |

### Step 3: Chọn manh mối
| Element | Mô tả |
|---------|-------|
| **Title** | "MANH MỐI NÀO?" |
| **Grid** | 4 Clue cards của người bị tố |
| **Selected** | Viền đỏ glow |

### Step 4: Xác nhận
| Element | Mô tả |
|---------|-------|
| **Summary** | "[Nghi phạm] đã dùng [Means] và để lại [Clue]" |
| **Confirm** | "GỬI KẾT QUẢ PHÁ ÁN" — button đỏ lớn |
| **Cancel** | "HỦY" — text button nhỏ |

---

## Screen 10: POPUP — Solving Result (Kết quả phá án)

### Layout
- Fullscreen overlay, centered

### Nếu ĐÚNG ✓
| Element | Mô tả |
|---------|-------|
| **Icon** | ✓ checkmark lớn, glow xanh |
| **Text** | "PHÁ ÁN THÀNH CÔNG!" — text xanh neon, animation celebration |
| **Detail** | "[Tên Investigator] đã tìm ra sự thật!" |

### Nếu SAI ✗
| Element | Mô tả |
|---------|-------|
| **Icon** | ✗ lớn, glow đỏ |
| **Text** | "SAI! Huy hiệu bị thu hồi." — text đỏ |
| **Detail** | "[Tên] đã phá án sai. Còn [n] huy hiệu." |
| **Auto-close** | Tự đóng sau 3 giây |

---

## Screen 11: WITNESS HUNT — Săn nhân chứng

### Layout
- Fullscreen overlay, tối noir
- Chỉ hiện khi Evil thắng VÀ có Witness

### Thành phần UI

| Element | Mô tả |
|---------|-------|
| **Title** | "SĂN NHÂN CHỨNG" — text đỏ, uppercase, glow |
| **Instruction** | "Kẻ sát nhân chọn 1 người nghi là Nhân Chứng" |
| **Player Grid** | Avatars tất cả Investigators + Witness (không biết ai là ai) |
| **Murderer Only** | Tap để chọn → viền đỏ. Nút "XÁC NHẬN" |
| **Timer** | 60s đếm ngược cho Murderer quyết định |
| **Others** | Text "Đang chờ kẻ sát nhân hành động..." |

---

## Screen 12: GAME OVER — Kết thúc ván chơi

### Layout
- Fullscreen, 2 section: Kết quả + Chi tiết

### Thành phần UI

| Element | Mô tả |
|---------|-------|
| **Victory Banner** | "PHE ĐIỀU TRA THẮNG!" (xanh cyan) hoặc "PHE SÁT NHÂN THẮNG!" (đỏ neon) |
| **Solution Reveal** | "Lời giải: [Means] + [Clue] — bởi [Tên Murderer]" |
| **Role Reveal Grid** | Tất cả người chơi: Avatar + Tên + Vai trò (revealed), sắp theo phe |
| **History Section** | Danh sách phá án: "[Tên] tố [Người] → SAI/ĐÚNG" |
| **Witness Result** | (nếu có) "Nhân chứng [Tên] đã [sống sót / bị ám sát]" |
| **Action Buttons** | "CHƠI LẠI" (primary) + "VỀ LOBBY" (secondary) |

### Theme
- **Investigators win:** Nền tối + hiệu ứng xanh cyan celebration, confetti nhẹ
- **Murderer win:** Nền tối + hiệu ứng đỏ, smoke/fog, ominous vibe

---

## Screen 13: CHAT PANEL — Bảng chat

### Layout
- Side panel slide-in từ phải, hoặc bottom sheet
- Giống Avalon chat nhưng theme noir

### Thành phần UI

| Element | Mô tả |
|---------|-------|
| **Messages** | Scrollable list, sender name + message |
| **System Messages** | Italic, text xám: "[Hệ thống] Round 2 bắt đầu" |
| **Input** | Text input + send button |
| **FS Restriction** | Pháp y KHÔNG CÓ input chat — hiển thị notice "Pháp y không được phép chat" |

---

## Screen 14: VOICE CHAT — Panel voice (LiveKit)

### Layout
- Compact panel ở góc, giống Avalon

### Thành phần UI

| Element | Mô tả |
|---------|-------|
| **Join Voice** | Nút "Tham gia voice" |
| **Mic Toggle** | Nút mute/unmute |
| **Speaker indicators** | Ring animation quanh avatar người đang nói |
| **FS Mute** | Pháp y bị mute cưỡng bức (không cho talk), hiển thị icon bị gạch |

---

## Tổng kết: Danh sách màn hình

| # | Tên màn hình | Loại | Ghi chú |
|---|-------------|------|---------|
| 1 | Lobby Home | Page | Tạo/tham gia phòng |
| 2 | Lobby Room | Page | Danh sách người + Settings |
| 3 | Role Reveal | Overlay | Animation vai trò |
| 4 | Night Phase | Overlay | Murderer chọn + Others nhắm mắt |
| 5 | Scene Setup (FS) | Page | Pháp y đặt markers |
| 6 | Game Main | Page | Investigators/Murderer/Accomplice/Witness |
| 6a | Game Main (FS) | Page | Forensic Scientist view riêng |
| 7 | Scene Board | Popup | Xem 6 tiles |
| 8 | Player Cards | Popup | Xem thẻ người khác |
| 9 | Solving Wizard | Popup (4 steps) | Quy trình phá án |
| 10 | Solving Result | Popup | Kết quả đúng/sai |
| 11 | Witness Hunt | Overlay | Săn nhân chứng |
| 12 | Game Over | Page | Kết quả + Reveal roles |
| 13 | Chat Panel | Side Panel | Text chat |
| 14 | Voice Panel | Compact Panel | LiveKit voice |

---

## Design Tokens cho Stitch

```
Primary Color:     #FF2D55 (Đỏ neon — Danger, Murder)
Secondary Color:   #00D4FF (Cyan neon — Forensic, Truth)
Accent:            #FFB800 (Amber — Investigators, Detective)
Evil Accent:       #8B5CF6 (Tím — Accomplice, Evidence)
Witness:           #E0F7FF (Trắng xanh — Witness)

Background Dark:   #0A0A0F
Surface:           #141420
Surface Elevated:  #1E1E30
Border:            #2A2A40
Text Primary:      #F0F0F5
Text Secondary:    #8A8A9F

Corner Radius:     16px (cards), 12px (buttons), 24px (containers)
Font Family:       Inter (body), Outfit (headings)

Shadows:           0 0 20px rgba(255,45,85,0.3) — neon glow
                   0 0 15px rgba(0,212,255,0.2) — forensic glow
```
