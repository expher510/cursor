
'use client';

import { useState, useRef, useCallback } from 'react';

type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped';

type AudioData = {
  blob: Blob;
  url: string; // Data URI
};

type RecorderState = {
  status: RecorderStatus;
  error: string | null;
  audioData: AudioData | null;
};

export function useRecorder() {
  const [recorderState, setRecorderState] = useState<RecorderState>({
    status: 'idle',
    error: null,
    audioData: null,
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    if (recorderState.status !== 'idle' && recorderState.status !== 'stopped') {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Convert Blob to Data URI to store in Firestore
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
            const base64Audio = reader.result as string;
            setRecorderState((prev) => ({
              ...prev,
              status: 'stopped',
              audioData: { blob: audioBlob, url: base64Audio },
            }));
        };

        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop()); // Stop the mic access
      };
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setRecorderState({
            status: 'idle',
            error: 'Recording failed.',
            audioData: null
        });
      };

      recorder.start();
      setRecorderState({ status: 'recording', error: null, audioData: null });
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setRecorderState({
        status: 'idle',
        error: 'Microphone access denied. Please allow access in your browser settings.',
        audioData: null
      });
    }
  }, [recorderState.status]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recorderState.status === 'recording') {
      mediaRecorderRef.current.stop();
      // The onstop handler will update the state
    }
  }, [recorderState.status]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && (recorderState.status === 'recording' || recorderState.status === 'paused')) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setRecorderState({
        status: 'idle',
        error: null,
        audioData: null,
    });
  }, [recorderState.status]);


  return {
    recorderState,
    startRecording,
    stopRecording,
    cancelRecording,
    audioData: recorderState.audioData
  };
}

    