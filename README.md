# Immersive Real-Time Multiplayer Board Game Suite

A high-performance, real-time multiplayer board game platform built with **Next.js**, **Node.js**, and **Socket.io**. This suite brings popular social deduction and strategy board games—**Avalon**, **Deception**, and **Werewolf**—to the web with an authoritative server architecture, seamless state synchronization, and a highly responsive, atmospheric UI/UX.

> [!NOTE]
> This project is designed as a production-grade, portfolio-worthy application demonstrating advanced full-stack engineering, complex game engine state machines, real-time network orchestration, and modern responsive design.

---

## 🎮 Featured Games

The platform orchestrates three distinct, complex board games, each complete with its own rule engine, visual identity, and action mechanics:

1. **Avalon**: A medieval-themed Arthurian deduction game. Players are secretly assigned roles (Loyal Servants of Arthur vs. Minions of Mordred). Features include quest voting, dynamic team proposal phases, Merlin/Assassin mechanics, and real-time choice tracking.
2. **Deception (Forensic Investigation)**: An investigation mystery game set in Hong Kong. A forensic scientist guides investigators in identifying the murderer, key evidence, and means of crime through dynamic clue plaques, while the murderer attempts to deflect blame.
3. **Werewolf (Weredog - Gothic Fairytale Edition)**: A gothic-styled social deduction game featuring night-hunting active roles (Seer, Witch, Cupid, Hunter, Bodyguard, Elder) and daytime voting cycles. Includes interactive voting circles, custom role reveals, night-action modals, and host-delegation controls.

---

## 🛠️ Architecture & Technical Complexity

### 1. Server-Authoritative State Machine
To guarantee game state integrity and eliminate client-side cheating:
* **Decoupled Rule Engines**: All game transitions, roles, card decks, and voting phases are calculated and processed purely on the Node.js/Express server (`AvalonEngine.ts`, `DeceptionEngine.ts`, `WeredogEngine.ts`).
* **Deterministic Event Loop**: Game phases advance automatically based on timers or once all active players submit their socket actions.
* **Granular Validation**: The server validates client requests against the current game state and the active player's role permissions (e.g., preventing a dead Wolf from voting or an inactive role from triggering night actions).

### 2. Real-Time Network Orchestration (Socket.io)
* **Dynamic Room Allocation**: A centralized `GameEngine` orchestrator handles dynamic room creation, automated host assignment, and graceful reconnection handling.
* **State Synchronization**: Instead of transmitting the entire state database on every update, the server pushes incremental, delta-based state updates (`WeredogGameState`, etc.) to minimize network overhead and latency.
* **Bi-directional Communication**: Handled via custom Socket.io event schemas, coordinating lobby join/leave operations, chat messages, mic statuses, and role actions.

### 3. Responsive UI/UX & Proportional Scaling
* **360-Degree Interactive Layouts**: Built dynamic, responsive circular player circles (`NightPlayerCircle`, `CircularLayout`) using trigonometry to position elements along an ellipse based on the viewport size and player count.
* **Proportional Accessory Scaling**: Implemented a pixel-locked avatar wrapper ratio combined with relative coordinate mappings to ensure avatar frame accessories (`RoleAccessory`) scale down and align perfectly on all screens.
* **Viewport-Constrained Design (100vh Layouts)**: Structured layouts to fit perfectly on a single screen without scrolling. It uses dynamic grid layouts that split/stack side-by-side in mobile landscape orientation to optimize space.
* **Theme-Driven Visual Systems**: Features CSS-first design systems including metallic borders, gothic typefaces (`font-gothic-heading`), linear gradients, and dark-ambient backdrops.

### 4. Real-Time Peer-to-Peer Integration
* **Voice Signaling**: Orchestrates voice channel signaling over the active socket connection to toggle real-time speaking indicators, microphone toggles, and PeerJS connections for spatial audio.

---

## 💻 Tech Stack

* **Frontend**: Next.js (App Router), React, Tailwind CSS (v4 gradients & transitions), Zustand (Global State Management), Lucide React.
* **Backend**: Node.js, Express, Socket.io (WebSocket framework).
* **Communication & Signaling**: WebRTC, Socket-based Peer Signalling.
* **Tooling & Environments**: TypeScript, npm, Docker (Production deployment).

---

## 📁 Repository Structure

```text
├── app/                  # Next.js page routers & layouts
│   ├── avalon/           # Avalon frontend entry & views
│   ├── deception/        # Deception frontend entry & views
│   ├── weredog/          # Werewolf/Weredog entry & styles
│   └── page.tsx          # Main Game Selector Portal (Responsive 3-Column Layout)
├── components/           # Reusable UI & Game components
│   ├── weredog/          # Werewolf state UIs (Lobby, Night, Vote, Role reveal, Accessories)
│   └── store/            # Zustand store client states
├── server/               # Backend logic
│   ├── game/             # Game core mechanics & server engines
│   └── server-backend.ts # Server Express/Socket orchestration entry
├── utils/                # Helper utilities & configuration constants
└── public/               # Asset catalog (images, audio, logos)
```

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18.x or higher)
* npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd xz
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server (runs both Next.js and the custom Socket.io server):
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000` to select a game and create a room.
