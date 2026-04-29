import { useRef } from "react";
import useStore from "./store/useStore";
import { useSocket, emitGetStrangerId } from "./hooks/useSocket";
import useWebRTC from "./hooks/useWebRTC";
import useMediaStream from "./hooks/useMediaStream";
import Dashboard from "./components/Dashboard";
import VideoPanel from "./components/VideoPanel";
import ChatPanel from "./components/ChatPanel";
import Dialogs from "./components/Dialogs";

const App = () => {
  const setSocketId = useStore((s) => s.setSocketId);
  const pendingStrangerCallType = useRef(null);

  const webrtc = useWebRTC();

  useSocket({
    onConnect: (id) => setSocketId(id),
    onPreOffer: (data) => webrtc.handlePreOffer(data),
    onPreOfferAnswer: (data) => webrtc.handlePreOfferAnswer(data),
    onWebRTCSignaling: (data) => webrtc.handleWebRTCSignaling(data),
    onUserHangedUp: () => webrtc.handleRemoteHangUp(),
    onStrangerSocketId: (data) => {
      const callType = pendingStrangerCallType.current;
      if (data.randomStrangerSocketId && callType) {
        webrtc.sendPreOffer(callType, data.randomStrangerSocketId);
      } else {
        useStore.getState().setDialog({
          type: "info",
          title: "No Stranger Available",
          body: "No one is available right now. Try again later.",
        });
      }
    },
  });

  useMediaStream();

  const handleStrangerCall = (callType) => {
    pendingStrangerCallType.current = callType;
    emitGetStrangerId();
  };

  const activeCallType = webrtc.connectedUserRef.current?.callType ?? null;

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-gray-100">
      <Dashboard
        onPersonalCodeCall={webrtc.sendPreOffer}
        onStrangerCall={handleStrangerCall}
      />
      <VideoPanel
        callType={activeCallType}
        onHangUp={webrtc.handleHangUp}
        onToggleMic={webrtc.toggleMic}
        onToggleCamera={webrtc.toggleCamera}
        onToggleScreen={webrtc.toggleScreenShare}
      />
      <ChatPanel onSend={webrtc.sendMessage} />
      <Dialogs />
    </div>
  );
};

export default App;
