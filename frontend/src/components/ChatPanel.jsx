import { useEffect, useRef, useState } from "react";
import useStore from "../store/useStore";

const ChatPanel = ({ onSend }) => {
  const messages = useStore((s) => s.messages);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <aside className="flex flex-col w-[300px] min-w-[260px] max-w-[400px] h-full bg-[#f4f9fd] border-l border-[#d5deeb]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#d5deeb]">
        <h2 className="text-sm font-semibold text-gray-700">Messages</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-400 mt-8">No messages yet</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.fromSelf ? "justify-end" : "justify-start"}`}>
            <span
              className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words ${
                msg.fromSelf
                  ? "bg-brand-gradient text-white rounded-br-none"
                  : "bg-white border border-[#d5deeb] text-gray-700 rounded-bl-none"
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 bg-white border-t border-[#d5deeb]">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 border border-[#d5deeb] rounded-2xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-light"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={submit}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl bg-send-gradient flex items-center justify-center hover:opacity-80 disabled:opacity-40 transition-opacity flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ChatPanel;
