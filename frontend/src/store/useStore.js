import { create } from "zustand";
import { CallState } from "../constants";

const useStore = create((set) => ({
  socketId: null,
  callState: CallState.AVAILABLE_CHAT_ONLY,
  localStream: null,
  remoteStream: null,
  screenSharingStream: null,
  screenSharingActive: false,
  allowStrangers: false,

  // dialog state
  dialog: null, // { type: 'incoming'|'calling'|'info', ...props }

  // chat messages
  messages: [],

  setSocketId: (socketId) => set({ socketId }),
  setCallState: (callState) => set({ callState }),
  setLocalStream: (localStream) =>
    set({ localStream, callState: localStream ? CallState.AVAILABLE : CallState.AVAILABLE_CHAT_ONLY }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  setScreenSharingStream: (screenSharingStream) => set({ screenSharingStream }),
  setScreenSharingActive: (screenSharingActive) => set({ screenSharingActive }),
  setAllowStrangers: (allowStrangers) => set({ allowStrangers }),
  setDialog: (dialog) => set({ dialog }),
  clearDialog: () => set({ dialog: null }),
  addMessage: (message, fromSelf) =>
    set((s) => ({ messages: [...s.messages, { text: message, fromSelf }] })),
  clearMessages: () => set({ messages: [] }),
}));

export default useStore;
