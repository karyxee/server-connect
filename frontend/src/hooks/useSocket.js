import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

let socketInstance = null;

export const useSocket = (handlers) => {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = io("/", { transports: ["websocket", "polling"] });
    socketInstance = socket;

    socket.on("connect", () => handlersRef.current.onConnect?.(socket.id));
    socket.on("pre-offer", (data) => handlersRef.current.onPreOffer?.(data));
    socket.on("pre-offer-answer", (data) => handlersRef.current.onPreOfferAnswer?.(data));
    socket.on("webRTC-signaling", (data) => handlersRef.current.onWebRTCSignaling?.(data));
    socket.on("user-hanged-up", () => handlersRef.current.onUserHangedUp?.());
    socket.on("stranger-socket-id", (data) => handlersRef.current.onStrangerSocketId?.(data));

    return () => {
      socket.disconnect();
      socketInstance = null;
    };
  }, []);
};

export const emitPreOffer = (data) => socketInstance?.emit("pre-offer", data);
export const emitPreOfferAnswer = (data) => socketInstance?.emit("pre-offer-answer", data);
export const emitWebRTCSignaling = (data) => socketInstance?.emit("webRTC-signaling", data);
export const emitUserHangedUp = (data) => socketInstance?.emit("user-hanged-up", data);
export const emitStrangerStatus = (status) =>
  socketInstance?.emit("stranger-connection-status", { status });
export const emitGetStrangerId = () => socketInstance?.emit("get-stranger-socket-id");
