"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { Peer, MediaConnection } from 'peerjs';
import { getSocket } from '@/lib/socket';

interface VoiceChatProps {
  roomPlayers: { id: string; peerId?: string }[];
  mySocketId: string;
  onReady: (peerId: string) => void;
  isMicOn: boolean;
  noiseSuppressionEnabled?: boolean;
}

interface VoiceActivityMap {
  [peerId: string]: boolean;
}

export default function VoiceChat({ roomPlayers, mySocketId, onReady, isMicOn, noiseSuppressionEnabled = true }: VoiceChatProps) {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [streams, setStreams] = useState<{ [peerId: string]: MediaStream }>({});
  const [voiceActivity, setVoiceActivity] = useState<VoiceActivityMap>({});
  const myStreamRef = useRef<MediaStream | null>(null);
  const audioRefs = useRef<{ [peerId: string]: HTMLAudioElement }>({});
  const analysersRef = useRef<{ [peerId: string]: AnalyserNode }>({});
  const onReadyRef = useRef(onReady);
  const isMicOnRef = useRef(isMicOn);
  const audioContextRef = useRef<AudioContext | null>(null);
  const voiceCheckIntervalRef = useRef<number | null>(null);
  const socketRef = useRef(getSocket());

  const VOICE_THRESHOLD = 30; // Decibel threshold for detecting speech

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  // Detect voice activity by analyzing audio frequency
  const detectVoiceActivity = useCallback((analyser: AnalyserNode): boolean => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    return average > VOICE_THRESHOLD;
  }, [VOICE_THRESHOLD]);

  useEffect(() => {
    let createdPeer: Peer | null = null;

    // Dynamic import for client side only
    import('peerjs').then(({ default: Peer }) => {
      const newPeer = new Peer();
      createdPeer = newPeer;
      
      newPeer.on('open', (id) => {
        setPeer(newPeer);
        onReadyRef.current(id);
      });

      navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: noiseSuppressionEnabled,
          autoGainControl: true
        }
      })
        .then((stream) => {
          // Always enable tracks initially - let isMicOn control streaming, not the track itself
          stream.getAudioTracks().forEach(track => {
            track.enabled = true;
          });
          myStreamRef.current = stream;

          // Set up voice activity detection for our own stream
          if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
          }
          const mediaSource = audioContextRef.current.createMediaStreamSource(stream);
          const analyser = audioContextRef.current.createAnalyser();
          analyser.fftSize = 256;
          mediaSource.connect(analyser);
          analysersRef.current['self'] = analyser;

          newPeer.on('call', (call: MediaConnection) => {
            call.answer(stream);
            call.on('stream', (remoteStream) => {
              setStreams(prev => ({ ...prev, [call.peer]: remoteStream }));

              // Set up voice activity detection for remote stream
              if (audioContextRef.current) {
                try {
                  const mediaSource = audioContextRef.current.createMediaStreamSource(remoteStream);
                  const analyser = audioContextRef.current.createAnalyser();
                  analyser.fftSize = 256;
                  mediaSource.connect(analyser);
                  analysersRef.current[call.peer] = analyser;
                } catch (err) {
                  console.warn('Failed to set up voice analysis for remote stream', err);
                }
              }
            });
          });
        })
        .catch(err => {
          console.warn('Failed to get local audio stream', err);
        });
    });

    return () => {
      createdPeer?.destroy();
      myStreamRef.current?.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (voiceCheckIntervalRef.current) {
        clearInterval(voiceCheckIntervalRef.current);
      }
    };
  }, [noiseSuppressionEnabled]);

  // Start voice activity detection loop
  useEffect(() => {
    if (voiceCheckIntervalRef.current) {
      clearInterval(voiceCheckIntervalRef.current);
    }

    voiceCheckIntervalRef.current = window.setInterval(() => {
      const newVoiceActivity: VoiceActivityMap = {};

      Object.entries(analysersRef.current).forEach(([peerId, analyser]) => {
        newVoiceActivity[peerId] = detectVoiceActivity(analyser);
      });

      setVoiceActivity(prev => {
        const changed = Object.keys(newVoiceActivity).some(
          key => newVoiceActivity[key] !== prev[key]
        );
        return changed ? newVoiceActivity : prev;
      });
    }, 100); // Check every 100ms for real-time feedback

    return () => {
      if (voiceCheckIntervalRef.current) {
        clearInterval(voiceCheckIntervalRef.current);
      }
    };
  }, [detectVoiceActivity]);

  useEffect(() => {
    if (!peer || !myStreamRef.current) return;
    
    roomPlayers.forEach(p => {
      if (p.id !== mySocketId && p.peerId && !streams[p.peerId]) {
        const call = peer.call(p.peerId, myStreamRef.current!);
        if (call) {
          call.on('stream', (remoteStream) => {
            setStreams(prev => ({ ...prev, [p.peerId!]: remoteStream }));

            // Set up voice activity detection for remote stream
            if (audioContextRef.current) {
              try {
                const mediaSource = audioContextRef.current.createMediaStreamSource(remoteStream);
                const analyser = audioContextRef.current.createAnalyser();
                analyser.fftSize = 256;
                mediaSource.connect(analyser);
                analysersRef.current[p.peerId!] = analyser;
              } catch (err) {
                console.warn('Failed to set up voice analysis for remote stream', err);
              }
            }
          });
        }
      }
    });
  }, [roomPlayers, peer, mySocketId, streams]);

  useEffect(() => {
    Object.entries(streams).forEach(([peerId, stream]) => {
      if (audioRefs.current[peerId] && audioRefs.current[peerId].srcObject !== stream) {
        audioRefs.current[peerId].srcObject = stream;
      }
    });
  }, [streams]);

  // Memoize the current speaking state to avoid dependency array issues
  const currentlySpeaking = useMemo(() => {
    return voiceActivity['self'] && isMicOn;
  }, [voiceActivity, isMicOn]);

  // Emit voice activity state to socket so other players know who's speaking
  useEffect(() => {
    socketRef.current.emit('voiceActivity', {
      isSpeaking: currentlySpeaking,
    });
  }, [currentlySpeaking]);

  // Create stable callback for audio ref
  const setAudioRef = useCallback((el: HTMLAudioElement | null, peerId: string) => {
    if (el) {
      audioRefs.current[peerId] = el;
    }
  }, []);

  return (
    <div className="hidden">
      {Object.keys(streams).map(peerId => (
        <audio 
          key={peerId} 
          ref={(el) => setAudioRef(el, peerId)}
          autoPlay 
        />
      ))}
    </div>
  );
}
