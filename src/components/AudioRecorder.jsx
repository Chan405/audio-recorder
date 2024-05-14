import axios from "axios";
import React, { useState, useRef, useEffect } from "react";

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [audioFiles, setAudioFiles] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    fetchAudioFiles();
  }, []);

  const fetchAudioFiles = async () => {
    try {
      const response = await axios.get("http://localhost:5000/files");
      setAudioFiles(response.data);
    } catch (error) {
      console.error("Error fetching audio files", error);
    }
  };

  const handleStartRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        audioChunksRef.current = [];
        handleUpload(audioBlob);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    });
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleUpload = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.wav");

    try {
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setAudioFiles([...audioFiles, response.data.filePath]);
    } catch (error) {
      console.error("Error uploading audio file", error);
    }
  };

  return (
    <div>
      <h1>Audio Recorder</h1>
      <button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <div>
        <h2>Recorded Audio</h2>
        {audioURL && <audio src={audioURL} controls />}
      </div>
      <div>
        <h2>Uploaded Audios</h2>
        <ul>
          {audioFiles.map((file, index) => (
            <li key={index}>
              <audio src={`http://localhost:5000${file}`} controls />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AudioRecorder;
