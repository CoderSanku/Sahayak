import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Mic, Square } from "lucide-react";
import { sendVoiceInput } from "../api";

export default function InputBar({ onSend, disabled, placeholder }) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const mrRef = useRef(null);
  const chunksRef = useRef([]);

  function handleSend() {
    const val = text.trim();
    if (!val) return;
    setText("");
    onSend(val);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleMic() {
    // ── STOP ──
    if (recording) {
      mrRef.current?.stop();
      setRecording(false);
      return;
    }

    // ── START ──
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/ogg";

      const mr = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });

        if (blob.size < 1000) return;

        try {
          const result = await sendVoiceInput(blob);
          if (result.success && result.voice_input?.trim()) {
            setText(result.voice_input.trim());
          }
        } catch {
          // Silently ignore voice errors
        }
      };

      mr.start(250);
      mrRef.current = mr;
      setRecording(true);
    } catch (e) {
      if (e.name === "NotAllowedError") {
        alert("Microphone permission denied.");
      } else {
        alert("Could not start recording: " + e.message);
      }
    }
  }

  return (
    <div className="chat-footer">
      <input
        className="chat-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder || "Type a message..."}
        disabled={disabled}
      />

      <motion.button
        className={`icon-btn mic-btn ${recording ? "recording" : ""}`}
        onClick={handleMic}
        title={recording ? "Stop recording" : "Voice input"}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
      >
        {recording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </motion.button>

      <motion.button
        className="icon-btn send-btn"
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        title="Send"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Send className="w-5 h-5" />
      </motion.button>
    </div>
  );
}