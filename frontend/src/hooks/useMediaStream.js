import { useEffect } from "react";
import useStore from "../store/useStore";

const useMediaStream = () => {
  const setLocalStream = useStore((s) => s.setLocalStream);

  useEffect(() => {
    let stream;
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((s) => {
        stream = s;
        setLocalStream(s);
      })
      .catch((err) => {
        console.warn("Camera/mic not available:", err.message);
        // app still works for audio-only / chat-only calls
      });

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    };
  }, [setLocalStream]);
};

export default useMediaStream;
