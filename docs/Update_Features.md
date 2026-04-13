# Avalon Advanced Mode — Phân Tích Cân Bằng Toàn Diện

## Cấu Hình Nhân Vật Theo Số Người Chơi

### Vai Trò Cơ Sở (Mode thường + Advanced)

| Số người | Tốt | Ác | Vai trò Ác | Vai trò Tốt Đặc Biệt |
|---|---|---|---|---|
| 5 | 3 | 2 | Assassin + Minion | Merlin, Percival |
| 6 | 4 | 2 | Assassin + Morgana | Merlin, Percival |
| 7 | 4 | 3 | Assassin + Morgana + Mordred | Merlin, Percival, **Goddess** |
| 8 | 5 | 3 | Assassin + Morgana + Mordred | Merlin, Percival, **Goddess** |
| 9 | 6 | 3 | Assassin + Morgana + Mordred | Merlin, Percival, **Goddess**, **Fool** |
| 10 | 6 | 4 | Assassin + Morgana + Mordred + Oberon | Merlin, Percival, **Goddess**, **Fool** |

> ⚠️ **Goddess chỉ xuất hiện từ 7 người trở lên** (theo đề xuất của bạn — hoàn toàn hợp lý).

---

## Quest Composition (Đội Hình Nhiệm Vụ)

| Quest | 5P | 6P | 7P | 8P | 9P | 10P | Cần Fail để Thất Bại |
|---|---|---|---|---|---|---|---|
| Q1 | 2 | 2 | 2 | 3 | 3 | 3 | 1 |
| Q2 | 3 | 3 | 3 | 4 | 4 | 4 | 1 |
| Q3 | 2 | 4 | 3 | 4 | 4 | 4 | 1 |
| Q4 | 3 | 3 | 4 | 5 | 5 | 5 | **2** |
| Q5 | 3 | 4 | 4 | 5 | 5 | 5 | 1 |

> ⚠️ Quest 4 từ 7 người trở lên cần **2 thẻ Fail** để thất bại — yếu tố cân bằng cực kỳ quan trọng.

---

## Phân Tích Xác Suất Cơ Sở (Không có Advanced Skills)

### Tỷ lệ Triển khai Quỷ trong Quest (Evil Exposure Rate)

Đây là xác suất ít nhất 1 quỷ lọt vào đội làm nhiệm vụ, giả sử chọn random:

```
P(≥1 Evil in Quest) = 1 - C(Tốt, QuestSize) / C(Tổng, QuestSize)
```

| Số người | Q1 | Q2 | Q3 | Q4 | Q5 |
|---|---|---|---|---|---|
| 5P (2E/3G) | 60% | 80% | 60% | 80% | 80% |
| 6P (2E/4G) | 47% | 60% | 73% | 60% | 73% |
| 7P (3E/4G) | 71% | 86% | 77% | 91% | 86% |
| 8P (3E/5G) | 61% | 79% | 79% | 89% | 89% |
| 9P (3E/6G) | 50% | 71% | 71% | 84% | 84% |
| 10P (4E/6G) | 70% | 83% | 83% | 90% | 90% |

> 💡 **Nhận xét:** Quỷ được lọt vào Quest với xác suất **rất cao** do số lượng lớn hơn tưởng. Điều này nghĩa là phe Tốt phụ thuộc nhiều vào khả năng **suy luận & vote đội hình** chứ không phải may mắn.

---

## Phân Tích Ma Trận Kỹ Năng Advanced — Từng Nhân Vật

### 1. ASSASSIN — "Mắt Tử Thần" (Soi Role 1 người đi chung Quest → Phép / Không Phép khi Percival xài; Soi chính xác Role khi Assassin xài)

**Kịch bản lợi nhất cho Assassin:**

| Tình huống | Xác suất Assassin "soi đúng" Merlin | Giá trị thông tin |
|---|---|---|
| Quest 2 người (5P) | 1/1 nếu Merlin đi | 100% nếu Merlin đi, ~50% nếu không biết đội hình |
| Quest 3 người (7P) | 1/2 người không phải Assassin | ~50% |
| Quest 4 người (8P) | 1/3 người không phải Assassin | ~33% |
| Quest 5 người (10P) | 1/4 người không phải Assassin | ~25% |

> **Kết luận:** Hiệu quả của kỹ năng Assassin **giảm theo quy mô Quest**. Ở 10 người, soi 1 trong 4 người "nếu không biết ai là Merlin" chỉ có 25% trúng. Cân bằng tốt. **Giữ nguyên thiết kế.**

---

### 2. MORGANA — "Đêm Câm Lặng" (Khóa toàn bộ kỹ năng 1 Quest)

**Ma trận xung đột kỹ năng:**

| Morgana bật Câm Lặng | Assassin xài Soi | Mordred xài Ép | Goddess xài Lật Kèo | Kết quả |
|---|---|---|---|---|
| ✅ | ✅ | ❌ | ❌ | Assassin mất kỹ năng. Morgana hữu ích. |
| ✅ | ❌ | ✅ | ❌ | Mordred mất kỹ năng. Quỷ tự bóp nhau. |
| ✅ | ❌ | ❌ | ✅ | Goddess mất kỹ năng. **Cực kỳ có lợi cho Quỷ.** |
| ✅ | ✅ | ✅ | ✅ | Tất cả kỹ năng đều bị khóa. Câm lặng = "Chân không chiến lược" |

**Ước tính lợi thế khi Morgana bật đúng thời điểm:**
- Nếu chặn được Goddess lật kèo một Quest thất bại → Trực tiếp giúp Quỷ **+1 điểm Quest**
- Nếu chặn được Assassin đang định soi: thị giá thông tin ≈ **0.25–0.5 điểm thông tin** (tùy round)

> ⚠️ **Vấn đề:** Do Quỷ không được giao tiếp, xác suất Morgana & Assassin/Mordred cùng bật kỹ năng trong **cùng 1 Quest = ~30–40%** → Quỷ tự hủy lẫn nhau với tần suất đáng kể. Đây là yếu tố cân bằng **tự nhiên** của thiết kế.

---

### 3. MORDRED — "Bàn Tay Vua Bóng Tối" (Ép 1 người bỏ phiếu Fail)

| Kịch bản | Số thẻ Fail bình thường | Thêm của Mordred | Quest thất bại? | Phân tích |
|---|---|---|---|---|
| Quest 1–3, 5 (cần 1 Fail) | 0 Fail trong đội | +1 Fail (Mordred ép) | ✅ Thất bại | Mordred đảo ngược kết quả Quest sạch! |
| Quest 1–3, 5 (cần 1 Fail) | 1+ Fail đã có | +1 Fail (Mordred ép) | ✅ Thất bại (không đổi) | Lãng phí kỹ năng |
| Quest 4 (cần 2 Fail, 7P+) | 0 Fail | +1 Fail | ❌ Vẫn thành công | Mordred yếu ở Q4! |
| Quest 4 (cần 2 Fail) | 1 Fail đã có | +1 Fail | ✅ Thất bại | Mordred cứu nguy hoàn hảo ở Q4 |

> 💡 **Nhận xét quan trọng:** Ở Q4, Mordred chỉ có tác dụng khi **đội hình có đúng 1 quỷ**. Đây là scenario "saving grace" (cứu nguy) rất thú vị về mặt chiến lược. **Thiết kế đạt!**

**Hệ quả tâm lý:** Người bị ép Fail nhận thông báo riêng "Bạn đang bị nguyền". Họ có thể:
- Thanh minh công khai → Người tốt tin → Mordred bị nghi ngờ → Quỷ mất 1 vectơ nghi ngờ
- Im lặng → Quest thất bại → Họ mang tiếng phản bội → **Rất hay về tâm lý**

---

### 4. GODDESS — "Đảo Thiên Kiền Khôn" (Lật kết quả Quest, Lộ diện)

| Quest | Số Fail gốc | Goddess lật | Kết quả mới | Giá trị | Rủi ro (lộ diện) |
|---|---|---|---|---|---|
| Có ≥1 Fail (Quest thất bại) | 1+ | Lật → Pass | ✅ Thắng | **+1 điểm Quest cho Tốt** | Goddess lộ → Quỷ biết chắc 1 người tốt, loại trừ khỏi danh sách Merlin |
| Không có Fail (Quest thành công) | 0 | Lật → Fail | ❌ Thua 1 Quest | **-1 điểm Quest** (tự hại!) | Goddess lộ + tự thua Quest → Thảm họa |

> ⚠️ **Điều kiện cần đề xuất:** Goddess nên **chỉ được kích hoạt khi Quest đang có thẻ Fail** (hệ thống kiểm tra ngầm). Nếu không, Goddess xài nhầm lúc Quest đang thắng = tự thua = bug thiết kế nghiêm trọng.

**Phân tích lộ diện:**
- Phe Tốt biết chắc 1 người tốt → **+1 người đáng tin** trong pool vote
- Phe Quỷ loại trừ 1 khỏi pool Merlin (còn lại ít người hơn để nghi) → **+thông tin cho Assassin**

> 📊 Goddess càng lật muộn (Q4, Q5) thì thiệt hại "lộ thân phận" càng ít vì game gần kết thúc. **Nên incentivize Goddess dùng ở Q3-Q4.**

---

### 5. MERLIN — "Đồng Quy Vô Tận" (Kéo Mordred chết chung → HÒA nếu Assassin bắn đúng Merlin)

| Trường hợp | Assassin bắn ai | Merlin kích hoạt | Kết quả |
|---|---|---|---|
| Merlin chắc bị bắn, kích hoạt | Merlin | ✅ | **HÒA** — Phe Tốt không thua hoàn toàn |
| Merlin chắc bị bắn, không kích hoạt | Merlin | ❌ | **Quỷ thắng** |
| Merlin không chắc bị bắn, kích hoạt | Percival | ✅ | **Quỷ thắng** (Merlin tự vẫn oan, Mordred chết theo nhưng Quỷ vẫn thắng do đếm điểm) |
| Assassin cố tình bắn Percival để Merlin hoảng sợ kích hoạt | Percival | ✅ (vì quá lo) | **Quỷ thắng** — Mind game hoàn hảo |

> 💡 **Ma trận tâm lý cuối game:** Đây là màn **đấu trí Poker**. Assassin sẽ phải quyết định:
> - Bắn người mình 95% chắc là Merlin → Rủi ro Merlin kéo Mordred → HÒA
> - Bắn người mình chỉ 60% chắc → Bảo toàn khả năng thắng hoàn toàn nhưng rủi ro bắn sai

**Điều kiện cần thêm:** HÒA = Phe Tốt vẫn "không thắng" về mặt game mechanics. Cần định nghĩa rõ: HÒA nghĩa là **không ai được điểm**, replay nếu muốn tiếp tục.

---

### 6. PERCIVAL — "Truy Vết Phép Thuật" (Option B: Phép / Không Phép)

Percival soi 1 người → chỉ biết người đó có phải Pháp Sư (Merlin/Morgana) hay không.

| Người được soi | Kết quả Percival thấy | Thông tin thực sự |
|---|---|---|
| Merlin | "CÓ PHÉP" | Có thể là Merlin HOẶC Morgana |
| Morgana | "CÓ PHÉP" | Bẫy! Morgana đóng giả, Percival không phân biệt được |
| Người Tốt thường | "KHÔNG CÓ PHÉP" | Xác nhận người tốt, không có giá trị đặc biệt |
| Goddess/Fool | "KHÔNG CÓ PHÉP" | Goddess và Fool không phải Pháp Sư |

> ✅ **Đây là thiết kế hoàn hảo.** Percival luôn có lợi khi xài (loại trừ 1 người), nhưng "CÓ PHÉP" tạo ra sự mơ hồ rất Avalon. Morgana sẽ cố gắng đi cùng Percival để phá vỡ thông tin. **Option B — Approved!**

---

### 7. FOOL — "Mặt Nạ Hề" (Chọn 1 người nghĩ là Merlin → Nếu đúng: thấy danh sách quỷ / Nếu sai: thấy 1 người ngẫu nhiên thành "quỷ")

| Kết quả chọn | Fool biết kết quả? | Thông tin nhận được | Giá trị thực |
|---|---|---|---|
| Chọn đúng Merlin | ❌ Không biết | Thấy đúng danh sách Quỷ | **+Cực lớn** — nếu dùng đúng |
| Chọn sai (người tốt) | ❌ Không biết | Thấy 1 người tốt ngẫu nhiên bị đổi thành "quỷ" | **Misleading** — nguy hiểm |

**Lỗ hổng thiết kế bạn đã nhận ra:** Chọn 1 người chắc chắn không phải Merlin (ví dụ, người Fool đã biết chắc là người tốt):
- Thấy 1 người thành "quỷ" → Biết chắc người đó là người tốt (vì chỉ người tốt mới bị hiển thị loạn)
- **Loại trừ thêm 1 người tốt khỏi list nghi ngờ** — thông tin giá trị vừa phải

> ⚠️ **Đề xuất cân bằng lỗ hổng này:** Nếu Fool chọn sai, **người bị biến thành "quỷ" ảo phải được chọn ngẫu nhiên từ toàn bộ pool** (bao gồm cả những người Fool chưa biết), chứ không phải từ pool đã loại trừ. Điều này giảm thiểu khả năng exploit kỹ thuật "chọn người mình chắc chắn".

---

### 8. MINION BOND — "Huynh Đệ Tương Ngộ" (Nội Tại Ẩn)

Điều kiện đề xuất (cần cân bằng):

| Điều kiện kích hoạt | Phân tích | Khuyến nghị |
|---|---|---|
| 2 Minion đi chung **2 Quest bất kỳ** (kể cả thất bại) | Quá dễ đạt được. Ở 10P có 2 Minion, khả năng 2 người đi chung 2 lần trong 5 Quest là ~60-70% | **Quá mạnh. Không nên.** |
| 2 Minion đi chung **2 Quest thành công liên tiếp** | Khó hơn vì buộc phải thắng. Xác suất ~25-35% | **Tạm được** |
| 2 Minion đi chung **3 Quest bất kỳ** | Vừa phải, xác suất ~35-50% | **Cân bằng nhất** |
| 2 Minion đi chung **2 Quest thất bại** | Ngược lại — Quỷ phải cố tình thua 2 Quest để bond? Phá vỡ incentive | **Không nên** |

**Đề xuất tối ưu: 2 Minion đi chung ít nhất 2 trong 5 Quest, và ít nhất 1 Quest phải thành công.**
- Xác suất kích hoạt: ~45-55% (đủ rare để có giá trị, không quá phổ biến)
- Logic thịt: Đồng hành trong cả thắng lẫn bại mới thực sự nhận ra nhau.

---

## Tổng Phân Tích Tỷ Lệ Thắng Ước Tính

### Avalon Chuẩn (Không Advanced) — Tham chiếu
| Số người | Tỷ lệ Tốt thắng | Tỷ lệ Ác thắng |
|---|---|---|
| 5P | ~55% | ~45% |
| 6P | ~50% | ~50% |
| 7P | ~45% | ~55% |
| 8P | ~45% | ~55% |
| 9P | ~42% | ~58% |
| 10P | ~40% | ~60% |

> Avalon gốc **thiên lệch nhẹ về Quỷ** ở bàn đông người. Advanced Mode phải bù đắp điều này cho Phe Tốt.

### Ước Tính Sau Advanced Skills

| Số người | Skills tác động chính | Tỷ lệ Tốt | Tỷ lệ Ác | Cân bằng? |
|---|---|---|---|---|
| 5P | Merlin + Assassin (không có Goddess, Fool) | ~55% | ~45% | ✅ Cân bằng |
| 6P | + Morgana | ~48% | ~52% | ✅ Gần cân bằng |
| 7P | + Mordred + Goddess | ~50% | ~50% | ✅ Cân bằng tốt |
| 8P | = 7P nhưng thêm 1 người tốt | ~52% | ~48% | ✅ Hơi thiên Tốt |
| 9P | + Fool + Minion Bond | ~50% | ~50% | ✅ Cân bằng tốt |
| 10P | + Oberon | ~47% | ~53% | ⚠️ Hơi thiên Ác, cần monitor |

> **Kết luận tổng thể:** Advanced Mode nhìn chung cân bằng tốt hơn Avalon gốc, đặc biệt ở bàn 7-9 người là sweet spot của thiết kế.

---

## ⚠️ Điểm Cần Quyết Định Trước Khi Implementation

1. **Goddess kích hoạt sai context (Quest đang thắng):** Có cho phép không? Nếu có, Phe Tốt có thể bị hại bởi chính họ.
2. **Fool chọn sai từ pool nào?** Ngẫu nhiên hoàn toàn (my recommendation) hay chỉ từ người Fool chưa biết?
3. **HÒA = Gì?** Replay? Không ai ghi điểm? Cần định nghĩa ở UI.
4. **Minion Bond:** 2 Quest bất kỳ + ≥1 Quest thành công là khuyến nghị. Bạn có muốn điều chỉnh không?
5. **Mordred ép người tốt:** Người bị ép có được thông báo trực tiếp hay phải tự nhận ra? (Mình recommend: thông báo bí mật ngay lúc bắt đầu Quest phase)
