import os
import random
import logging
from dotenv import load_dotenv
import socketio
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

PORT = int(os.getenv("PORT", 8000))

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
)

app = FastAPI()

# Serve built React app in production
_frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(_frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(_frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        return FileResponse(os.path.join(_frontend_dist, "index.html"))


connected_peers: set[str] = set()
stranger_peers: set[str] = set()


@sio.event
async def connect(sid, environ):
    connected_peers.add(sid)
    log.info("connect sid=%s total=%d", sid, len(connected_peers))


@sio.event
async def disconnect(sid):
    connected_peers.discard(sid)
    stranger_peers.discard(sid)
    log.info("disconnect sid=%s total=%d", sid, len(connected_peers))


@sio.on("pre-offer")
async def pre_offer(sid, data):
    callee_id = data.get("calleePersonalCode")
    call_type = data.get("callType")
    if callee_id in connected_peers:
        await sio.emit("pre-offer", {"callerSocketId": sid, "callType": call_type}, to=callee_id)
    else:
        await sio.emit("pre-offer-answer", {"preOfferAnswer": "CALLEE_NOT_FOUND"}, to=sid)


@sio.on("pre-offer-answer")
async def pre_offer_answer(sid, data):
    caller_id = data.get("callerSocketId")
    if caller_id in connected_peers:
        await sio.emit("pre-offer-answer", data, to=caller_id)


@sio.on("webRTC-signaling")
async def webrtc_signaling(sid, data):
    target_id = data.get("connectedUserSocketId")
    if target_id in connected_peers:
        await sio.emit("webRTC-signaling", data, to=target_id)


@sio.on("user-hanged-up")
async def user_hanged_up(sid, data):
    target_id = data.get("connectedUserSocketId")
    if target_id in connected_peers:
        await sio.emit("user-hanged-up", to=target_id)


@sio.on("stranger-connection-status")
async def stranger_connection_status(sid, data):
    if data.get("status"):
        stranger_peers.add(sid)
    else:
        stranger_peers.discard(sid)
    log.info("stranger pool size=%d", len(stranger_peers))


@sio.on("get-stranger-socket-id")
async def get_stranger_socket_id(sid):
    pool = [p for p in stranger_peers if p != sid]
    random_id = random.choice(pool) if pool else None
    await sio.emit("stranger-socket-id", {"randomStrangerSocketId": random_id}, to=sid)


socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:socket_app", host="0.0.0.0", port=PORT, reload=True)
