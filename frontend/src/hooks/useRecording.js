import { useRef } from "react";
import useStore from "../store/useStore";

const useRecording = () => {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const start = () => {
    const remoteStream = useStore.getState().remoteStream;
    if (!remoteStream) return;

    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
      ? "video/webm; codecs=vp9"
      : "video/webm";

    const recorder = new MediaRecorder(remoteStream, { mimeType: mime });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      chunksRef.current = [];
    };

    recorder.start();
  };

  const stop = () => recorderRef.current?.stop();
  const pause = () => recorderRef.current?.pause();
  const resume = () => recorderRef.current?.resume();

  return { start, stop, pause, resume };
};

export default useRecording;
