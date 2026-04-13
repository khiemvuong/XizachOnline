# Avalon Advanced Mode — Phân Tích Cân Bằng Toàn Diện

## Nguyên Tắc Bật/Tắt Chế Độ Nâng Cao (Lobby Toggle)

- **Advanced Mode = ON:** Kích hoạt toàn bộ cơ chế sắp triển khai trong tài liệu này (kỹ năng nhân vật, phase quyết định kỹ năng, Athena, Minion Bond, Minion Cha Cha Cha, cinematic Athena, v.v.).
- **Advanced Mode = OFF:** Game chạy theo **mode cơ bản hiện tại** như đang có, không áp dụng các cơ chế mới nêu trong tài liệu này.
- **Minion:** Vẫn tồn tại theo cấu hình hiện tại của game; chỉ các cơ chế mới của Minion (Bond/quest ẩn, Cha Cha Cha) mới phụ thuộc Advanced Mode.

## Cấu Hình Nhân Vật Theo Số Người Chơi

### Vai Trò Khi Advanced Mode = ON

| Số người | Tốt | Ác  | Vai trò Ác                            | Vai trò Tốt Đặc Biệt         |
| -------- | --- | --- | ------------------------------------- | ---------------------------- |
| 5        | 3   | 2   | Assassin + Minion                     | Merlin, Percival             |
| 6        | 4   | 2   | Assassin + Morgana                    | Merlin, Percival             |
| 7        | 4   | 3   | Assassin + Morgana + Mordred          | Merlin, Percival, **Athena** |
| 8        | 5   | 3   | Assassin + Morgana + Mordred          | Merlin, Percival, **Athena** |
| 9        | 6   | 3   | Assassin + Morgana + Mordred          | Merlin, Percival, **Athena** |
| 10       | 6   | 4   | Assassin + Morgana + Mordred + Oberon | Merlin, Percival, **Athena** |

> ⚠️ **Athena chỉ xuất hiện từ 7 người trở lên khi Advanced Mode = ON.**
>
> ℹ️ Khi Advanced Mode = OFF, dùng cấu hình mode cơ bản hiện tại của game.

---

## Quest Composition (Đội Hình Nhiệm Vụ)

> ℹ️ Bảng đội hình nhiệm vụ giữ theo luật cơ bản. Khác biệt giữa ON/OFF nằm ở việc có hay không kích hoạt các cơ chế nâng cao.

| Quest | 5P  | 6P  | 7P  | 8P  | 9P  | 10P | Cần Fail để Thất Bại |
| ----- | --- | --- | --- | --- | --- | --- | -------------------- |
| Q1    | 2   | 2   | 2   | 3   | 3   | 3   | 1                    |
| Q2    | 3   | 3   | 3   | 4   | 4   | 4   | 1                    |
| Q3    | 2   | 4   | 3   | 4   | 4   | 4   | 1                    |
| Q4    | 3   | 3   | 4   | 5   | 5   | 5   | **2**                |
| Q5    | 3   | 4   | 4   | 5   | 5   | 5   | 1                    |

> ⚠️ Quest 4 từ 7 người trở lên cần **2 thẻ Fail** để thất bại — yếu tố cân bằng cực kỳ quan trọng.

---

## Phân Tích Xác Suất Cơ Sở (Không có Advanced Skills)

### Tỷ lệ Triển khai Quỷ trong Quest (Evil Exposure Rate)

Đây là xác suất ít nhất 1 quỷ lọt vào đội làm nhiệm vụ, giả sử chọn random:

```
P(≥1 Evil in Quest) = 1 - C(Tốt, QuestSize) / C(Tổng, QuestSize)
```

| Số người    | Q1  | Q2  | Q3  | Q4  | Q5  |
| ----------- | --- | --- | --- | --- | --- |
| 5P (2E/3G)  | 60% | 80% | 60% | 80% | 80% |
| 6P (2E/4G)  | 47% | 60% | 73% | 60% | 73% |
| 7P (3E/4G)  | 71% | 86% | 77% | 91% | 86% |
| 8P (3E/5G)  | 61% | 79% | 79% | 89% | 89% |
| 9P (3E/6G)  | 50% | 71% | 71% | 84% | 84% |
| 10P (4E/6G) | 70% | 83% | 83% | 90% | 90% |

> 💡 **Nhận xét:** Quỷ được lọt vào Quest với xác suất **rất cao** do số lượng lớn hơn tưởng. Điều này nghĩa là phe Tốt phụ thuộc nhiều vào khả năng **suy luận & vote đội hình** chứ không phải may mắn.

---

## Phân Tích Ma Trận Kỹ Năng Advanced — Từng Nhân Vật

> ⚠️ **Toàn bộ mục 1-8 bên dưới chỉ áp dụng khi Advanced Mode = ON.**
>
> Khi Advanced Mode = OFF, game không chạy các kỹ năng/cơ chế nâng cao này và giữ flow mode cơ bản hiện tại.

### 1. ASSASSIN — "Mắt Tử Thần" [Advanced Mode = ON]

Soi Role 1 người đi chung Quest → Có chức năng / Không có chức năng khi Percival xài; Soi chính xác Role khi Assassin xài.

**Kịch bản lợi nhất cho Assassin:**

| Tình huống          | Xác suất Assassin "soi đúng" Merlin | Giá trị thông tin                                |
| ------------------- | ----------------------------------- | ------------------------------------------------ |
| Quest 2 người (5P)  | 1/1 nếu Merlin đi                   | 100% nếu Merlin đi, ~50% nếu không biết đội hình |
| Quest 3 người (7P)  | 1/2 người không phải Assassin       | ~50%                                             |
| Quest 4 người (8P)  | 1/3 người không phải Assassin       | ~33%                                             |
| Quest 5 người (10P) | 1/4 người không phải Assassin       | ~25%                                             |

> **Kết luận:** Hiệu quả của kỹ năng Assassin **giảm theo quy mô Quest**. Ở 10 người, soi 1 trong 4 người "nếu không biết ai là Merlin" chỉ có 25% trúng. Cân bằng tốt. **Giữ nguyên thiết kế.**

---

### 2. MORGANA — "Đêm Câm Lặng" [Advanced Mode = ON]

Khóa toàn bộ kỹ năng 1 Quest.

**Ma trận xung đột kỹ năng:**

| Morgana bật Câm Lặng | Assassin xài Soi | Mordred xài Ép | Athena xài Lật Kèo | Kết quả                                                                   |
| -------------------- | ---------------- | -------------- | ------------------ | ------------------------------------------------------------------------- |
| ✅                   | ✅               | ❌             | ❌                 | Assassin mất kỹ năng. Quỷ tự triệt tiêu, Morgana không có lợi thế rõ rệt. |
| ✅                   | ❌               | ✅             | ❌                 | Mordred mất kỹ năng. Quỷ tự bóp nhau.                                     |
| ✅                   | ❌               | ❌             | ✅                 | Athena mất kỹ năng. **Cực kỳ có lợi cho Quỷ.**                            |
| ✅                   | ✅               | ✅             | ✅                 | Tất cả kỹ năng đều bị khóa. Câm lặng = "Chân không chiến lược"            |

**Ước tính lợi thế khi Morgana bật đúng thời điểm:**

- Nếu chặn được Athena lật kèo một Quest thất bại → Trực tiếp giúp Quỷ **+1 điểm Quest**
- Nếu vô tình chặn Assassin/Mordred đang định dùng kỹ năng: Quỷ tự giảm sức mạnh thông tin hoặc ép phiếu của chính mình

> ⚠️ **Vấn đề:** Do Quỷ không được giao tiếp, xác suất Morgana & Assassin/Mordred cùng bật kỹ năng trong **cùng 1 Quest = ~30–40%** → Quỷ tự hủy lẫn nhau với tần suất đáng kể. Đây là yếu tố cân bằng **tự nhiên** của thiết kế.

---

### 3. MORDRED — "Bàn Tay Vua Bóng Tối" [Advanced Mode = ON]

Ép 1 người bỏ phiếu Fail.

| Kịch bản                  | Số thẻ Fail bình thường | Thêm của Mordred     | Quest thất bại?         | Phân tích                             |
| ------------------------- | ----------------------- | -------------------- | ----------------------- | ------------------------------------- |
| Quest 1–3, 5 (cần 1 Fail) | 0 Fail trong đội        | +1 Fail (Mordred ép) | ✅ Thất bại             | Mordred đảo ngược kết quả Quest sạch! |
| Quest 1–3, 5 (cần 1 Fail) | 1+ Fail đã có           | +1 Fail (Mordred ép) | ✅ Thất bại (không đổi) | Lãng phí kỹ năng                      |
| Quest 4 (cần 2 Fail, 7P+) | 0 Fail                  | +1 Fail              | ❌ Vẫn thành công       | Mordred yếu ở Q4!                     |
| Quest 4 (cần 2 Fail)      | 1 Fail đã có            | +1 Fail              | ✅ Thất bại             | Mordred cứu nguy hoàn hảo ở Q4        |

> 💡 **Nhận xét quan trọng:** Ở Q4, Mordred chỉ có tác dụng khi **đội hình có đúng 1 quỷ**. Đây là scenario "saving grace" (cứu nguy) rất thú vị về mặt chiến lược. **Thiết kế đạt!**

**Hệ quả tâm lý:** Người bị ép Fail chỉ nhận thông báo riêng "Bạn đang bị nguyền" ngay khoảnh khắc chọn thẻ Fail/Success. Họ có thể:

- Thanh minh công khai → Người tốt tin → Mordred bị nghi ngờ → Quỷ mất 1 vectơ nghi ngờ
- Im lặng → Quest thất bại → Họ mang tiếng phản bội → **Rất hay về tâm lý**

---

### 4. Athena — "Đảo Thiên Kiền Khôn" [Advanced Mode = ON]

Lật kết quả Quest, lộ diện.

| Quest                            | Số Fail gốc | Athena lật | Kết quả mới     | Giá trị                     | Rủi ro (lộ diện)                                                      |
| -------------------------------- | ----------- | ---------- | --------------- | --------------------------- | --------------------------------------------------------------------- |
| Có ≥1 Fail (Quest thất bại)      | 1+          | Lật → Pass | ✅ Thắng        | **+1 điểm Quest cho Tốt**   | Athena lộ → Quỷ biết chắc 1 người tốt, loại trừ khỏi danh sách Merlin |
| Không có Fail (Quest thành công) | 0           | Lật → Fail | ❌ Thua 1 Quest | **-1 điểm Quest** (tự hại!) | Athena lộ + tự thua Quest → Thảm họa                                  |

> ✅ **Quyết định thiết kế:** Athena **được phép kích hoạt ở cả 2 trạng thái** (Quest đang thua hoặc đang thắng). Đây là cơ chế "được ăn cả, ngã về không": lật đúng thì cứu game, lật sai thì tự đốt điểm.

**Phân tích lộ diện:**

- Phe Tốt biết chắc 1 người tốt → **+1 người đáng tin** trong pool vote
- Phe Quỷ loại trừ 1 khỏi pool Merlin (còn lại ít người hơn để nghi) → **+thông tin cho Assassin**

> 📊 Athena càng lật muộn (Q4, Q5) thì thiệt hại "lộ thân phận" càng ít vì game gần kết thúc. **Nên incentivize Athena dùng ở Q3-Q4.**

---

### 5. MERLIN — "Đồng Quy Vô Tận" [Advanced Mode = ON]

Kéo Mordred chết chung → HÒA nếu Assassin bắn đúng Merlin.

| Trường hợp                                                 | Assassin bắn ai | Merlin kích hoạt | Kết quả                                                                              |
| ---------------------------------------------------------- | --------------- | ---------------- | ------------------------------------------------------------------------------------ |
| Merlin chắc bị bắn, kích hoạt                              | Merlin          | ✅               | **HÒA** — Phe Tốt không thua hoàn toàn                                               |
| Merlin chắc bị bắn, không kích hoạt                        | Merlin          | ❌               | **Quỷ thắng**                                                                        |
| Merlin không chắc bị bắn, kích hoạt                        | Percival        | ✅               | **Quỷ thắng** (Merlin tự vẫn oan, Mordred chết theo nhưng Quỷ vẫn thắng do đếm điểm) |
| Assassin cố tình bắn Percival để Merlin hoảng sợ kích hoạt | Percival        | ✅ (vì quá lo)   | **Quỷ thắng** — Mind game hoàn hảo                                                   |

> 💡 **Ma trận tâm lý cuối game:** Đây là màn **đấu trí Poker**. Assassin sẽ phải quyết định:
>
> - Bắn người mình 95% chắc là Merlin → Rủi ro Merlin kéo Mordred → HÒA
> - Bắn người mình chỉ 60% chắc → Bảo toàn khả năng thắng hoàn toàn nhưng rủi ro bắn sai

**Điều kiện cần thêm:** HÒA = Phe Tốt vẫn "không thắng" về mặt game mechanics. Cần định nghĩa rõ: HÒA nghĩa là **không ai được điểm**, replay nếu muốn tiếp tục.

> ℹ️ Cơ chế HÒA do kỹ năng Merlin là cơ chế nâng cao. Khi Advanced Mode = OFF, game theo kết quả mode cơ bản hiện tại.

---

### 6. PERCIVAL — "Truy Vết Chức Năng" [Advanced Mode = ON]

Có chức năng / Không có chức năng.

Percival soi 1 người → chỉ biết người đó thuộc nhóm **có chức năng chủ động** hay **không có chức năng chủ động**.

| Người được soi                 | Kết quả Percival thấy | Ghi chú                                                                          |
| ------------------------------ | --------------------- | -------------------------------------------------------------------------------- |
| Merlin                         | "CÓ CHỨC NĂNG"        | Có kỹ năng cuối game                                                             |
| Morgana                        | "CÓ CHỨC NĂNG"        | Có thể tạo nhiễu cho Percival                                                    |
| Assassin                       | "CÓ CHỨC NĂNG"        | Thuộc nhóm role có skill chủ động                                                |
| Athena                         | "CÓ CHỨC NĂNG"        | Chỉ xuất hiện từ 7 người                                                         |
| Mordred                        | "KHÔNG CÓ CHỨC NĂNG"  | **Ngoại lệ cố định**: trong mắt Percival, Mordred luôn bị ẩn                     |
| Minion/Oberon/Người tốt thường | "KHÔNG CÓ CHỨC NĂNG"  | Minion chỉ có emote "Cha Cha Cha" (cosmetic), không tính là chức năng chiến lược |

> ✅ **Quyết định chốt:** Percival dùng chuẩn nhị phân "có chức năng / không có chức năng". Mordred được ẩn như bạn yêu cầu để giữ logic đồng nhất với việc Merlin không nhìn ra Mordred.

> ℹ️ Khi Advanced Mode = OFF, Percival quay về flow mode cơ bản hiện tại.

---

### 7. MINION BOND — "Huynh Đệ Tương Ngộ" [Advanced Mode = ON]

Nội tại ẩn.

Điều kiện kích hoạt đã chốt:

| Điều kiện kích hoạt                                                        | Phân tích                                                                               | Trạng thái     |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------- |
| Một cặp Minion đi chung **3 Quest** và có **ít nhất 2/3 Quest thành công** | Buộc phải đồng hành đủ lâu và có hiệu quả thực chiến, không quá dễ kích hoạt ngẫu nhiên | ✅ **Áp dụng** |

**Xử lý khi có nhiều cặp cùng thỏa điều kiện:**

- Hệ thống chọn ngẫu nhiên **1 cặp Minion bất kỳ** trong tập cặp hợp lệ.
- Chỉ cặp được chọn mới kích hoạt bond để tránh cộng dồn quá mạnh.

---

### 8. MINION — "Cha Cha Cha" [Advanced Mode = ON]

Kỹ năng vui, không ảnh hưởng kết quả.

- Minion có một kỹ năng vui dạng emote, dùng trong **phase quyết định kỹ năng** trước khi vào phase chọn Fail/Success.
- Nếu Minion bấm dùng, hệ thống phát thông báo công khai theo hướng: **"Bạn đang nhảy điệu Cha Cha Cha"** (hoặc câu tương đương).
- Kỹ năng này **không** thay đổi game state: không đổi kết quả Quest, không đổi lá phiếu, không tạo thêm thông tin chiến lược.

---

## Tổng Phân Tích Tỷ Lệ Thắng Ước Tính

### Avalon Chuẩn (Không Advanced) — Tham chiếu

| Số người | Tỷ lệ Tốt thắng | Tỷ lệ Ác thắng |
| -------- | --------------- | -------------- |
| 5P       | ~55%            | ~45%           |
| 6P       | ~50%            | ~50%           |
| 7P       | ~45%            | ~55%           |
| 8P       | ~45%            | ~55%           |
| 9P       | ~42%            | ~58%           |
| 10P      | ~40%            | ~60%           |

> Avalon gốc **thiên lệch nhẹ về Quỷ** ở bàn đông người. Advanced Mode phải bù đắp điều này cho Phe Tốt.

### Ước Tính Sau Advanced Skills

| Số người | Skills tác động chính               | Tỷ lệ Tốt | Tỷ lệ Ác | Cân bằng?                    |
| -------- | ----------------------------------- | --------- | -------- | ---------------------------- |
| 5P       | Merlin + Assassin (không có Athena) | ~55%      | ~45%     | ✅ Cân bằng                  |
| 6P       | + Morgana                           | ~48%      | ~52%     | ✅ Gần cân bằng              |
| 7P       | + Mordred + Athena                  | ~50%      | ~50%     | ✅ Cân bằng tốt              |
| 8P       | = 7P nhưng thêm 1 người tốt         | ~52%      | ~48%     | ✅ Hơi thiên Tốt             |
| 9P       | + Minion Bond                       | ~50%      | ~50%     | ✅ Cân bằng tốt              |
| 10P      | + Oberon                            | ~47%      | ~53%     | ⚠️ Hơi thiên Ác, cần monitor |

> **Kết luận tổng thể:** Advanced Mode nhìn chung cân bằng tốt hơn Avalon gốc, đặc biệt ở bàn 7-9 người là sweet spot của thiết kế.

---

## Cập Nhật Quy Tắc Đã Chốt Trước Khi Implementation

1. **Công tắc Lobby:** Toàn bộ cơ chế mới trong tài liệu này chỉ kích hoạt khi **Advanced Mode = ON**.
2. **Khi OFF:** Game giữ nguyên **mode cơ bản hiện tại**, không có phase kỹ năng/cinematic/cơ chế nâng cao.
3. **Minion:** Vai trò Minion vẫn tồn tại như hiện tại; chỉ Minion Bond và Minion Cha Cha Cha mới là cơ chế Advanced-only.
4. **Morgana vs Assassin:** Nếu cùng bật trong 1 Quest thì Assassin mất skill, đây là tự triệt tiêu nội bộ Quỷ, không tính là lợi thế cho Morgana.
5. **Athena:** Được phép lật ở cả Quest đang thắng lẫn đang thua (cơ chế all-in, rủi ro cao).
6. **Percival:** Chuyển sang soi kiểu "có chức năng / không có chức năng"; riêng Mordred luôn hiện là "không có chức năng" trong mắt Percival.
7. **Fool:** Loại khỏi danh sách nhân vật và khỏi ma trận kỹ năng.
8. **Minion Bond:** Kích hoạt khi một cặp Minion đi chung 3 Quest và có tối thiểu 2 Quest thành công; nếu có nhiều cặp hợp lệ thì random 1 cặp.
9. **Phase quyết định kỹ năng:** Toàn bộ người đi Quest đều phải thấy cùng một giao diện quyết định dùng skill (kể cả không có skill, hoặc skill đã hết lượt) để tránh lộ thông tin khi ngồi gần nhau.
10. **Thứ tự phase cố định:** Chỉ khi tất cả người đi Quest đã xác nhận xong phase quyết định kỹ năng thì mới chuyển sang phase chọn Fail/Success.
11. **Minion emote skill:** Minion có skill vui "Cha Cha Cha"; khi dùng sẽ hiện thông báo công khai, nhưng không ảnh hưởng logic thắng thua.
12. **Còn cần chốt thêm:**

- Định nghĩa kết quả **HÒA** ở UI/điểm số.

---

## Ghi Chú Public Info Và Timing Kích Hoạt Kỹ Năng

> ⚠️ **Mục này chỉ áp dụng khi Advanced Mode = ON.**
>
> Khi Advanced Mode = OFF, bỏ toàn bộ phase quyết định kỹ năng và vận hành theo flow mode cơ bản hiện tại.

### 1) Quy tắc hiển thị thông tin (public/private)

- **UI phase đồng bộ cho người đi Quest:** Tất cả người đi Quest đều nhìn thấy phase quyết định kỹ năng. Người không có skill vẫn phải xác nhận "không dùng" để không lộ vai trò.
- **Mordred (Ép Fail):** Chỉ người bị ép mới nhận thông báo, và chỉ biết ở đúng khoảnh khắc chọn thẻ Fail/Success rằng mình bị buộc phải chọn Fail.
- **Morgana / Assassin / Percival:** Không thông báo cho bất kỳ ai trên bàn. Chỉ chính người chơi đó biết là mình đã dùng kỹ năng.
- **Athena:** Khi kỹ năng thực sự kích hoạt, hệ thống sẽ thông báo cho toàn bàn sau khi kết thúc phase vote Fail/Success.
- **Minion (Cha Cha Cha):** Khi dùng thì có thông báo công khai dạng "Bạn đang nhảy điệu Cha Cha Cha", chỉ mang tính vui, không mang thông tin chiến lược.

### 2) Thời điểm quyết định dùng kỹ năng

- **Toàn bộ người đi Quest:** Hoàn tất phase quyết định kỹ năng trước, rồi mới mở phase chọn thẻ Fail/Success cho cả nhóm.
- **Morgana / Assassin / Percival:** Quyết định dùng hoặc không dùng phải được chốt **trước khi** người chơi chọn thẻ Fail/Success.
- **Athena:** Cũng chốt dùng hoặc không dùng ở cùng mốc thời gian trước khi chọn thẻ Fail/Success.
- **Merlin:** Quyết định dùng hoặc không dùng kỹ năng được chốt **trước khi bước vào phase ám sát**.

### 3) Frontend flow cho Athena (cinematic reveal)

- Sau khi toàn bộ người đi Quest vote xong, frontend hiển thị kết quả gốc trước (ví dụ đang là Fail).
- Chờ một khoảng trễ nhỏ **3 giây**.
- Phát video cinematic chủ đề Athena đảo ngược số phận (asset sẽ bổ sung sau).
- Sau cinematic mới cập nhật kết quả thực tế đã bị đảo (ví dụ Fail -> Success).

> Lưu ý: Hiệu ứng hiển thị trễ là lớp trình bày frontend; game state logic vẫn phải tính đúng theo kết quả sau đảo của Athena.
