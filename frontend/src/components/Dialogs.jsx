import { useEffect } from "react";
import { createPortal } from "react-dom";
import useStore from "../store/useStore";
import { CallType } from "../constants";

const Backdrop = ({ children }) =>
  createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-lg">
      {children}
    </div>,
    document.body
  );

const DialogCard = ({ children }) => (
  <div className="bg-white border border-[#d5deeb] shadow-xl rounded-2xl w-[480px] max-w-[90vw] flex flex-col items-center gap-6 p-10">
    {children}
  </div>
);

const Avatar = ({ icon }) => (
  <div className="w-28 h-28 rounded-full bg-brand-gradient flex items-center justify-center">
    {icon}
  </div>
);

// ── Incoming call ─────────────────────────────────────────────────────────────
const IncomingDialog = ({ callType, onAccept, onReject }) => {
  const isVideo =
    callType === CallType.VIDEO_PERSONAL_CODE || callType === CallType.VIDEO_STRANGER;
  return (
    <Backdrop>
      <DialogCard>
        <Avatar
          icon={
            <svg className="w-12 h-12" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
              {isVideo ? (
                <path d="M23 7l-7 5 7 5V7zM1 5h15a2 2 0 012 2v10a2 2 0 01-2 2H1a2 2 0 01-2-2V7a2 2 0 012-2z" />
              ) : (
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C9.6 21 3 14.4 3 6c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
              )}
            </svg>
          }
        />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Incoming {isVideo ? "Video" : "Chat"} Call</h2>
          <p className="text-gray-500 text-sm mt-1">Someone wants to connect with you</p>
        </div>
        <div className="flex gap-4 w-full">
          <button
            onClick={onReject}
            className="flex-1 h-12 rounded-xl bg-reject-gradient text-white font-semibold text-sm hover:opacity-80 transition-opacity shadow-md"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-1 h-12 rounded-xl bg-accept-gradient text-white font-semibold text-sm hover:opacity-80 transition-opacity shadow-md"
          >
            Accept
          </button>
        </div>
      </DialogCard>
    </Backdrop>
  );
};

// ── Calling (waiting for answer) ──────────────────────────────────────────────
const CallingDialog = ({ onCancel }) => (
  <Backdrop>
    <DialogCard>
      <Avatar
        icon={
          <svg className="w-12 h-12 animate-pulse" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C9.6 21 3 14.4 3 6c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
          </svg>
        }
      />
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">Calling…</h2>
        <p className="text-gray-500 text-sm mt-1">Waiting for the other person to answer</p>
      </div>
      <button
        onClick={onCancel}
        className="w-full h-12 rounded-xl bg-reject-gradient text-white font-semibold text-sm hover:opacity-80 transition-opacity shadow-md"
      >
        Cancel
      </button>
    </DialogCard>
  </Backdrop>
);

// ── Info (rejection/not found) ────────────────────────────────────────────────
const InfoDialog = ({ title, body }) => {
  const clearDialog = useStore((s) => s.clearDialog);

  useEffect(() => {
    const t = setTimeout(clearDialog, 4000);
    return () => clearTimeout(t);
  }, [clearDialog]);

  return (
    <Backdrop>
      <DialogCard>
        <Avatar
          icon={
            <svg className="w-12 h-12" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-gray-500 text-sm mt-1">{body}</p>
        </div>
        <button
          onClick={clearDialog}
          className="w-full h-12 rounded-xl bg-brand-gradient text-white font-semibold text-sm hover:opacity-80 transition-opacity"
        >
          OK
        </button>
      </DialogCard>
    </Backdrop>
  );
};

// ── Router ─────────────────────────────────────────────────────────────────────
const Dialogs = () => {
  const dialog = useStore((s) => s.dialog);
  if (!dialog) return null;

  if (dialog.type === "incoming")
    return <IncomingDialog callType={dialog.callType} onAccept={dialog.onAccept} onReject={dialog.onReject} />;
  if (dialog.type === "calling")
    return <CallingDialog onCancel={dialog.onCancel} />;
  if (dialog.type === "info")
    return <InfoDialog title={dialog.title} body={dialog.body} />;

  return null;
};

export default Dialogs;
