# Server Connect

Real-time peer-to-peer video and chat application. Users connect via a personal code or get matched with a random stranger. All audio/video streams flow directly between browsers over WebRTC — the server only handles signaling.

## Features

- **Personal code calls** — share your code with a friend to start a video or audio call
- **Stranger matching** — opt in to the stranger pool and get paired randomly
- **Screen sharing** — switch between camera and display during a video call
- **In-call chat** — text messages over a WebRTC data channel (no server involvement)
- **Call recording** — record the remote stream and download as `.webm`

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Python · FastAPI · python-socketio · uvicorn |
| Frontend | React 18 · Vite · Tailwind CSS · Zustand |
| Real-time | Socket.IO (signaling only) |
| P2P | WebRTC (RTCPeerConnection + data channel) |

## Project Structure

```
server-connect/
├── backend/
│   ├── main.py           # FastAPI app + all Socket.IO signaling handlers
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── constants.js
    │   ├── components/   # Dashboard, VideoPanel, ChatPanel, Dialogs
    │   ├── hooks/        # useSocket, useWebRTC, useMediaStream, useRecording
    │   └── store/        # Zustand store
    ├── vite.config.js    # proxies /socket.io → backend in dev
    └── package.json
```

## Local Development

Requires Python 3.11+ and Node 18+.

**1. Backend**
```sh
cd backend
pip install -r requirements.txt
python main.py
# Listening on http://localhost:8000
```

**2. Frontend** (separate terminal)
```sh
cd frontend
npm install
npm run dev
# Opens http://localhost:5173
# /socket.io requests are proxied to :8000 automatically
```

## Production Build

```sh
cd frontend && npm run build
cd ../backend && python main.py
```

FastAPI serves the built React app from `frontend/dist/` and handles all socket connections on port 8000.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and set:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | Port the backend listens on |
