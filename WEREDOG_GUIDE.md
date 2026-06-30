# Weredog Backend - Hướng Dẫn Chi Tiết

> **Game Werewolf phiên bản "Weredog"** - Backend hoàn chỉnh với Socket.io namespace `/weredog`

**📄 File này:** `d:\Xizach\xz\WEREDOG_GUIDE.md`

---

## 📋 Tổng Quan

### Những gì đã xây dựng

Đã triển khai hoàn chỉnh backend game **Weredog** (biến thể Werewolf với theme chó) gồm:

1. ✅ **WeredogTypes.ts** - Định nghĩa types, interfaces và cấu hình vai trò tập trung
2. ✅ **WeredogEngine.ts** - Game engine với state machine đầy đủ (~750 dòng code)
3. ✅ Đăng ký vào **server.ts** và **server-backend.ts**
4. ✅ Socket.io namespace `/weredog` độc lập
5. ✅ TypeScript compile success (0 errors)

### Tính năng chính

- 🎭 **8 vai trò**: Wolf (Sói), Bodyguard (Bảo vệ), Seer (Tiên tri), Hunter (Thợ săn), Cupid (Cupid), Witch (Phù thủy), Elder (Già làng), Villager (Dân)
- 🌙 **Night Phase State Machine**: Tuần tự qua từng vai trò với thứ tự ưu tiên cấu hình được
- ☀️ **Day Phase Voting**: Vote treo cổ với Elder 2 phiếu, xử lý hòa phiếu bởi host
- 🏆 **3 điều kiện thắng**: Villager (sói hết), Wolf (sói ≥ dân), Cupid (2 tình nhân sống)
- 👁️ **Role-based visibility**: Mỗi người chơi chỉ thấy thông tin phù hợp với vai trò
- 🔄 **Auto-confirm timers**: 10s tự động xác nhận nếu host không bấm
- 📊 **History tracking**: Lịch sử đầy đủ cho moderator tổng hợp sự kiện

---

## 🎨 Thiết Kế Chung (UI/UX Concept)

### 1. Bảng màu chính thức (Gothic Fairytale)

| Tên gọi | Hex | Vai trò sử dụng |
| :--- | :--- | :--- |
| **Obsidian Black** | `#0b0d11` | Background chính, nền tối nhất (màn đêm, phase Wolf) |
| **Slate Navy** | `#222a2f` | Background phụ, panel, card nền |
| **Steel Grey** | `#445257` | Border, divider, text phụ |
| **Wine Maroon** | `#3b1c26` | Accent chính — nút bấm, highlight, máu/Wolf theme |
| **Misty Blue** | `#829ea2` | Text sáng, icon, ánh trăng, hiệu ứng Seer/magic |

### 2. Prompt mô tả concept để đưa vào AI design

> **Color palette:** Gothic Fairytale — dark academia aesthetic.
> **Primary background:** obsidian black (`#0b0d11`) and slate navy (`#222a2f`), evoking moonlit stone architecture and deep night forest.
> **Accent color:** wine maroon (`#3b1c26`) for danger, blood, wolf-related elements, buttons, and warning states.
> **Secondary accent:** misty blue-grey (`#829ea2`) for moonlight glow, magic effects, seer/mystic role highlights, and readable text on dark backgrounds.
> **Neutral support:** steel grey (`#445257`) for borders, dividers, inactive states.
> 
> **Mood:** ornate gothic cathedral, climbing dark roses, candlelight flicker, medieval folklore storybook illustrated in muted desaturated tones with high contrast shadows. Romantic but foreboding atmosphere — beauty intertwined with danger.
> 
> **Texture cues:** aged stone, wrought iron filigree, vintage parchment, subtle vignette darkening at edges, soft moonlight rim-lighting on character silhouettes.

### 3. Gợi ý font chữ phù hợp

* **Heading / Logo** (giống "Dark Academia" trong ảnh):
  * `Cinzel Decorative` — chữ serif gothic trang trọng, có chân chữ sắc, hợp logo game.
  * `UnifrakturMaguntia` — kiểu blackletter cổ điển nếu muốn đậm chất Gothic hơn.
  * `Cormorant Garamond` (Bold/SemiBold) — serif thanh mảnh, sang trọng, dễ đọc hơn blackletter.
* **Body text / UI** (giống "The Black Aesthetic"):
  * `EB Garamond` — serif dễ đọc, giữ cảm giác cổ điển cho mô tả role, hướng dẫn.
  * `Crimson Text` — thay thế nhẹ nhàng hơn, hợp đoạn văn dài.
* **Số liệu / UI phụ** (timer, đếm số người chơi):
  * `Cormorant SC` (small caps) — hợp các nhãn ngắn, badge.
  * Hoặc một sans-serif tối giản như `Inter`/`Spectral` cho phần thuần UI (nút bấm, số liệu) để không bị rối mắt khi mix quá nhiều serif.

---


## 🏗️ Kiến Trúc Hệ Thống

### File Structure

```
server/game/
├── WeredogTypes.ts      (168 dòng - Types & Config)
├── WeredogEngine.ts     (750+ dòng - Game Logic)
├── AvalonEngine.ts      (Existing)
├── DeceptionEngine.ts   (Existing)
└── GameEngine.ts        (Existing)

server.ts                (Local dev)
server-backend.ts        (Production)
```

### Socket.io Namespace

Game Weredog chạy trên namespace **`/weredog`** độc lập, tách biệt hoàn toàn với:
- `/avalon` (Avalon game)
- `/deception` (Deception game)
- `/` (Default namespace cho game bài)

### Design Pattern

**WeredogEngine** tuân theo cùng pattern với **AvalonEngine** và **DeceptionEngine**:
1. Namespace riêng biệt
2. Room-based multiplayer
3. Socket event-driven
4. Per-player view obfuscation (mỗi người thấy thông tin khác nhau)
5. Host (moderator) có quyền cao nhất
6. Auto-reconnect với socket.data persistence

---

## 🎮 WeredogGameState - Giải Thích Chi Tiết

### Định nghĩa

```typescript
export type WeredogGameState =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'NIGHT_ACTION'
  | 'DAY_START'
  | 'DAY_VOTING'
  | 'GAME_OVER';
```

### Ý Nghĩa Từng State

#### 1️⃣ `LOBBY` - Phòng Chờ
**Khi nào:** Trước khi game bắt đầu
**Ai làm gì:**
- Host cấu hình game (số sói, vai trò sẽ có)
- Người chơi có thể toggle spectator/player
- Người chơi có thể đổi tên, avatar
- Host bấm "Start Game" để chuyển sang `ROLE_REVEAL`

**Frontend cần:**
- Form cấu hình settings (chỉ host thấy)
- Danh sách người chơi với nút toggle spectator
- Nút "Ready" (optional)
- Nút "Start Game" (chỉ host)

---

#### 2️⃣ `ROLE_REVEAL` - Hiện Vai Trò
**Khi nào:** Ngay sau khi host start game, trước đêm đầu tiên
**Ai làm gì:**
- Mỗi người chơi nhìn thấy vai trò của **chính mình**
- Người chơi bấm "Ready" để xác nhận đã xem xong
- Khi tất cả ready → tự động chuyển sang `NIGHT_ACTION` (đêm 1)

**Frontend cần:**
- Modal/screen hiển thị vai trò của user
- Mô tả chức năng vai trò
- Nút "Ready" / "Xác nhận"

**Lưu ý:** Host (moderator) **không có vai trò**, chỉ quan sát.

---

#### 3️⃣ `NIGHT_ACTION` - Đêm Ngủ (State Machine Core)
**Khi nào:** Mỗi đêm, luân phiên qua các vai trò theo thứ tự priority
**Ai làm gì:**

Game sẽ lần lượt gọi từng vai trò thức dậy theo thứ tự (từ `nightPriority` thấp đến cao):

**Thứ tự mặc định (đêm 1):**
1. **Cupid** (priority 10) - Chỉ đêm 1: chọn 2 người làm tình nhân
2. **Bodyguard** (priority 20) - Chọn 1 người bảo vệ (không được bảo vệ cùng người 2 đêm liên tiếp)
3. **Wolf** (priority 30) - Các sói vote chọn cắn 1 người (cần thống nhất phiếu)
4. **Seer** (priority 40) - Soi 1 người để biết Wolf/Human
5. **Witch** (priority 50) - Chọn dùng bình cứu/giết hoặc skip
6. **Hunter** (priority 60) - Ngắm bắn 1 người (hoặc giữ nguyên)

**Cơ chế hoạt động:**
- `room.currentNightActiveRole` = vai trò đang thức dậy hiện tại
- `room.currentNightRoleIndex` = index trong `room.activeNightRolesOrder`
- Mỗi vai trò thực hiện hành động → host confirm hoặc 10s auto-confirm → chuyển vai trò tiếp theo
- Khi hết roles → chuyển sang `DAY_START`

**Frontend cần:**
- Detect `room.currentNightActiveRole` để hiển thị UI tương ứng
- Nếu `me.role === room.currentNightActiveRole` → show action UI
- Nếu `me.isHost` → show confirmation button
- Nếu không phải role đó → show "Đang chờ [RoleName] hành động..."

**Ví dụ flow:**
```
Night 1:
1. Cupid wakes → selects 2 lovers → host confirms
2. Bodyguard wakes → protects someone → host confirms
3. Wolves wake → all vote → host confirms
4. Seer wakes → inspects someone → host confirms
5. Witch wakes → choose save/kill/none → host confirms
6. Hunter wakes → aims at target → host confirms
→ Advance to DAY_START

Night 2+:
(Same, but skip Cupid)
```

---

#### 4️⃣ `DAY_START` - Sáng (Công Bố Kết Quả)
**Khi nào:** Ngay sau khi night action kết thúc
**Ai làm gì:**
- Backend đã tính toán ai chết đêm qua → lưu vào `room.deathsThisNight[]`
- Frontend hiển thị thông báo: "Đêm qua có X người chết: [tên]"
- **KHÔNG lộ vai trò** người chết (chỉ lộ khi game over)
- Người chơi có thể thảo luận (chat)
- Sau đó bắt đầu vote → chuyển sang `DAY_VOTING`

**Frontend cần:**
- Hiển thị số người chết + tên
- Chat box để thảo luận
- Countdown timer (optional)
- Người chơi còn sống có thể bắt đầu vote

---

#### 5️⃣ `DAY_VOTING` - Vote Ban Ngày
**Khi nào:** Sau `DAY_START`, người chơi vote treo cổ
**Ai làm gì:**
- Mỗi người còn sống vote chọn 1 người hoặc "Skip"
- **Già làng (Elder)** vote được tính **2 phiếu** (nhưng không công khai)
- Host có thể confirm vote sớm hoặc đợi 10s auto-confirm
- Khi tất cả vote xong:
  - **1 người cao nhất** → treo cổ người đó → check win → night hoặc game over
  - **Hòa phiếu** → `room.tiebreakerActive = true` → host quyết định "revote" hoặc "skip"

**Frontend cần:**
- Vote UI: Danh sách người chơi còn sống + nút "Skip"
- Hiển thị ai đã vote (nhưng không hiển thị vote ai)
- Nút confirm (chỉ host)
- Nếu `room.tiebreakerActive === true` → host chọn "Revote" hoặc "Skip"

---

#### 6️⃣ `GAME_OVER` - Kết Thúc
**Khi nào:** Khi có phe thắng
**Ai làm gì:**
- `room.winner` = `"Villager"` | `"Wolf"` | `"Cupid"` | `"Abandoned"`
- Tất cả vai trò được công khai
- Lịch sử đầy đủ được hiển thị
- Host có thể bấm "Return to Lobby" để reset game

**Frontend cần:**
- Màn hình victory/defeat với animation
- Hiển thị vai trò của tất cả người chơi
- Lịch sử sự kiện (optional)
- Nút "Play Again" (return to lobby)

---

## 📡 Socket Events - Frontend Integration Guide

### Kết Nối Namespace

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3000/weredog', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('Connected to Weredog namespace:', socket.id);
});

socket.on('stateUpdate', (room: WeredogRoom) => {
  console.log('Room state updated:', room);
  // Update your React/Vue state here
});

socket.on('weredogError', (message: string) => {
  console.error('Error:', message);
  alert(message);
});
```

---

### 1. Lobby & Room Management

#### ✅ Check Room Exists
```typescript
socket.emit('checkRoom', roomId, (exists: boolean) => {
  if (exists) {
    // Room exists, can join
  } else {
    // Room not found
  }
});
```

#### ✅ Create Room
```typescript
socket.emit('createRoom', roomId, (success: boolean) => {
  if (success) {
    console.log('Room created:', roomId);
  } else {
    console.error('Room already exists');
  }
});
```

#### ✅ Join Room
```typescript
socket.emit('joinRoom', {
  roomId: 'ABC123',
  playerName: 'Player1',
  userId: 'unique-browser-id', // localStorage persistent ID
  avatarUrl: 'https://...' // optional
});

// After joining, you'll receive stateUpdate
```

#### ✅ Leave Room (Explicit)
```typescript
// Note: disconnect is handled automatically
// But you can explicitly leave:
socket.disconnect();
```

---

### 2. Lobby Actions

#### ✅ Update Settings (Host only)
```typescript
socket.emit('updateSettings', {
  wolfCount: 2,
  enabledRoles: ['Witch', 'Seer', 'Hunter', 'Cupid'],
  discussionTimeSeconds: 180
});
```

#### ✅ Toggle Spectator
```typescript
// Switch between player/spectator mode
socket.emit('toggleSpectatorLobby');
```

#### ✅ Change Name
```typescript
socket.emit('changeName', 'NewPlayerName');
```

#### ✅ Update Avatar
```typescript
socket.emit('updateAvatar', 'https://avatar-url.com/img.png');
// or null to remove
socket.emit('updateAvatar', null);
```

#### ✅ Transfer Host
```typescript
// Host transfers host role to another player
socket.emit('transferHost', targetUserId);
```

#### ✅ Start Game (Host only)
```typescript
socket.emit('startGame');
// Room will transition to ROLE_REVEAL
```

---

### 3. Role Reveal Phase

#### ✅ Player Ready
```typescript
// After seeing your role, click ready
socket.emit('playerReady');
// When all players ready → game starts night 1
```

---

### 4. Night Phase Actions

#### 🐺 Wolf Vote
```typescript
// Vote to bite a target
socket.emit('wolfVote', targetUserId);
```

#### 🐺 Wolf Revote (Before host confirms)
```typescript
// Reset all wolf votes
socket.emit('wolfRevote');
```

#### 🛡️ Bodyguard Protect
```typescript
// Protect someone (cannot be same person 2 nights in row)
socket.emit('bodyguardProtect', targetUserId);
```

#### 🔮 Seer Inspect
```typescript
// Inspect someone to see if Wolf/Human
socket.emit('seerInspect', targetUserId);
// Result will be in room.seerResult (only seer can see)
```

#### 🎯 Hunter Aim
```typescript
// Aim at someone (if hunter dies, this person dies too)
socket.emit('hunterAim', targetUserId);
```

#### 💘 Cupid Pair (Night 1 only)
```typescript
// Pair 2 players as lovers
socket.emit('cupidPair', {
  userId1: 'player1-id',
  userId2: 'player2-id'
});
```

#### 🧪 Witch - Step 1: Choose Action
```typescript
// Choose what to do this night
socket.emit('witchChooseAction', 'save'); // or 'kill' or 'none'
```

#### 🧪 Witch - Step 2: Use Potion
```typescript
// After choosing 'save' or 'kill', specify target
// For 'save': targetUserId is automatic (the bitten person)
// For 'kill': provide targetUserId
socket.emit('witchUsePotion', targetUserId);

// If chose 'save' and no one was bitten:
// Backend auto-skips, witch doesn't lose potion
```

#### ✅ Host Confirm Night Action
```typescript
// Host confirms current role's action
socket.emit('hostConfirmNightAction');
// Advances to next role or morning
```

---

### 5. Day Phase Actions

#### 🗳️ Day Vote
```typescript
// Vote to hang someone or skip
socket.emit('dayVote', targetUserId); // or 'skip'
```

#### ✅ Host Confirm Day Vote
```typescript
// Host confirms vote tally
socket.emit('hostConfirmDayVote');
```

#### ⚖️ Host Tiebreaker Decision
```typescript
// If room.tiebreakerActive === true
// Host decides: revote or skip
socket.emit('hostTiebreakerDecision', 'revote'); // or 'skip'
```

---

### 6. Game Over & Reset

#### 🔄 Return to Lobby (Host only)
```typescript
socket.emit('returnToLobby');
// Resets game, back to LOBBY state
```

---

### 7. Chat

#### 💬 Send Chat Message
```typescript
socket.emit('chatMessage', 'Hello everyone!');
```

---

### 8. Ping (Optional for latency display)

#### 📶 Measure Ping
```typescript
const startTime = Date.now();
socket.emit('measurePing', startTime, (timestamp: number) => {
  const ping = Date.now() - timestamp;
  console.log('Ping:', ping, 'ms');
});
```

#### 📶 Update Ping (Broadcast to others)
```typescript
// Send your ping to others in room
socket.emit('updatePing', myUserId, pingMs);

// Listen for others' ping
socket.on('playerPing', (userId: string, ping: number) => {
  console.log(`Player ${userId} ping: ${ping}ms`);
});
```

---

## 🎯 Frontend Implementation Checklist

### React/Vue Component Structure (Example)

```
components/weredog/
├── WeredogLobby.tsx          // LOBBY state
├── WeredogRoleReveal.tsx     // ROLE_REVEAL state
├── WeredogNight.tsx          // NIGHT_ACTION state
│   ├── WolfVoteUI.tsx
│   ├── BodyguardProtectUI.tsx
│   ├── SeerInspectUI.tsx
│   ├── HunterAimUI.tsx
│   ├── CupidPairUI.tsx
│   ├── WitchPotionUI.tsx
│   └── HostConfirmButton.tsx
├── WeredogDay.tsx            // DAY_START + DAY_VOTING
│   ├── DeathAnnouncement.tsx
│   ├── VoteUI.tsx
│   └── TiebreakerUI.tsx
├── WeredogGameOver.tsx       // GAME_OVER state
└── WeredogChat.tsx           // Chat component (all states)
```

### State Router Example (React)

```typescript
// WeredogGame.tsx
import { useEffect, useState } from 'react';
import type { WeredogRoom } from '@/types/weredog';

export default function WeredogGame({ socket, roomId, userId }) {
  const [room, setRoom] = useState<WeredogRoom | null>(null);

  useEffect(() => {
    socket.on('stateUpdate', (updatedRoom: WeredogRoom) => {
      setRoom(updatedRoom);
    });

    return () => socket.off('stateUpdate');
  }, [socket]);

  if (!room) return <div>Loading...</div>;

  // State router
  switch (room.state) {
    case 'LOBBY':
      return <WeredogLobby socket={socket} room={room} userId={userId} />;
    case 'ROLE_REVEAL':
      return <WeredogRoleReveal socket={socket} room={room} userId={userId} />;
    case 'NIGHT_ACTION':
      return <WeredogNight socket={socket} room={room} userId={userId} />;
    case 'DAY_START':
    case 'DAY_VOTING':
      return <WeredogDay socket={socket} room={room} userId={userId} />;
    case 'GAME_OVER':
      return <WeredogGameOver socket={socket} room={room} userId={userId} />;
    default:
      return <div>Unknown state</div>;
  }
}
```

---

### Night Phase Router Example

```typescript
// WeredogNight.tsx
export default function WeredogNight({ socket, room, userId }) {
  const me = room.players.find(p => p.userId === userId);
  const currentRole = room.currentNightActiveRole;

  // Check if it's my turn
  const isMyTurn = me?.role === currentRole && me?.isAlive;
  const isHost = me?.isHost;

  return (
    <div className="night-phase">
      <h1>🌙 Đêm {room.nightNumber}</h1>
      
      {/* Role action UI */}
      {isMyTurn && (
        <>
          {currentRole === 'Wolf' && <WolfVoteUI socket={socket} room={room} me={me} />}
          {currentRole === 'Bodyguard' && <BodyguardProtectUI socket={socket} room={room} me={me} />}
          {currentRole === 'Seer' && <SeerInspectUI socket={socket} room={room} me={me} />}
          {currentRole === 'Hunter' && <HunterAimUI socket={socket} room={room} me={me} />}
          {currentRole === 'Cupid' && <CupidPairUI socket={socket} room={room} me={me} />}
          {currentRole === 'Witch' && <WitchPotionUI socket={socket} room={room} me={me} />}
        </>
      )}

      {/* Waiting message */}
      {!isMyTurn && !isHost && (
        <div className="waiting">
          <p>Đang chờ {getRoleDisplayName(currentRole)} hành động...</p>
        </div>
      )}

      {/* Host confirm button */}
      {isHost && (
        <button onClick={() => socket.emit('hostConfirmNightAction')}>
          Xác nhận {getRoleDisplayName(currentRole)}
        </button>
      )}
    </div>
  );
}
```

---

## 🎨 Role-Specific UI Implementation

### Wolf Vote UI

```typescript
function WolfVoteUI({ socket, room, me }) {
  const [selected, setSelected] = useState<string | null>(null);

  const targets = room.players.filter(p => 
    p.isAlive && p.role !== 'Wolf' && !p.isHost
  );

  const myVote = room.wolfVotes[me.userId];
  const allWolves = room.players.filter(p => p.role === 'Wolf' && p.isAlive);
  const votedWolves = allWolves.filter(w => room.wolfVotes[w.userId]);
  const canRevote = room.wolfVictimUserId !== undefined; // Locked vote

  const handleVote = () => {
    if (selected) socket.emit('wolfVote', selected);
  };

  const handleRevote = () => {
    socket.emit('wolfRevote');
  };

  return (
    <div className="wolf-vote">
      <h2>🐺 Sói Cắn</h2>
      <p>Chọn người để cắn (vote cùng với sói khác)</p>
      
      {/* Show who already voted */}
      <div className="vote-status">
        {allWolves.map(w => (
          <span key={w.userId}>
            {w.name} {room.wolfVotes[w.userId] ? '✓' : '⏳'}
          </span>
        ))}
      </div>

      {/* Target selection */}
      {!myVote ? (
        <div className="targets">
          {targets.map(p => (
            <button
              key={p.userId}
              className={selected === p.userId ? 'selected' : ''}
              onClick={() => setSelected(p.userId)}
            >
              {p.name}
            </button>
          ))}
          <button onClick={handleVote} disabled={!selected}>
            Vote
          </button>
        </div>
      ) : (
        <div className="voted">
          <p>Bạn đã vote: {room.players.find(p => p.userId === myVote)?.name}</p>
          {canRevote && (
            <button onClick={handleRevote}>Revote (reset tất cả)</button>
          )}
        </div>
      )}

      {/* Show vote result if locked */}
      {room.wolfVictimUserId && (
        <div className="result">
          <p>✅ Mục tiêu: {room.players.find(p => p.userId === room.wolfVictimUserId)?.name}</p>
          <p className="hint">Chờ host xác nhận...</p>
        </div>
      )}
      {room.wolfVictimUserId === null && (
        <div className="result">
          <p>❌ Hòa phiếu - Không ai chết</p>
        </div>
      )}
    </div>
  );
}
```

---

### Witch Potion UI

```typescript
function WitchPotionUI({ socket, room, me }) {
  const [action, setAction] = useState<'save' | 'kill' | 'none' | null>(null);
  const [killTarget, setKillTarget] = useState<string | null>(null);

  const hasSave = me.witchHasSaveBottle;
  const hasKill = me.witchHasKillBottle;
  const wolfVictim = room.wolfVictimUserId; // Only visible after choosing 'save'

  const handleChooseAction = (act: 'save' | 'kill' | 'none') => {
    setAction(act);
    socket.emit('witchChooseAction', act);
  };

  const handleUsePotion = () => {
    if (action === 'save') {
      socket.emit('witchUsePotion'); // Save the wolfVictim automatically
    } else if (action === 'kill' && killTarget) {
      socket.emit('witchUsePotion', killTarget);
    }
  };

  const targets = room.players.filter(p => p.isAlive && p.userId !== me.userId);

  return (
    <div className="witch-potion">
      <h2>🧪 Phù Thủy</h2>
      
      {/* Step 1: Choose action */}
      {!action && (
        <div className="actions">
          <button onClick={() => handleChooseAction('save')} disabled={!hasSave}>
            💚 Cứu {!hasSave && '(đã dùng)'}
          </button>
          <button onClick={() => handleChooseAction('kill')} disabled={!hasKill}>
            💀 Giết {!hasKill && '(đã dùng)'}
          </button>
          <button onClick={() => handleChooseAction('none')}>
            ⏭️ Skip
          </button>
        </div>
      )}

      {/* Step 2a: Save potion - reveal victim */}
      {action === 'save' && wolfVictim && (
        <div className="save-confirm">
          <p>Người bị cắn: <strong>{room.players.find(p => p.userId === wolfVictim)?.name}</strong></p>
          <button onClick={handleUsePotion}>Xác nhận cứu</button>
          <button onClick={() => setAction(null)}>Hủy</button>
        </div>
      )}

      {/* Step 2b: Kill potion - select target */}
      {action === 'kill' && (
        <div className="kill-select">
          <p>Chọn người để giết:</p>
          <div className="targets">
            {targets.map(p => (
              <button
                key={p.userId}
                className={killTarget === p.userId ? 'selected' : ''}
                onClick={() => setKillTarget(p.userId)}
              >
                {p.name}
              </button>
            ))}
          </div>
          <button onClick={handleUsePotion} disabled={!killTarget}>
            Xác nhận giết
          </button>
          <button onClick={() => setAction(null)}>Hủy</button>
        </div>
      )}

      {/* Skip confirmed */}
      {action === 'none' && (
        <p>Bạn đã skip lượt này.</p>
      )}
    </div>
  );
}
```

---

## 🔄 Complete Game Flow Examples

### Example 1: Night 1 với Cupid

```
1. Room state = LOBBY
2. Host clicks "Start Game"
   → Backend assigns roles
   → state = ROLE_REVEAL

3. Players see their roles, click "Ready"
   → When all ready: state = NIGHT_ACTION, nightNumber = 1

4. Night 1 sequence:
   a. currentNightActiveRole = "Cupid"
      - Cupid selects 2 players
      - socket.emit('cupidPair', { userId1, userId2 })
      - Host confirms or 10s auto
      → currentNightActiveRole = "Bodyguard"

   b. currentNightActiveRole = "Bodyguard"
      - Bodyguard protects someone
      - socket.emit('bodyguardProtect', userId)
      → currentNightActiveRole = "Wolf"

   c. currentNightActiveRole = "Wolf"
      - All wolves vote
      - When all voted → wolfVictimUserId set
      → currentNightActiveRole = "Seer"

   d. currentNightActiveRole = "Seer"
      - Seer inspects someone
      - seerResult = "Wolf" or "Human"
      → currentNightActiveRole = "Witch"

   e. currentNightActiveRole = "Witch"
      - Witch chooses action
      - If save → sees wolfVictimUserId → confirms
      → currentNightActiveRole = "Hunter"

   f. currentNightActiveRole = "Hunter"
      - Hunter aims at someone
      → currentNightActiveRole = undefined

5. Backend resolves morning:
   - Calculate deaths (wolf bite, witch kill, bodyguard protection)
   - Check hunter trigger
   - Check cupid heartbreak
   → state = DAY_START

6. Frontend shows death announcement
   → Players discuss
   → Start voting

7. state = DAY_VOTING
   - Players vote
   - Tally with Elder 2 votes
   → If tie: tiebreakerActive = true, host decides
   → Else: hang the person

8. Check win condition:
   - If winner exists → state = GAME_OVER
   - Else → beginNight (Night 2)
```

---

## 🐛 Troubleshooting & Common Issues

### Issue 1: "Room not found" after reconnect
**Cause:** Socket reconnected but didn't rejoin room  
**Fix:** On `connect` event, always emit `joinRoom` again:

```typescript
socket.on('connect', () => {
  const savedRoomId = localStorage.getItem('weredog_room');
  const savedUserId = localStorage.getItem('weredog_user');
  if (savedRoomId && savedUserId) {
    socket.emit('joinRoom', {
      roomId: savedRoomId,
      playerName: localStorage.getItem('weredog_name'),
      userId: savedUserId,
      avatarUrl: localStorage.getItem('weredog_avatar')
    });
  }
});
```

---

### Issue 2: Wolf can't see wolfVictimUserId
**Cause:** Per-player view obfuscation hides it from non-wolves  
**Fix:** Check `me.role === 'Wolf'` before accessing `room.wolfVictimUserId`

---

### Issue 3: Witch doesn't see who was bitten
**Cause:** Witch only sees `wolfVictimUserId` AFTER choosing 'save'  
**Flow:**
1. Witch picks action: `witchChooseAction('save')`
2. Backend sends updated room with `wolfVictimUserId` visible to witch
3. Witch UI shows victim name
4. Witch confirms: `witchUsePotion()`

---

### Issue 4: Elder death doesn't disable roles
**Cause:** Frontend not checking `isElderDead` flag  
**Fix:** Backend automatically skips non-wolf roles when elder is dead. Frontend just needs to show correct UI based on `currentNightActiveRole`.

---

### Issue 5: Cupid lovers don't know each other
**Cause:** `room.cupidLoverUserIds` is obfuscated for non-lovers  
**Fix:** Check `me.isLover` and `me.loverUserId`:

```typescript
if (me.isLover && me.loverUserId) {
  const lover = room.players.find(p => p.userId === me.loverUserId);
  console.log('Your lover:', lover.name);
}
```

---

## 📚 FAQ

**Q: Host có vai trò trong game không?**  
A: **Không**. Host là moderator, chỉ xem và điều khiển flow. Host không tham gia chơi.

**Q: Có thể thêm vai trò mới không?**  
A: **Có**. Chỉ cần:
1. Thêm role vào `WeredogRole` type trong `WeredogTypes.ts`
2. Thêm config vào `ROLE_CONFIGS` với `nightPriority`
3. Thêm handler trong `WeredogEngine.ts` (nếu có night action)
4. Frontend tự động nhận được role mới qua `stateUpdate`

**Q: Làm sao để test game với 1 người?**  
A: Mở nhiều tab browser với userId khác nhau. Hoặc dùng incognito mode.

**Q: Auto-confirm timer 10s có thể thay đổi không?**  
A: Có, sửa `10000` trong `setAutoConfirmTimer()` calls trong `WeredogEngine.ts`.

**Q: Có thể pause game giữa chừng không?**  
A: Hiện tại không có pause. Nhưng có thể thêm bằng cách:
- Thêm `paused: boolean` vào `WeredogRoom`
- Thêm socket event `pauseGame` / `resumeGame`
- Clear auto-timers khi pause

**Q: Lịch sử game lưu ở đâu?**  
A: `room.history[]` array chứa tất cả night actions. Host thấy đầy đủ, players chỉ thấy actions của mình.

**Q: Frontend cần copy types từ backend không?**  
A: **Nên copy** hoặc dùng shared package. Copy `WeredogTypes.ts` sang frontend để có TypeScript autocomplete.

---

## 🎯 Best Practices

### 1. User ID Persistence
```typescript
// Generate once, save to localStorage
let userId = localStorage.getItem('weredog_user_id');
if (!userId) {
  userId = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem('weredog_user_id', userId);
}
```

### 2. Socket Reconnection Handling
```typescript
socket.on('disconnect', () => {
  console.log('Disconnected, will auto-reconnect...');
  // Show "Reconnecting..." UI
});

socket.on('connect', () => {
  console.log('Reconnected, rejoining room...');
  // Auto rejoin room
  socket.emit('joinRoom', { roomId, userId, playerName, avatarUrl });
});
```

### 3. State Validation
```typescript
// Always validate room state before rendering
if (!room || !room.state) {
  return <LoadingScreen />;
}

const me = room.players.find(p => p.userId === userId);
if (!me) {
  return <ErrorScreen message="You're not in this room" />;
}
```

### 4. Error Handling
```typescript
socket.on('weredogError', (message: string) => {
  toast.error(message); // Use toast notification
  console.error('[Weredog Error]', message);
});
```

### 5. Role Display Names (i18n-ready)
```typescript
const ROLE_NAMES = {
  Wolf: 'Chó Sói',
  Bodyguard: 'Chó Bảo Vệ',
  Seer: 'Chó Tiên Tri',
  Hunter: 'Chó Thợ Săn',
  Cupid: 'Chó Cupid',
  Witch: 'Chó Phù Thủy',
  Elder: 'Chó Già',
  Villager: 'Chó Dân',
};
```

---

## ✅ Implementation Checklist

- [ ] Setup Socket.io client connecting to `/weredog`
- [ ] Create state router component (LOBBY / ROLE_REVEAL / NIGHT / DAY / GAME_OVER)
- [ ] Implement Lobby UI (settings, player list, start button)
- [ ] Implement Role Reveal UI (show role, ready button)
- [ ] Implement Night Phase UI (role-specific action UIs)
- [ ] Implement Day Phase UI (death announcement, voting)
- [ ] Implement Game Over UI (winner, roles reveal)
- [ ] Implement Chat component (all states)
- [ ] Add reconnection logic (localStorage persistence)
- [ ] Add error handling (weredogError event)
- [ ] Test with multiple players (multi-tab or multiple devices)
- [ ] Test all roles work correctly
- [ ] Test win conditions (Villager, Wolf, Cupid)
- [ ] Test Elder death disabling roles
- [ ] Test Hunter trigger on death
- [ ] Test Cupid heartbreak
- [ ] Add UI polish (animations, sounds, visual feedback)

---

## 📞 Support & Contact

**Backend Files:**
- [WeredogTypes.ts](file:///d:/Xizach/xz/server/game/WeredogTypes.ts)
- [WeredogEngine.ts](file:///d:/Xizach/xz/server/game/WeredogEngine.ts)
- [server.ts](file:///d:/Xizach/xz/server.ts)
- [server-backend.ts](file:///d:/Xizach/xz/server-backend.ts)

**Documentation:**
- This file: [WEREDOG_GUIDE.md](file:///d:/Xizach/xz/WEREDOG_GUIDE.md)

---

**🎉 Happy Coding! Chúc bạn code vui vẻ!**
