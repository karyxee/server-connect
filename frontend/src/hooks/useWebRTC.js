import { useRef, useCallback } from "react";
import useStore from "../store/useStore";
import {
  CallType,
  CallState,
  PreOfferAnswer,
  WebRTCSignaling,
  ICE_SERVERS,
} from "../constants";
import {
  emitPreOffer,
  emitPreOfferAnswer,
  emitWebRTCSignaling,
  emitUserHangedUp,
} from "./useSocket";

const useWebRTC = () => {
  const store = useStore();
  const pcRef = useRef(null);
  const dataChannelRef = useRef(null);
  const connectedUserRef = useRef(null); // { socketId, callType }

  const isVideoCall = (callType) =>
    callType === CallType.VIDEO_PERSONAL_CODE || callType === CallType.VIDEO_STRANGER;

  const createPeerConnection = useCallback((callType) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // data channel for chat (created by caller side)
    const dc = pc.createDataChannel("chat");
    dataChannelRef.current = dc;

    // callee receives data channel
    pc.ondatachannel = (event) => {
      dataChannelRef.current = event.channel;
      event.channel.onmessage = (e) => {
        store.addMessage(e.data, false);
      };
    };

    dc.onmessage = (e) => {
      store.addMessage(e.data, false);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && connectedUserRef.current) {
        emitWebRTCSignaling({
          connectedUserSocketId: connectedUserRef.current.socketId,
          type: WebRTCSignaling.ICE_CANDIDATE,
          candidate: event.candidate,
        });
      }
    };

    const remoteStream = new MediaStream();
    store.setRemoteStream(remoteStream);

    pc.ontrack = (event) => {
      remoteStream.addTrack(event.track);
    };

    if (isVideoCall(callType)) {
      const localStream = useStore.getState().localStream;
      if (localStream) {
        for (const track of localStream.getTracks()) {
          pc.addTrack(track, localStream);
        }
      }
    }

    return pc;
  }, []);

  const closePeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    dataChannelRef.current = null;

    const { callType } = connectedUserRef.current || {};
    if (callType && isVideoCall(callType)) {
      const localStream = useStore.getState().localStream;
      if (localStream) {
        localStream.getVideoTracks().forEach((t) => (t.enabled = true));
        localStream.getAudioTracks().forEach((t) => (t.enabled = true));
      }
    }

    connectedUserRef.current = null;
    store.setRemoteStream(null);
    store.clearMessages();
    store.clearDialog();

    const ls = useStore.getState().localStream;
    store.setCallState(ls ? CallState.AVAILABLE : CallState.AVAILABLE_CHAT_ONLY);
  }, []);

  // ── Initiate call ──────────────────────────────────────────────────────────
  const sendPreOffer = useCallback((callType, calleePersonalCode) => {
    connectedUserRef.current = { callType, socketId: calleePersonalCode };
    store.setCallState(CallState.UNAVAILABLE);

    if (callType === CallType.CHAT_PERSONAL_CODE || callType === CallType.VIDEO_PERSONAL_CODE) {
      store.setDialog({ type: "calling", onCancel: cancelCall });
    }

    emitPreOffer({ callType, calleePersonalCode });
  }, []);

  const cancelCall = useCallback(() => {
    if (connectedUserRef.current) {
      emitUserHangedUp({ connectedUserSocketId: connectedUserRef.current.socketId });
    }
    closePeerConnection();
  }, [closePeerConnection]);

  // ── Receive pre-offer ──────────────────────────────────────────────────────
  const handlePreOffer = useCallback(
    (data) => {
      const { callType, callerSocketId } = data;
      const callState = useStore.getState().callState;

      if (callState !== CallState.AVAILABLE && callState !== CallState.AVAILABLE_CHAT_ONLY) {
        emitPreOfferAnswer({ callerSocketId, preOfferAnswer: PreOfferAnswer.CALL_UNAVAILABLE });
        return;
      }

      connectedUserRef.current = { callType, socketId: callerSocketId };
      store.setCallState(CallState.UNAVAILABLE);

      if (callType === CallType.CHAT_STRANGER || callType === CallType.VIDEO_STRANGER) {
        createPeerConnection(callType);
        emitPreOfferAnswer({ callerSocketId, preOfferAnswer: PreOfferAnswer.CALL_ACCEPTED });
        store.clearDialog();
        return;
      }

      store.setDialog({
        type: "incoming",
        callType,
        onAccept: () => {
          createPeerConnection(callType);
          emitPreOfferAnswer({ callerSocketId, preOfferAnswer: PreOfferAnswer.CALL_ACCEPTED });
          store.clearDialog();
        },
        onReject: () => {
          emitPreOfferAnswer({ callerSocketId, preOfferAnswer: PreOfferAnswer.CALL_REJECTED });
          store.clearDialog();
          const ls = useStore.getState().localStream;
          store.setCallState(ls ? CallState.AVAILABLE : CallState.AVAILABLE_CHAT_ONLY);
          connectedUserRef.current = null;
        },
      });
    },
    [createPeerConnection]
  );

  // ── Receive pre-offer answer ───────────────────────────────────────────────
  const handlePreOfferAnswer = useCallback(
    async (data) => {
      const { preOfferAnswer } = data;
      store.clearDialog();

      if (preOfferAnswer === PreOfferAnswer.CALL_ACCEPTED) {
        const callType = connectedUserRef.current?.callType;
        createPeerConnection(callType);
        // caller creates and sends offer
        const pc = pcRef.current;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        emitWebRTCSignaling({
          connectedUserSocketId: connectedUserRef.current.socketId,
          type: WebRTCSignaling.OFFER,
          offer,
        });
        return;
      }

      // All rejection cases
      const messages = {
        [PreOfferAnswer.CALLEE_NOT_FOUND]: { title: "User Not Found", body: "Check the personal code and try again." },
        [PreOfferAnswer.CALL_UNAVAILABLE]: { title: "Unavailable", body: "The user is currently busy." },
        [PreOfferAnswer.CALL_REJECTED]: { title: "Call Rejected", body: "The user declined your call." },
      };
      const msg = messages[preOfferAnswer];
      if (msg) store.setDialog({ type: "info", ...msg });
      closePeerConnection();
    },
    [createPeerConnection, closePeerConnection]
  );

  // ── WebRTC signaling ───────────────────────────────────────────────────────
  const handleWebRTCSignaling = useCallback(async (data) => {
    const pc = pcRef.current;
    if (!pc) return;

    if (data.type === WebRTCSignaling.OFFER) {
      await pc.setRemoteDescription(data.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      emitWebRTCSignaling({
        connectedUserSocketId: connectedUserRef.current.socketId,
        type: WebRTCSignaling.ANSWER,
        answer,
      });
    } else if (data.type === WebRTCSignaling.ANSWER) {
      await pc.setRemoteDescription(data.answer);
    } else if (data.type === WebRTCSignaling.ICE_CANDIDATE) {
      try {
        await pc.addIceCandidate(data.candidate);
      } catch (err) {
        console.error("ICE candidate error", err);
      }
    }
  }, []);

  // ── Hang up ────────────────────────────────────────────────────────────────
  const handleHangUp = useCallback(() => {
    if (connectedUserRef.current) {
      emitUserHangedUp({ connectedUserSocketId: connectedUserRef.current.socketId });
    }
    closePeerConnection();
  }, [closePeerConnection]);

  const handleRemoteHangUp = useCallback(() => {
    closePeerConnection();
  }, [closePeerConnection]);

  // ── Media controls ─────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const ls = useStore.getState().localStream;
    if (!ls) return;
    const track = ls.getAudioTracks()[0];
    if (track) track.enabled = !track.enabled;
    return track?.enabled;
  }, []);

  const toggleCamera = useCallback(() => {
    const ls = useStore.getState().localStream;
    if (!ls) return;
    const track = ls.getVideoTracks()[0];
    if (track) track.enabled = !track.enabled;
    return track?.enabled;
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const { screenSharingActive, localStream } = useStore.getState();
    const pc = pcRef.current;
    if (!pc) return;

    if (screenSharingActive) {
      const screenStream = useStore.getState().screenSharingStream;
      screenStream?.getTracks().forEach((t) => t.stop());
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      const videoTrack = localStream?.getVideoTracks()[0];
      if (sender && videoTrack) sender.replaceTrack(videoTrack);
      store.setScreenSharingStream(null);
      store.setScreenSharingActive(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        store.setScreenSharingStream(screenStream);
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenStream.getVideoTracks()[0]);
        store.setScreenSharingActive(true);
        // auto-revert when user stops sharing via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          const sender2 = pc.getSenders().find((s) => s.track?.kind === "video");
          const videoTrack = useStore.getState().localStream?.getVideoTracks()[0];
          if (sender2 && videoTrack) sender2.replaceTrack(videoTrack);
          store.setScreenSharingStream(null);
          store.setScreenSharingActive(false);
        };
      } catch (err) {
        console.error("Screen share error", err);
      }
    }
  }, []);

  // ── Chat ───────────────────────────────────────────────────────────────────
  const sendMessage = useCallback((text) => {
    const dc = dataChannelRef.current;
    if (dc?.readyState === "open") {
      dc.send(text);
      store.addMessage(text, true);
    }
  }, []);

  return {
    sendPreOffer,
    handlePreOffer,
    handlePreOfferAnswer,
    handleWebRTCSignaling,
    handleHangUp,
    handleRemoteHangUp,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    sendMessage,
    connectedUserRef,
  };
};

export default useWebRTC;
