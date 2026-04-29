import { useEffect, useRef, useState } from "react";
import useStore from "../store/useStore";
import { CallType } from "../constants";
import useRecording from "../hooks/useRecording";

const MicIcon = ({ muted }) =>
  muted ? (
    <svg className="w-5 h-5" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
      <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 20v4M8 20h8" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );

const CameraIcon = ({ off }) =>
  off ? (
    <svg className="w-5 h-5" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3m3-3h6l2 3h4a2 2 0 012 2v9.34" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );

const VideoPanel = ({ callType, onHangUp, onToggleMic, onToggleCamera, onToggleScreen }) => {
  const { localStream, remoteStream, screenSharingActive } = useStore();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const recording = useRecording();

  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [recordingState, setRecordingState] = useState("idle"); // idle | recording | paused

  const isVideo =
    callType === CallType.VIDEO_PERSONAL_CODE || callType === CallType.VIDEO_STRANGER;

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleMic = () => {
    const enabled = onToggleMic();
    setMicMuted(!enabled);
  };

  const handleCamera = () => {
    const enabled = onToggleCamera();
    setCameraOff(!enabled);
  };

  const handleRecording = () => {
    if (recordingState === "idle") {
      recording.start();
      setRecordingState("recording");
    } else if (recordingState === "recording") {
      recording.pause();
      setRecordingState("paused");
    } else {
      recording.resume();
      setRecordingState("recording");
    }
  };

  const handleStopRecording = () => {
    recording.stop();
    setRecordingState("idle");
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      <div className="relative m-5 rounded-2xl overflow-hidden bg-brand-gradient flex-1">
        {/* Remote video / placeholder */}
        {isVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white/60 text-center">
              <svg className="w-20 h-20 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm font-medium">Audio call in progress</p>
            </div>
          </div>
        )}

        {/* Local video (PiP) */}
        {isVideo && localStream && (
          <div className="absolute top-3 left-3 w-36 h-36 rounded-xl border-2 border-white/40 overflow-hidden bg-black/30">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Recording indicator */}
        {recordingState !== "idle" && (
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-xl px-3 py-2">
            <span className={`w-2.5 h-2.5 rounded-full ${recordingState === "recording" ? "bg-red-500 animate-pulse" : "bg-yellow-400"}`} />
            <span className="text-white text-xs font-medium">
              {recordingState === "recording" ? "REC" : "PAUSED"}
            </span>
            <button onClick={handleRecording} className="text-white text-xs underline ml-1">
              {recordingState === "recording" ? "Pause" : "Resume"}
            </button>
            <button onClick={handleStopRecording} className="text-white text-xs underline">
              Stop
            </button>
          </div>
        )}

        {/* Call controls */}
        {callType && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3">
            {isVideo && (
              <>
                <ControlBtn onClick={handleMic} title={micMuted ? "Unmute" : "Mute"}>
                  <MicIcon muted={micMuted} />
                </ControlBtn>
                <ControlBtn onClick={handleCamera} title={cameraOff ? "Camera on" : "Camera off"}>
                  <CameraIcon off={cameraOff} />
                </ControlBtn>
                <ControlBtn onClick={onToggleScreen} title={screenSharingActive ? "Stop sharing" : "Share screen"} active={screenSharingActive}>
                  <svg className="w-5 h-5" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                </ControlBtn>
                <ControlBtn
                  onClick={handleRecording}
                  title="Record"
                  active={recordingState !== "idle"}
                >
                  <svg className="w-5 h-5" fill={recordingState !== "idle" ? "white" : "none"} stroke="white" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8" />
                    <circle cx="12" cy="12" r="3" fill="white" />
                  </svg>
                </ControlBtn>
              </>
            )}
            {/* Hang up */}
            <button
              onClick={onHangUp}
              title="Hang up"
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
            >
              <svg className="w-6 h-6 rotate-[135deg]" fill="white" viewBox="0 0 24 24">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C9.6 21 3 14.4 3 6c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ControlBtn = ({ children, onClick, title, active }) => (
  <button
    onClick={onClick}
    title={title}
    className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
      active ? "bg-white/40" : "bg-black/30 hover:bg-black/50"
    }`}
  >
    {children}
  </button>
);

export default VideoPanel;
