import React, { useState, useRef } from "react";

const VoiceRecorder = ({ onTranscriptionComplete, apiUrl }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleStop;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic Error:", err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const handleStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    try {
      // 🔹 Sending to your RENDER Backend
      const response = await fetch(`${apiUrl}/api/audio/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Transcription failed");

      const data = await response.json();
      onTranscriptionComplete(data.transcription);
    } catch (error) {
      console.error("Error:", error);
      alert("Audio transcription failed.");
    } finally {
      setIsProcessing(false);
      // Stop mic stream to turn off red dot in browser
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
  };

  return (
    <button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      className={`btn btn-sm ${isRecording ? "btn-danger" : "btn-light"}`}
      title={isRecording ? "Stop Recording" : "Start Recording"}
      style={{
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        transition: "all 0.2s",
      }}
    >
      {isProcessing ? (
        <span
          className="spinner-border spinner-border-sm"
          role="status"
          aria-hidden="true"
        ></span>
      ) : isRecording ? (
        <i className="bi bi-stop-fill"></i>
      ) : (
        <i className="bi bi-mic-fill text-primary"></i>
      )}
    </button>
  );
};

export default VoiceRecorder;
