'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
    Room as LiveKitRoom,
    RoomEvent,
    RemoteParticipant,
    Participant,
    createLocalAudioTrack,
} from 'livekit-client';
import { Mic, MicOff, Volume2, X, ChevronDown } from 'lucide-react';

interface VoicePlayer {
    userId: string;
    name: string;
}

interface VoiceChatPanelProps {
    roomId: string;
    userId: string;
    playerName: string;
    players: VoicePlayer[];
}

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? 'wss://board-game-vxr9y6t8.livekit.cloud';

async function fetchToken(roomId: string, userId: string, name: string): Promise<string> {
    const res = await fetch(
        `/api/livekit/token?room=${encodeURIComponent(roomId)}&userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(name)}`
    );
    const data = await res.json() as { token: string };
    return data.token;
}

export default function VoiceChatPanel({ roomId, userId, playerName, players }: VoiceChatPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [speakingIds, setSpeakingIds] = useState<Set<string>>(new Set());
    const [volumes, setVolumes] = useState<Record<string, number>>({});
    const roomRef = useRef<LiveKitRoom | null>(null);
    const audioEls = useRef<Record<string, HTMLAudioElement>>({});

    // Attach remote audio track to an <audio> element per participant
    const attachTrack = useCallback((participant: RemoteParticipant) => {
        participant.audioTrackPublications.forEach(pub => {
            const track = pub.track;
            if (!track) return;
            const id = participant.identity;
            if (!audioEls.current[id]) {
                const el = document.createElement('audio');
                el.autoplay = true;
                document.body.appendChild(el);
                audioEls.current[id] = el;
            }
            track.attach(audioEls.current[id]);
        });
    }, []);

    useEffect(() => {
        let lkRoom: LiveKitRoom | null = null;

        let isCancelled = false;

        const connect = async () => {
            try {
                const token = await fetchToken(roomId, userId, playerName);
                if (isCancelled) return;

                lkRoom = new LiveKitRoom({ adaptiveStream: true, dynacast: true });
                roomRef.current = lkRoom;

                lkRoom.on(RoomEvent.Connected, () => {
                    if (!isCancelled) setIsConnected(true);
                });
                lkRoom.on(RoomEvent.Disconnected, () => {
                    if (!isCancelled) setIsConnected(false);
                });

                // Track who is actively speaking
                lkRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
                    if (!isCancelled) setSpeakingIds(new Set(speakers.map(s => s.identity)));
                });

                // Auto-attach audio when a remote track arrives
                lkRoom.on(RoomEvent.TrackSubscribed, (_track, _pub, participant: RemoteParticipant) => {
                    if (!isCancelled) attachTrack(participant);
                });

                await lkRoom.connect(LIVEKIT_URL, token, { autoSubscribe: true });
                if (isCancelled) {
                    lkRoom.disconnect();
                }
            } catch (err) {
                console.warn('[VoiceChat] connect error', err);
            }
        };

        void connect();

        return () => {
            isCancelled = true;
            lkRoom?.disconnect();
            Object.values(audioEls.current).forEach(el => {
                el.srcObject = null;
                el.remove();
            });
            audioEls.current = {};
        };
    }, [roomId, userId, playerName, attachTrack]);

    // Toggle mic on/off
    const toggleMic = useCallback(async () => {
        const room = roomRef.current;
        if (!room || !isConnected) return;

        if (!isMicOn) {
            try {
                const track = await createLocalAudioTrack({
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                });
                await room.localParticipant.publishTrack(track);
                setIsMicOn(true);
            } catch (err) {
                console.warn('[VoiceChat] mic enable failed', err);
            }
        } else {
            room.localParticipant.audioTrackPublications.forEach(pub => {
                if (pub.track) {
                    pub.track.stop();
                    void room.localParticipant.unpublishTrack(pub.track);
                }
            });
            setIsMicOn(false);
        }
    }, [isMicOn, isConnected]);

    // Per-participant volume control (0-100)
    const setParticipantVolume = useCallback((participantId: string, vol: number) => {
        setVolumes(prev => ({ ...prev, [participantId]: vol }));
        const room = roomRef.current;
        if (!room) return;
        room.remoteParticipants.forEach(p => {
            if (p.identity === participantId) p.setVolume(vol / 100);
        });
    }, []);

    const speakingOthers = players.filter(p => speakingIds.has(p.userId) && p.userId !== userId);
    const iAmSpeaking = speakingIds.has(userId);

    return (
        <>
            {/* Collapsed pill */}
            <div className="fixed bottom-3 left-3 z-50 pointer-events-auto">
                <button
                    onClick={() => setIsOpen(p => !p)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-lg backdrop-blur-md transition-all cursor-pointer text-xs font-bold tracking-wide ${
                        isConnected
                            ? 'bg-black/50 border-(--primary)/35 text-(--primary)'
                            : 'bg-black/40 border-(--outline-variant)/30 text-(--on-surface-variant)'
                    }`}
                    title="Voice Chat"
                    aria-label="Mở bảng điều khiển giọng nói"
                >
                    {isMicOn
                        ? <Mic className={`w-3.5 h-3.5 ${iAmSpeaking ? 'animate-pulse text-green-400' : ''}`} />
                        : <MicOff className="w-3.5 h-3.5 opacity-50" />
                    }
                    <span>Voice</span>
                    {!isConnected && <span className="text-[9px] opacity-50 ml-1">...</span>}
                    {isConnected && speakingOthers.length > 0 && (
                        <span className="text-[9px] text-green-400 max-w-24 truncate">
                            {speakingOthers.map(p => p.name).join(', ')}
                        </span>
                    )}
                    <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>
            </div>

            {/* Full panel */}
            {isOpen && (
                <div className="fixed inset-0 z-60 flex flex-col items-start justify-end pointer-events-none pb-14 pl-3 pt-4">
                    <div
                        className="pointer-events-auto w-[min(280px,90vw)] flex flex-col rounded-2xl border border-(--primary)/20 shadow-2xl overflow-hidden max-h-full"
                        style={{ backgroundColor: 'rgba(8,16,30,0.96)', backdropFilter: 'blur(16px)' }}
                    >
                        {/* Header */}
                        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-(--primary)/15">
                            <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-(--primary)" />
                                <span className="text-xs font-bold uppercase tracking-widest text-(--primary)">Voice Chat</span>
                                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleMic}
                                    className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                                        isMicOn
                                            ? 'bg-(--primary)/20 border-(--primary)/50 text-(--primary)'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-(--primary)/30'
                                    }`}
                                    title={isMicOn ? 'Tắt mic' : 'Bật mic'}
                                    aria-label={isMicOn ? 'Tắt mic' : 'Bật mic'}
                                >
                                    {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    aria-label="Đóng bảng voice"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Player list */}
                        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                            {players.map(player => {
                                const isSpeaking = speakingIds.has(player.userId);
                                const isMe = player.userId === userId;
                                const vol = volumes[player.userId] ?? 100;

                                return (
                                    <div
                                        key={player.userId}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${
                                            isSpeaking
                                                ? 'bg-(--primary)/10 border border-(--primary)/25'
                                                : 'bg-white/3'
                                        }`}
                                    >
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            <div
                                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                                                    isSpeaking
                                                        ? 'border-green-400 bg-green-400/15 text-green-400'
                                                        : 'border-(--outline-variant)/30 bg-white/5 text-(--on-surface-variant)'
                                                }`}
                                            >
                                                {player.name.charAt(0).toUpperCase()}
                                            </div>
                                            {isSpeaking && (
                                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border border-black animate-pulse" />
                                            )}
                                        </div>

                                        {/* Name */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[11px] font-bold truncate ${isSpeaking ? 'text-(--primary)' : 'text-(--on-surface)'}`}>
                                                {player.name}{isMe && ' (Bạn)'}
                                            </p>
                                            {isSpeaking && (
                                                <p className="text-[9px] text-green-400 uppercase tracking-wider">đang nói...</p>
                                            )}
                                        </div>

                                        {/* Volume slider (others only) */}
                                        {!isMe ? (
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={100}
                                                    value={vol}
                                                    onChange={e => setParticipantVolume(player.userId, Number(e.target.value))}
                                                    className="w-16 h-1 accent-(--primary) cursor-pointer"
                                                    aria-label={`Âm lượng ${player.name}`}
                                                />
                                                <span className="text-[9px] text-(--on-surface-variant) w-6 text-right">{vol}</span>
                                            </div>
                                        ) : (
                                            <div className="shrink-0">
                                                {isMicOn
                                                    ? <Mic className="w-3.5 h-3.5 text-(--primary)" />
                                                    : <MicOff className="w-3.5 h-3.5 text-slate-600" />
                                                }
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="shrink-0 px-4 py-2 border-t border-(--primary)/10">
                            <p className="text-[9px] text-(--on-surface-variant) uppercase tracking-wider text-center opacity-50">
                                Powered by LiveKit
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
