'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
    Room as LiveKitRoom,
    RoomEvent,
    ParticipantEvent,
    RemoteParticipant,
    Participant,
    LocalAudioTrack,
    createLocalAudioTrack,
    AudioPresets,
} from 'livekit-client';
import { Mic, MicOff, Volume2, X, ChevronDown, RotateCcw } from 'lucide-react';

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

type MicPermissionState = PermissionState | 'unknown';

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? 'wss://avalonboardgame-f41kqv22.livekit.cloud';
const MIC_CAPTURE_OPTIONS = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
    sampleRate: 48000,
    latency: 0.02,
};

const MIC_PUBLISH_OPTIONS = {
    dtx: false,
    red: true,
    audioPreset: {
        ...AudioPresets.speech,
        maxBitrate: 32000,
    },
};

async function fetchToken(roomId: string, userId: string, name: string): Promise<string> {
    const res = await fetch(
        `/api/livekit/token?room=${encodeURIComponent(roomId)}&userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(name)}`
    );
    const data = await res.json() as { token: string };
    return data.token;
}

export default function VoiceChatPanel({ roomId, userId, playerName, players }: VoiceChatPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hasJoinedVoice, setHasJoinedVoice] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isResettingMic, setIsResettingMic] = useState(false);
    const [micPermission, setMicPermission] = useState<MicPermissionState>('unknown');
    const [isConnected, setIsConnected] = useState(false);
    const [speakingIds, setSpeakingIds] = useState<Set<string>>(new Set());
    const [volumes, setVolumes] = useState<Record<string, number>>({});
    const roomRef = useRef<LiveKitRoom | null>(null);
    const audioEls = useRef<Record<string, HTMLAudioElement>>({});
    const rawMicTrackRef = useRef<LocalAudioTrack | null>(null);
    const speakingListenerCleanupRef = useRef<Map<string, () => void>>(new Map());
    // Guard against double-click race condition on toggleMic
    const isTogglingMicRef = useRef(false);

    const cleanupMicPipeline = useCallback(() => {
        if (rawMicTrackRef.current) {
            rawMicTrackRef.current.stop();
            rawMicTrackRef.current = null;
        }
    }, []);

    const refreshMicPermission = useCallback(async () => {
        if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
            setMicPermission('unknown');
            return null;
        }

        try {
            const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            setMicPermission(status.state);
            return status;
        } catch {
            setMicPermission('unknown');
            return null;
        }
    }, []);

    const publishMicTrack = useCallback(async (room: LiveKitRoom) => {
        const track = await createLocalAudioTrack(MIC_CAPTURE_OPTIONS);
        rawMicTrackRef.current = track;
        await room.localParticipant.publishTrack(track, MIC_PUBLISH_OPTIONS);
    }, []);

    const unpublishMicTracks = useCallback(async (room: LiveKitRoom) => {
        // Collect all publications first to avoid mutation-while-iterating
        const pubs = Array.from(room.localParticipant.audioTrackPublications.values());
        const unpublishTasks = pubs.map(async pub => {
            if (!pub.track) return;
            try {
                pub.track.stop();
                await room.localParticipant.unpublishTrack(pub.track);
            } catch (e) {
                console.warn('[VoiceChat] unpublish track error', e);
            }
        });

        await Promise.allSettled(unpublishTasks);
        cleanupMicPipeline();
    }, [cleanupMicPipeline]);

    useEffect(() => {
        let permissionStatus: PermissionStatus | null = null;
        let onPermissionChange: (() => void) | null = null;
        let isCancelled = false;

        const watchMicPermission = async () => {
            const status = await refreshMicPermission();
            if (isCancelled || !status) return;

            permissionStatus = status;
            onPermissionChange = () => {
                const nextState = permissionStatus?.state ?? 'unknown';
                setMicPermission(nextState);

                if (nextState === 'denied') {
                    setIsMicOn(false);
                    const room = roomRef.current;
                    if (room) {
                        void unpublishMicTracks(room);
                    } else {
                        cleanupMicPipeline();
                    }
                }
            };

            permissionStatus.addEventListener('change', onPermissionChange);
        };

        void watchMicPermission();

        return () => {
            isCancelled = true;
            if (permissionStatus && onPermissionChange) {
                permissionStatus.removeEventListener('change', onPermissionChange);
            }
        };
    }, [refreshMicPermission, unpublishMicTracks, cleanupMicPipeline]);

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

    const upsertSpeakingState = useCallback((participantId: string, isSpeaking: boolean) => {
        setSpeakingIds(prev => {
            const next = new Set(prev);
            if (isSpeaking) {
                next.add(participantId);
            } else {
                next.delete(participantId);
            }
            return next;
        });
    }, []);

    const registerSpeakingListener = useCallback((participant: Participant) => {
        const participantId = participant.identity;
        if (!participantId) return;

        if (speakingListenerCleanupRef.current.has(participantId)) {
            return;
        }

        const onSpeakingChanged = (isSpeaking: boolean) => {
            upsertSpeakingState(participantId, isSpeaking);
        };

        participant.on(ParticipantEvent.IsSpeakingChanged, onSpeakingChanged);
        upsertSpeakingState(participantId, participant.isSpeaking);

        speakingListenerCleanupRef.current.set(participantId, () => {
            participant.off(ParticipantEvent.IsSpeakingChanged, onSpeakingChanged);
            upsertSpeakingState(participantId, false);
        });
    }, [upsertSpeakingState]);

    const unregisterSpeakingListener = useCallback((participantId: string) => {
        const cleanup = speakingListenerCleanupRef.current.get(participantId);
        if (cleanup) {
            cleanup();
            speakingListenerCleanupRef.current.delete(participantId);
            return;
        }

        upsertSpeakingState(participantId, false);
    }, [upsertSpeakingState]);

    const clearSpeakingListeners = useCallback(() => {
        speakingListenerCleanupRef.current.forEach(cleanup => cleanup());
        speakingListenerCleanupRef.current.clear();
        setSpeakingIds(new Set());
    }, []);

    useEffect(() => {
        if (!hasJoinedVoice) return;

        let lkRoom: LiveKitRoom | null = null;

        let isCancelled = false;

        const connect = async () => {
            try {
                const token = await fetchToken(roomId, userId, playerName);
                if (isCancelled) return;

                lkRoom = new LiveKitRoom({
                    adaptiveStream: true,
                    dynacast: true,
                    audioCaptureDefaults: MIC_CAPTURE_OPTIONS,
                    publishDefaults: MIC_PUBLISH_OPTIONS,
                });
                roomRef.current = lkRoom;

                lkRoom.on(RoomEvent.Connected, () => {
                    if (!isCancelled) setIsConnected(true);
                });
                lkRoom.on(RoomEvent.Disconnected, () => {
                    if (!isCancelled) {
                        setIsConnected(false);
                        setIsMicOn(false);
                    }
                    cleanupMicPipeline();
                    clearSpeakingListeners();
                });

                // Note: per-participant IsSpeakingChanged handles speaking state granularly.
                // ActiveSpeakersChanged is intentionally omitted to avoid replacing the full
                // Set and wiping out per-participant state managed by registerSpeakingListener.

                lkRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
                    if (isCancelled) return;
                    registerSpeakingListener(participant);
                });

                lkRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
                    if (isCancelled) return;
                    unregisterSpeakingListener(participant.identity);
                });

                // Auto-attach audio when a remote track arrives
                lkRoom.on(RoomEvent.TrackSubscribed, (_track, _pub, participant: RemoteParticipant) => {
                    if (!isCancelled) attachTrack(participant);
                });

                try {
                    await lkRoom.prepareConnection(LIVEKIT_URL, token);
                } catch (prepareErr) {
                    console.warn('[VoiceChat] prepareConnection warning', prepareErr);
                }

                await lkRoom.connect(LIVEKIT_URL, token, { autoSubscribe: true });
                registerSpeakingListener(lkRoom.localParticipant);
                lkRoom.remoteParticipants.forEach(participant => registerSpeakingListener(participant));

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
            cleanupMicPipeline();
            clearSpeakingListeners();

            Object.values(audioEls.current).forEach(el => {
                el.srcObject = null;
                el.remove();
            });
            audioEls.current = {};
        };
    }, [hasJoinedVoice, roomId, userId, playerName, attachTrack, cleanupMicPipeline, registerSpeakingListener, unregisterSpeakingListener, clearSpeakingListeners]);

    // Toggle mic on/off — guarded with isTogglingMicRef to prevent race condition
    const toggleMic = useCallback(async () => {
        const room = roomRef.current;
        if (!room || !isConnected || isResettingMic) return;
        // Prevent double-click from publishing multiple tracks
        if (isTogglingMicRef.current) return;
        isTogglingMicRef.current = true;

        try {
            if (!isMicOn) {
                const permission = await refreshMicPermission();
                if (permission?.state === 'denied') {
                    setIsMicOn(false);
                    return;
                }

                try {
                    await room.startAudio();
                    await publishMicTrack(room);
                    setIsMicOn(true);
                    void refreshMicPermission();
                } catch (err) {
                    console.warn('[VoiceChat] mic enable failed', err);
                    await unpublishMicTracks(room); // cleanup any partial publish
                    cleanupMicPipeline();
                    setIsMicOn(false);
                    void refreshMicPermission();
                }
            } else {
                await unpublishMicTracks(room);
                setIsMicOn(false);
                void refreshMicPermission();
            }
        } finally {
            isTogglingMicRef.current = false;
        }
    }, [isMicOn, isConnected, isResettingMic, publishMicTrack, cleanupMicPipeline, unpublishMicTracks, refreshMicPermission]);

    const resetMic = useCallback(async () => {
        const room = roomRef.current;
        if (!room || !isConnected || isResettingMic) return;
        // Guard against concurrent toggle
        if (isTogglingMicRef.current) return;

        // Allow reset even if isMicOn=false: there may be orphan tracks from a failed toggle
        const hasOrphanTracks = room.localParticipant.audioTrackPublications.size > 0;
        const canReset = isMicOn || hasOrphanTracks;
        if (!canReset) return;

        const permission = await refreshMicPermission();
        if (permission?.state === 'denied') {
            await unpublishMicTracks(room);
            setIsMicOn(false);
            return;
        }

        isTogglingMicRef.current = true;
        setIsResettingMic(true);
        try {
            await room.startAudio();
            await unpublishMicTracks(room);
            setIsMicOn(false);

            await publishMicTrack(room);
            setIsMicOn(true);
            void refreshMicPermission();
        } catch (err) {
            console.warn('[VoiceChat] mic reset failed', err);
            cleanupMicPipeline();
            setIsMicOn(false);
            void refreshMicPermission();
        } finally {
            setIsResettingMic(false);
            isTogglingMicRef.current = false;
        }
    }, [isConnected, isResettingMic, isMicOn, unpublishMicTracks, publishMicTrack, cleanupMicPipeline, refreshMicPermission]);

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
    const isMicToggleDisabled = !isConnected || isResettingMic || (micPermission === 'denied' && !isMicOn);
    // Reset is available when mic is on OR there are orphan tracks to clean up
    const hasOrphanTracks = (roomRef.current?.localParticipant.audioTrackPublications.size ?? 0) > 0;
    const isResetDisabled = !isConnected || isResettingMic || (!isMicOn && !hasOrphanTracks);
    const micToggleTitle = !isConnected
        ? 'Chưa kết nối voice'
        : micPermission === 'denied' && !isMicOn
            ? 'Trình duyệt đang chặn quyền mic'
            : isMicOn
                ? 'Tắt mic'
                : 'Bật mic';

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
                    {!hasJoinedVoice ? (
                        <span className="text-[9px] font-bold uppercase text-amber-400/90 ml-1">(Chưa vào)</span>
                    ) : !isConnected ? (
                        <span className="text-[9px] opacity-50 ml-1">...</span>
                    ) : null}
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
                                    disabled={isMicToggleDisabled}
                                    className={`min-w-11 min-h-11 flex items-center justify-center rounded-full border transition-all ${
                                        isMicOn
                                            ? 'bg-(--primary)/20 border-(--primary)/50 text-(--primary)'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-(--primary)/30'
                                    } ${isMicToggleDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                    title={micToggleTitle}
                                    aria-label={micToggleTitle}
                                >
                                    {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={resetMic}
                                    disabled={isResetDisabled}
                                    className={`min-w-11 min-h-11 flex items-center justify-center rounded-full border transition-all ${
                                        isResetDisabled
                                            ? 'bg-white/5 border-white/10 text-slate-600 cursor-not-allowed'
                                            : 'bg-white/5 border-white/10 text-slate-300 hover:border-(--primary)/30 cursor-pointer'
                                    } ${isResettingMic ? 'opacity-70' : ''}`}
                                    title={isResettingMic ? 'Đang reset mic...' : 'Reset mic'}
                                    aria-label={isResettingMic ? 'Đang reset mic' : 'Reset mic'}
                                >
                                    <RotateCcw className={`w-4 h-4 ${isResettingMic ? 'animate-spin' : ''}`} />
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
                        {hasJoinedVoice ? (
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
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center space-y-4">
                                <div className="w-12 h-12 rounded-full bg-(--primary)/10 flex items-center justify-center shrink-0">
                                    <Volume2 className="w-6 h-6 text-(--primary)" />
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-sm font-bold text-(--on-surface) tracking-wide">Bạn chưa vào Voice</h3>
                                    <p className="text-[11px] text-(--on-surface-variant) leading-relaxed">
                                        Hãy tham gia để nghe người khác biện luận.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setHasJoinedVoice(true)}
                                    className="px-5 py-2.5 bg-(--primary) text-black font-bold text-[11px] uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer mt-2"
                                >
                                    Tham Gia Ngay
                                </button>
                            </div>
                        )}

                        <div className="shrink-0 px-4 py-2 border-t border-(--primary)/10">
                            {micPermission === 'denied' && (
                                <p className="text-[9px] text-amber-300/90 uppercase tracking-wider text-center mb-1">
                                    Trinh duyet dang chan microphone
                                </p>
                            )}
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
