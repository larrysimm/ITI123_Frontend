import React, { useState, useRef } from "react";

const VoiceRecorder = ({
  onTranscriptionComplete,
  apiUrl,
  onRecordingStart,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | recording | processing
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    if (onRecordingStart) onRecordingStart();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = handleStop;
      mediaRecorder.start();
      setIsRecording(true);
      setStatus("recording");
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatus("processing"); // Switch to processing state
    }
  };

  const handleStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    try {
      const endpoint = `${apiUrl}/api/audio/transcribe`;
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Transcription failed");

      const data = await response.json();
      onTranscriptionComplete(data.transcription);
      setStatus("idle"); // Done
    } catch (error) {
      alert("Audio transcription failed.");
      setStatus("idle");
    } finally {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
  };

  // --- RENDERING THE BUTTON ---

  if (status === "processing") {
    return (
      <button
        className="btn btn-primary rounded-circle shadow"
        style={{ width: 50, height: 50 }}
        disabled
      >
        <span
          className="spinner-border spinner-border-sm"
          role="status"
          aria-hidden="true"
        ></span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      className={`btn shadow ${isRecording ? "btn-danger" : "btn-light"}`}
      style={{
        borderRadius: "50%",
        width: "50px",
        height: "50px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: isRecording ? "3px solid #ffcccc" : "1px solid #ddd",
      }}
    >
      {isRecording ? (
        <i className="bi bi-stop-fill fs-4"></i>
      ) : (
        <i className="bi bi-mic-fill fs-4 text-primary"></i>
      )}
    </button>
  );
};

export default VoiceRecorder;
