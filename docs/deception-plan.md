# Deception: Murder in Hong Kong — Implementation Plan

## Tổng quan

Xây dựng game **Deception: Murder in Hong Kong** online, chạy song song với Avalon trên cùng codebase XizachOnline. Game sử dụng Socket.io namespace `/deception`, kiến trúc Engine tương tự `AvalonEngine.ts`, và UI mobile-first landscape.

---

## Quyết định đã xác nhận

| Hạng mục            | Quyết định                                    |
| ------------------- | --------------------------------------------- |
| Event Tiles         | Triển khai **sau** (không trong MVP)          |
| Voice Chat          | Dùng chung **LiveKit** với Avalon             |
| Orientation         | **Force landscape** giống Avalon              |
| Investigator Images | **1 ảnh gốc** + color tint cho mỗi người      |
| Clue Cards          | Dùng **70 thẻ hiện có**                       |
| Color Theme         | **Noir tối** — dark backgrounds, neon accents |
| Ảnh minh họa        | User **tự tạo** từ prompts                    |

---

## Kiến trúc Hệ thống

### State Machine

```
LOBBY → ROLE_REVEAL → NIGHT_PHASE → SCENE_SETUP
  ↓                                      ↓
  ←──── GAME_OVER ←── WITNESS_HUNT ← DISCUSSION (R1)
                           ↑              ↓
                           ├── DISCUSSION (R2)
                           ↑              ↓
                           └── DISCUSSION (R3)
                                          ↓
                              SOLVING_ATTEMPT ──→ correct → GAME_OVER
                                     ↓ incorrect
                              Quay lại DISCUSSION
```

### Trạng thái

```typescript
type DeceptionGameState =
  | "LOBBY"
  | "ROLE_REVEAL"
  | "NIGHT_PHASE"
  | "SCENE_SETUP"
  | "DISCUSSION"
  | "SOLVING_ATTEMPT"
  | "WITNESS_HUNT"
  | "GAME_OVER";
```

### Vai trò

| Vai trò            | Số lượng | Điều kiện     |
| ------------------ | -------- | ------------- |
| Forensic Scientist | 1        | Luôn có       |
| Murderer           | 1        | Luôn có       |
| Investigator       | 2-10     | Luôn có       |
| Accomplice         | 0-1      | 6+ người chơi |
| Witness            | 0-1      | 6+ người chơi |

### Phân vai trò theo số người

| Số người | FS  | Murderer | Accomplice | Witness | Investigators |
| -------- | --- | -------- | ---------- | ------- | ------------- |
| 4        | 1   | 1        | 0          | 0       | 2             |
| 5        | 1   | 1        | 0          | 0       | 3             |
| 6        | 1   | 1        | 1          | 1       | 2             |
| 7        | 1   | 1        | 1          | 1       | 3             |
| 8        | 1   | 1        | 1          | 1       | 4             |
| 9        | 1   | 1        | 1          | 1       | 5             |
| 10       | 1   | 1        | 1          | 1       | 6             |
| 11       | 1   | 1        | 1          | 1       | 7             |
| 12       | 1   | 1        | 1          | 1       | 8             |

---

## Timer System

- Timer **KHÔNG tự chạy**
- Pháp y bấm nút **"Bắt đầu thảo luận"** → timer bắt đầu
- Thời gian configurable trong Settings (60s - 600s, mặc định 180s)
- Round 2 & 3: Pháp y thay tile + đặt marker xong → bấm "Bắt đầu" lại
- Hết giờ → Server tự chuyển round hoặc kết thúc game

---

## Luồng Game Chi Tiết

### 1. LOBBY

- Tạo/tham gia phòng bằng mã 4 số
- Host cấu hình: thời gian thảo luận, bật/tắt Accomplice+Witness
- Tối thiểu 4, tối đa 12 người

### 2. ROLE_REVEAL

- Hiển thị vai trò với animation dramatic
- Background tối noir, text phát sáng
- Mỗi người bấm Ready để xác nhận đã xem

### 3. NIGHT_PHASE

- Tất cả nhận dark overlay "Nhắm mắt"
- **Murderer**: Chọn 1 Means + 1 Clue từ 8 thẻ CỦA MÌNH → xác nhận
- **Witness** (nếu có): Thấy danh tính Murderer + Accomplice
- **Accomplice** (nếu có): Thấy Murderer + lời giải (Means+Clue đã chọn)
- **Forensic Scientist**: Nhận lời giải → chuẩn bị scene tiles
- Khi Murderer xác nhận → tất cả "mở mắt"

### 4. SCENE_SETUP

- Hệ thống tạo 6 Scene Tiles:
  - 1× Cause of Death (tím, bắt buộc)
  - 1× Location of Crime (xanh, random 1 trong 4 bộ)
  - 4× Evidence tiles (nâu, random từ pool)
- Pháp y đặt 1 marker cho mỗi tile (chọn option phù hợp nhất với lời giải)
- Pháp y bấm "Hoàn tất" → markers broadcast cho tất cả

### 5. DISCUSSION (Round 1/2/3)

- Pháp y bấm "Bắt đầu thảo luận" → timer start
- Người chơi thảo luận qua voice (LiveKit) + text chat
- Pháp y **KHÔNG ĐƯỢC** chat/nói — chỉ giao tiếp qua scene tiles
- Bất kỳ Investigator nào CÒN BADGE có thể phá án bất cứ lúc nào
- **Round transition (2→3):**
  - Hệ thống bỏ random 1 evidence tile (trừ tím+xanh)
  - Thêm 1 evidence tile mới từ pool
  - Pháp y đặt marker mới → bấm "Bắt đầu thảo luận"

### 6. SOLVING_ATTEMPT

- Investigator chọn: 1 Người chơi + 1 Means Card + 1 Clue Card
- Gửi đến Pháp y xác nhận
- **Đúng cả 3** → Investigators WIN
- **Sai bất kỳ 1** → Badge bị khóa vĩnh viễn, người đó vẫn thảo luận được

### 7. WITNESS_HUNT

- Kích hoạt khi: Evil thắng (hết 3 rounds / hết badges) VÀ có Witness trong game
- Murderer + Accomplice bàn chọn 1 người nghi là Witness
- Đúng Witness → Evil hoàn thắng
- Sai → Evil thắng nhưng Witness sống (partial)

### 8. GAME_OVER

- Reveal tất cả vai trò
- Hiển thị lời giải thật
- Hiển thị lịch sử phá án
- Buttons: "Chơi lại" / "Về Lobby"

---

## File Structure

```
server/game/
├── DeceptionEngine.ts        [NEW]
├── DeceptionTypes.ts         [NEW]
├── DeceptionData.ts          [NEW] (từ deception.json)

app/deception/
├── page.tsx                  [NEW] Lobby
├── deception.css             [NEW] Theme
└── room/[id]/page.tsx        [NEW] Room

components/deception/
├── DeceptionMobileShell.tsx  [NEW]
├── board/
│   ├── DeceptionBoard.tsx    [NEW] Router
│   ├── DeceptionLobby.tsx    [NEW]
│   └── DeceptionGame.tsx     [NEW]
├── RoleReveal.tsx            [NEW]
├── NightPhase.tsx            [NEW]
├── SceneBoard.tsx            [NEW]
├── PlayerCards.tsx           [NEW]
├── SolvingWizard.tsx         [NEW]
├── ForensicPanel.tsx         [NEW]
├── TimerBar.tsx              [NEW]
├── PlayerList.tsx            [NEW]
├── WitnessHunt.tsx           [NEW]
└── GameOverScene.tsx         [NEW]

public/deception_roles/       [NEW] User tạo ảnh
├── forensic.webp
├── murderer.webp
├── accomplice.webp
├── witness.webp
└── investigator.webp

server.ts                     [MODIFY] Thêm DeceptionEngine
```

---

## Phân Phase Thực Hiện

### Phase 1: Foundation — Engine + Types + Data

- `DeceptionTypes.ts`
- `DeceptionData.ts` (chuyển JSON → typed constants)
- `DeceptionEngine.ts` (state machine, role assignment, card dealing, solving logic)
- `server.ts` — register `/deception` namespace
- Socket events setup

### Phase 2: Lobby + Role Reveal + Theme

- `app/deception/page.tsx` — Lobby createRoom/joinRoom
- `deception.css` — Noir dark theme
- `DeceptionMobileShell.tsx` — force landscape
- `DeceptionBoard.tsx` — state router
- `DeceptionLobby.tsx` — settings UI
- `RoleReveal.tsx` — reveal animation

#### Figma intake cho Phase 2 (2026-04-15)

- Danh sách node đầu vào: `18:2`, `18:296`, `18:508`, `18:688`, `18:903`, `18:1075`, `18:1266`, `18:1436`, `18:1689`, `18:1793`, `18:2001`, `18:2219`, `18:2438`, `18:2552`
- Trạng thái MCP: đã nạp thành công `6/14` node, sau đó chạm rate-limit của Figma Starter plan.

| Node      | Màn hình (data-name/function)             | Thuộc phase | Quyết định cho Phase 2                      |
| --------- | ----------------------------------------- | ----------- | ------------------------------------------- |
| `18:508`  | `Lobby Room` / `LobbyRoom`                | Phase 2     | **Dùng trực tiếp** cho `DeceptionLobby.tsx` |
| `18:2`    | `Scene Setup (FS)` / `SceneSetupFs`       | Phase 3     | Không làm trong Phase 2                     |
| `18:296`  | `Scene Board Popup` / `SceneBoardPopup`   | Phase 3-4   | Không làm trong Phase 2                     |
| `18:688`  | `Game Over Screen` / `GameOverScreen`     | Phase 5     | Không làm trong Phase 2                     |
| `18:903`  | `Witness Hunt Phase` / `WitnessHuntPhase` | Phase 5     | Không làm trong Phase 2                     |
| `18:1075` | `Solving Wizard` / `SolvingWizard`        | Phase 4     | Không làm trong Phase 2                     |

##### Thành phần lấy từ node `18:508` để áp vào Phase 2

- **Giữ nguyên tinh thần UI**:
  - Header lobby kiểu noir: tiêu đề lớn uppercase + subtitle trạng thái người chơi (`WAITING FOR INVESTIGATORS`, `7/12 PLAYERS READY`).
  - Player grid card style: nền tối, viền mảnh, host card nhấn đỏ, empty slot dạng dashed.
  - Settings strip đáy: timer slider + toggles `Accomplice/Witness` + nhãn variant.
  - CTA chính: nút đỏ nổi `START INVESTIGATION`.
- **Giữ cấu trúc layout**:
  - Top bar + main content + right chat fragment + bottom controls.
  - Side navigation của mockup chỉ dùng như tham chiếu hình ảnh, **không bắt buộc** trong Phase 2 nếu đã có top controls.

##### Thành phần ưu tiên không làm ở Phase 2

- Các overlay gameplay và flow giữa game: scene setup, scene board, solving wizard, witness hunt, game over.
- Chat panel full chi tiết trong `18:508` chỉ cần bản tối giản ở Phase 2 (placeholder/compact), chi tiết để Phase 4.

##### Node chưa nạp do rate-limit (pending)

- `18:1266`, `18:1436`, `18:1689`, `18:1793`, `18:2001`, `18:2219`, `18:2438`, `18:2552`
- Tạm thời bám theo `docs/deception-screens.md` cho Lobby Home + Role Reveal để không chặn tiến độ Phase 2.

##### Bổ sung từ 7 ảnh user cung cấp (không cần MCP read)

| Ảnh                              | Thuộc phase | Quyết định cho Phase 2                                                                  |
| -------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| `Lobby Home`                     | Phase 2     | **Dùng trực tiếp** cho `app/deception/page.tsx` (hero split layout + numpad + CTA)      |
| `Role Reveal`                    | Phase 2     | **Dùng trực tiếp** cho `RoleReveal.tsx` (card trung tâm + ready button + ready counter) |
| `Night Phase`                    | Phase 3     | Không làm trong Phase 2                                                                 |
| `Game Main (Investigator)`       | Phase 4     | Không làm trong Phase 2                                                                 |
| `Game Main (Forensic Scientist)` | Phase 4     | Không làm trong Phase 2                                                                 |
| `Player Cards Popup`             | Phase 4     | Không làm trong Phase 2                                                                 |
| `Solving Result Overlay`         | Phase 4-5   | Không làm trong Phase 2                                                                 |

- Sau khi nhận 7 ảnh này, phạm vi visual của Phase 2 đã đủ để triển khai mà không cần chờ đọc thêm node Figma.

##### Tái sử dụng từ Avalon để giảm effort Phase 2

- `app/avalon/page.tsx`: logic numpad + create/join room (copy/adapt cho `app/deception/page.tsx`).
- `components/avalon/MobileLandscapeShell.tsx`: khóa landscape cho mobile (copy/adapt cho `DeceptionMobileShell.tsx`).
- `components/avalon/board/AvalonBoard.tsx`: pattern socket lifecycle + state router (rút gọn cho `DeceptionBoard.tsx`).
- `components/avalon/RoleReveal.tsx`: khung reveal + ready flow (đổi visual sang noir deception).
- `app/avalon.css`: pattern token/theme class (`*-theme`, glass, glow) để tạo `deception.css` đồng nhất.

### Phase 3: Night Phase + Scene Setup

- `NightPhase.tsx` — Murderer card selection UI
- `ForensicPanel.tsx` — Scene tile marker placement
- `SceneBoard.tsx` — Scene tiles grid (readonly cho non-FS)
- Engine: card dealing, night phase, scene tile generation

### Phase 4: Discussion + Solving + Timer

- `PlayerList.tsx` — Avatar row + tap to view cards
- `PlayerCards.tsx` — Cards popup
- `TimerBar.tsx` — Countdown display
- `SolvingWizard.tsx` — 3-step wizard
- Engine: badge system, solving verification, round progression
- LiveKit voice chat integration

### Phase 5: Witness Hunt + Game Over + Polish

- `WitnessHunt.tsx`
- `GameOverScene.tsx`
- Animations, transitions
- Testing & bug fixes

---

## Image Prompts (user tự tạo)

### 1. Forensic Scientist

```
A forensic scientist in a dark crime lab, wearing a white lab coat and blue
latex gloves, examining evidence under UV light. Cold blue and purple neon
tones. Microscope and evidence bags in background. Hong Kong noir aesthetic,
dramatic cinematic lighting, digital art, portrait, 4:3.
```

### 2. Murderer

```
A mysterious figure shrouded in shadow, standing in a dimly lit Hong Kong
alleyway at night. Only silhouette and glowing eyes visible. Rain catches
red neon light. One hand concealed behind back. Dark noir thriller,
menacing atmosphere, digital art, portrait, 4:3.
```

### 3. Accomplice

```
A cunning figure leaning against a wall in a dark Hong Kong backstreet,
dark hoodie partially covering face. Holding burner phone with faint green
glow illuminating smirking expression. Shadows of venetian blinds across
face. Noir crime, muted teal and amber, digital art, portrait, 4:3.
```

### 4. Witness

```
A frightened witness peering through a gap in venetian blinds, eyes wide
with fear. Sweat on forehead, one hand gripping blinds. Blurry red and
blue police lights through window. Warm yellow interior vs cold blue
exterior. Hong Kong noir, tense, digital art, portrait, 4:3.
```

### 5. Investigator

```
A determined detective in classic trench coat, holding magnifying glass,
examining crime scene. Badge on belt. Hong Kong cityscape at night with
neon signs. Sharp eyes, confident posture. Film noir detective, golden
amber and deep blue tones, digital art, portrait, 4:3.
```

### 6. Cause of Death Tile (tím)

```
Dark purple forensic evidence board, "CAUSE OF DEATH" in bold white stencil.
Six small icons: skull, broken bone, blood drop, virus, poison, car crash.
Crime board aesthetic, deep purple background, evidence pin-board style,
digital art, 4:3.
```

### 7. Location Tile (xanh)

```
Dark green forensic evidence board, "CRIME LOCATION" in bold white stencil.
Map/blueprint with location icons: house, restaurant, school, forest.
Crime investigation board, deep emerald green, digital art, 4:3.
```

### 8. Evidence Tile (nâu)

```
Dark brown forensic evidence board, weathered texture like old detective
corkboard. Push pins and red string. Worn leather edges, coffee stains.
Crime investigation, warm sepia and brown, digital art, 4:3.
```

### 9. Game Background

```
Top-down detective desk in dark Hong Kong police station. Scattered crime
photos, evidence bags, steaming coffee, magnifying glass, case files.
Dim warm desk lamp. Noir detective, overhead perspective, photorealistic, 16:9.
```

### 10. Night Phase Background

```
Dark noir Hong Kong at midnight, heavy rain, neon signs reflected in wet
pavement. Silhouette walking away. Deep darkness with red and blue neon
reflections only. Film noir, ultra-dark, cinematic, 16:9.
```
