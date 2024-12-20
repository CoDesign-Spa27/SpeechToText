import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from "lucide-react";

const SpeechToText = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState('assemblyai');
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const API_ENDPOINTS = {
    assemblyai: 'https://speechtotext-280m.onrender.com/assembly/upload',
    whisper: 'https://speechtotext-280m.onrender.com/whisper/upload'
  };

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsProcessing(true);
        const audioType = selectedModel === 'assemblyai' ? 'audio/webm' : 'audio/mp3';
        const audioBlob = new Blob(chunksRef.current, { type: audioType });
        chunksRef.current = [];
        
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob);
          
          const response = await fetch(API_ENDPOINTS[selectedModel], {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Transcription failed with ${selectedModel}`);
          }
          const data = await response.json();
          setText(data.text);
        } catch (err) {
          setError(`Failed to transcribe audio with ${selectedModel}. Please try again.`);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('Please allow microphone access to use this feature.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
    setText('');
    setError(''); 
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-purple-500">
        <h2 className="text-xl font-bold text-white">Speech to Text</h2>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="w-full">
          <select
            value={selectedModel}
            onChange={handleModelChange}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="assemblyai">AssemblyAI</option>
            <option value="whisper">OpenAI Whisper</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
    
        <div className="flex justify-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`
              w-16 h-16 rounded-full flex items-center justify-center
              transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-purple-500 hover:bg-purple-600'
              }
            `}
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-6 w-6 text-white" />
            ) : (
              <Mic className="h-6 w-6 text-white" />
            )}
          </button>
        </div>

        {isRecording && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-500">Recording...</span>
          </div>
        )}

        <div className="min-h-[100px] p-4 bg-gray-50 rounded-lg border border-gray-200">
          {text ? (
            <p className="text-gray-700">{text}</p>
          ) : (
            <p className="text-gray-400 text-center">
              {isRecording ? 
                "Recording... Click the button to stop" : 
                `Your transcribed text using ${selectedModel === 'assemblyai' ? 'AssemblyAI' : 'OpenAI Whisper'} will appear here`
              }
            </p>
          )}
        </div>

        {isProcessing && (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            <span className="text-sm text-gray-500">
              Processing audio with {selectedModel === 'assemblyai' ? 'AssemblyAI' : 'OpenAI Whisper'}...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechToText;