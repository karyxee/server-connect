import { useState } from "react";
import useStore from "../store/useStore";
import { CallType, CallState } from "../constants";
import { emitStrangerStatus } from "../hooks/useSocket";

const Dashboard = ({ onPersonalCodeCall, onStrangerCall }) => {
  const [inputCode, setInputCode] = useState("");
  const { socketId, allowStrangers, setAllowStrangers, callState, localStream } = useStore();

  const canVideo = callState === CallState.AVAILABLE;
  const canChat =
    callState === CallState.AVAILABLE || callState === CallState.AVAILABLE_CHAT_ONLY;

  const copyCode = () => {
    if (socketId) navigator.clipboard?.writeText(socketId).catch(() => {});
  };

  const toggleStranger = () => {
    const next = !allowStrangers;
    setAllowStrangers(next);
    emitStrangerStatus(next);
  };

  const callStranger = (callType) => {
    onStrangerCall(callType);
  };

  return (
    <aside className="flex flex-col justify-between w-[300px] min-w-[260px] max-w-[400px] h-full bg-brand-gradient text-white font-sans relative">
      {/* Logo */}
      <div className="flex flex-col items-center pt-8 pb-4 px-5">
        <div className="text-2xl font-bold tracking-wide mb-1">Server Connect</div>
        <div className="text-sm opacity-70">Peer-to-peer video &amp; chat</div>
      </div>

      {/* Personal code */}
      <div className="mx-5 bg-white/20 rounded-2xl px-5 py-4">
        <p className="text-sm font-medium mb-1 opacity-80">Your personal code</p>
        <div className="flex justify-between items-center">
          <span className="font-bold text-base truncate max-w-[170px]" title={socketId}>
            {socketId ?? "Connecting…"}
          </span>
          <button
            onClick={copyCode}
            title="Copy code"
            className="w-9 h-9 rounded-lg bg-white flex items-center justify-center hover:opacity-70 transition-opacity"
          >
            <svg className="w-4 h-4 text-brand-dark" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Connect via personal code */}
      <div className="mx-5">
        <p className="text-base font-medium mb-3">Connect with code</p>
        <input
          className="w-full bg-white/20 border border-white/50 rounded-lg px-4 py-2 text-white placeholder-white/60 focus:outline-none text-sm"
          placeholder="Enter personal code"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
        />
        <div className="flex gap-2 mt-3">
          <button
            disabled={!canChat || !inputCode.trim()}
            onClick={() => onPersonalCodeCall(CallType.CHAT_PERSONAL_CODE, inputCode.trim())}
            className="flex-1 h-12 bg-white text-brand-dark rounded-xl font-semibold text-sm hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            Chat
          </button>
          <button
            disabled={!canVideo || !inputCode.trim() || !localStream}
            onClick={() => onPersonalCodeCall(CallType.VIDEO_PERSONAL_CODE, inputCode.trim())}
            className="flex-1 h-12 bg-white text-brand-dark rounded-xl font-semibold text-sm hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            Video
          </button>
        </div>
      </div>

      {/* Stranger connect */}
      <div className="mx-5">
        <p className="text-base font-medium mb-3">Random stranger</p>
        <div className="flex gap-2">
          <button
            disabled={!canChat}
            onClick={() => callStranger(CallType.CHAT_STRANGER)}
            className="flex-1 h-12 bg-white text-brand-dark rounded-xl font-semibold text-sm hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            Chat
          </button>
          <button
            disabled={!canVideo || !localStream}
            onClick={() => callStranger(CallType.VIDEO_STRANGER)}
            className="flex-1 h-12 bg-white text-brand-dark rounded-xl font-semibold text-sm hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            Video
          </button>
        </div>
      </div>

      {/* Allow strangers checkbox */}
      <div className="mx-5 mb-6 flex items-center gap-3">
        <button
          onClick={toggleStranger}
          className="w-7 h-7 border border-white/50 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0"
        >
          {allowStrangers && (
            <svg className="w-4 h-4" fill="none" stroke="white" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <span className="text-sm font-medium">Allow strangers to connect</span>
      </div>
    </aside>
  );
};

export default Dashboard;
