# Server Connect — Claude Context

## What this project is

A WebRTC peer-to-peer video/chat app. The backend is a **signaling-only** server — it never touches audio or video data. All media flows directly between browsers.

## Architecture

```
Browser A  ──socket.io──▶  FastAPI backend  ◀──socket.io──  Browser B
    │                         (signaling)                        │
    └────────────────── WebRTC (P2P) ───────────────────────────┘
```

The signaling flow: pre-offer handshake → CALL_ACCEPTED → WebRTC offer/answer → ICE candidates → direct P2P connection.

## Running locally

```sh
# Terminal 1
cd backend && python main.py

# Terminal 2
cd frontend && npm run dev
```

Vite proxies `/socket.io` to `:8000`. No CORS or cross-origin config needed in dev.

## Key files

| File | Responsibility |
|---|---|
| `backend/main.py` | All Socket.IO event handlers and FastAPI app |
| `frontend/src/hooks/useWebRTC.js` | RTCPeerConnection lifecycle, ICE, data channel, media controls |
| `frontend/src/hooks/useSocket.js` | Socket.IO connection singleton + emit helpers |
| `frontend/src/store/useStore.js` | Global Zustand state (socketId, streams, callState, dialog, messages) |
| `frontend/src/App.jsx` | Wires socket events → WebRTC handlers, owns stranger call flow |

## Socket.IO event contract

All events use **hyphenated names** (e.g. `pre-offer`, not `pre_offer`). The backend uses `@sio.on("event-name")` — NOT `@sio.event` — for all hyphenated events. `connect` and `disconnect` are the only events that use `@sio.event`.

| Direction | Event | Payload |
|---|---|---|
| client → server | `pre-offer` | `{ callType, calleePersonalCode }` |
| server → client | `pre-offer` | `{ callType, callerSocketId }` |
| client → server | `pre-offer-answer` | `{ callerSocketId, preOfferAnswer }` |
| server → client | `pre-offer-answer` | same |
| client ↔ server | `webRTC-signaling` | `{ connectedUserSocketId, type, offer/answer/candidate }` |
| client → server | `user-hanged-up` | `{ connectedUserSocketId }` |
| server → client | `user-hanged-up` | _(no payload)_ |
| client → server | `stranger-connection-status` | `{ status: bool }` |
| client → server | `get-stranger-socket-id` | _(no payload)_ |
| server → client | `stranger-socket-id` | `{ randomStrangerSocketId: string \| null }` |

## Call state machine

```
AVAILABLE_CHAT_ONLY  (no camera)
       │  camera granted
       ▼
   AVAILABLE  ──── outgoing/incoming call ────▶  UNAVAILABLE
       ▲                                               │
       └──────────── hang up / reject ────────────────┘
```

## Known limitations

- **No TURN server** — calls behind symmetric NAT (some corporate/mobile networks) will fail silently. Add a TURN server to `ICE_SERVERS` in `frontend/src/constants.js` to fix.
- **No auth** — socket IDs are the only identity mechanism.
- **In-memory state** — restarting the backend disconnects all clients.

## Adding a TURN server

In `frontend/src/constants.js`:
```js
export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: "turn:your-turn-server.example.com",
    username: "user",
    credential: "password",
  },
];
```
