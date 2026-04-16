"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioPresets,
  createLocalAudioTrack,
  LocalAudioTrack,
  Participant,
  ParticipantEvent,
  RemoteParticipant,
  Room as LiveKitRoom,
  RoomEvent,
} from "livekit-client";
import { ChevronDown, Mic, MicOff, RotateCcw, Volume2, X } from "lucide-react";
import type { Socket } from "socket.io-client";

type MicPermissionState = PermissionState | "unknown";

type VoicePlayer = {
  userId: string;
  name: string;
};

type TokenResponse = {
  token: string;
  canPublish?: boolean;
  policyReason?: string;
};

const LIVEKIT_URL =
  process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "wss://avalonboardgame-f41kqv22.livekit.cloud";

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

async function fetchToken(roomId: string, userId: string, name: string): Promise<TokenResponse> {
  const response = await fetch(
    `/api/livekit/token?room=${encodeURIComponent(roomId)}&userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(name)}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch LiveKit token");
  }

  const data = (await response.json()) as TokenResponse;
  if (!data.token) {
    throw new Error("LiveKit token payload is missing token");
  }
  return data;
}

export default function DeceptionVoiceChatPanel({
  roomId,
  userId,
  playerName,
  players,
  micAllowed,
  hideLauncher = false,
  openSignal,
  socket,
  onSpeakingIdsChange,
}: {
  roomId: string;
  userId: string;
  playerName: string;
  players: VoicePlayer[];
  micAllowed: boolean;
  hideLauncher?: boolean;
  openSignal?: number;
  socket: Socket | null;
  onSpeakingIdsChange?: (speakingIds: Set<string>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasJoinedVoice, setHasJoinedVoice] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isResettingMic, setIsResettingMic] = useState(false);
  const [micPermission, setMicPermission] = useState<MicPermissionState>("unknown");
  const [isConnected, setIsConnected] = useState(false);
  const [serverCanPublish, setServerCanPublish] = useState(true);
  const [policyReason, setPolicyReason] = useState<string>("ok");
  const [speakingIds, setSpeakingIds] = useState<Set<string>>(new Set());
  const [volumes, setVolumes] = useState<Record<string, number>>({});

  const roomRef = useRef<LiveKitRoom | null>(null);
  const audioEls = useRef<Record<string, HTMLAudioElement>>({});
  const rawMicTrackRef = useRef<LocalAudioTrack | null>(null);
  const speakingListenerCleanupRef = useRef<Map<string, () => void>>(new Map());
  const isTogglingMicRef = useRef(false);
  const lastReportedPolicyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!openSignal) return;
    setIsOpen(true);
  }, [openSignal]);

  useEffect(() => {
    onSpeakingIdsChange?.(speakingIds);
  }, [onSpeakingIdsChange, speakingIds]);

  useEffect(() => {
    if (serverCanPublish || !policyReason) {
      lastReportedPolicyRef.current = null;
      return;
    }

    const payloadKey = `${roomId}:${userId}:${policyReason}`;
    if (lastReportedPolicyRef.current === payloadKey) return;
    socket?.emit("voicePolicyDenied", { reason: policyReason });
    lastReportedPolicyRef.current = payloadKey;
  }, [policyReason, roomId, serverCanPublish, socket, userId]);

  const cleanupMicPipeline = useCallback(() => {
    if (rawMicTrackRef.current) {
      rawMicTrackRef.current.stop();
      rawMicTrackRef.current = null;
    }
  }, []);

  const refreshMicPermission = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      setMicPermission("unknown");
      return null;
    }

    try {
      const status = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      setMicPermission(status.state);
      return status;
    } catch {
      setMicPermission("unknown");
      return null;
    }
  }, []);

  const publishMicTrack = useCallback(async (room: LiveKitRoom) => {
    if (!micAllowed) return;
    const track = await createLocalAudioTrack(MIC_CAPTURE_OPTIONS);
    rawMicTrackRef.current = track;
    await room.localParticipant.publishTrack(track, MIC_PUBLISH_OPTIONS);
  }, [micAllowed]);

  const unpublishMicTracks = useCallback(async (room: LiveKitRoom) => {
    const pubs = Array.from(room.localParticipant.audioTrackPublications.values());
    const tasks = pubs.map(async (pub) => {
      if (!pub.track) return;
      try {
        pub.track.stop();
        await room.localParticipant.unpublishTrack(pub.track);
      } catch (error) {
        console.warn("[DeceptionVoice] unpublish track error", error);
      }
    });

    await Promise.allSettled(tasks);
    cleanupMicPipeline();
  }, [cleanupMicPipeline]);

  const upsertSpeakingState = useCallback((participantId: string, isSpeaking: boolean) => {
    setSpeakingIds((prev) => {
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
    if (!participantId || speakingListenerCleanupRef.current.has(participantId)) {
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
    speakingListenerCleanupRef.current.forEach((cleanup) => cleanup());
    speakingListenerCleanupRef.current.clear();
    setSpeakingIds(new Set());
  }, []);

  const attachTrack = useCallback((participant: RemoteParticipant) => {
    participant.audioTrackPublications.forEach((pub) => {
      const track = pub.track;
      if (!track) return;
      const id = participant.identity;
      if (!audioEls.current[id]) {
        const el = document.createElement("audio");
        el.autoplay = true;
        document.body.appendChild(el);
        audioEls.current[id] = el;
      }
      track.attach(audioEls.current[id]);
    });
  }, []);

  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;
    let onPermissionChange: (() => void) | null = null;
    let cancelled = false;

    const watchPermission = async () => {
      const status = await refreshMicPermission();
      if (cancelled || !status) return;

      permissionStatus = status;
      onPermissionChange = () => {
        const next = permissionStatus?.state ?? "unknown";
        setMicPermission(next);

        if (next === "denied") {
          setIsMicOn(false);
          const room = roomRef.current;
          if (room) {
            void unpublishMicTracks(room);
          } else {
            cleanupMicPipeline();
          }
        }
      };

      permissionStatus.addEventListener("change", onPermissionChange);
    };

    void watchPermission();

    return () => {
      cancelled = true;
      if (permissionStatus && onPermissionChange) {
        permissionStatus.removeEventListener("change", onPermissionChange);
      }
    };
  }, [cleanupMicPipeline, refreshMicPermission, unpublishMicTracks]);

  useEffect(() => {
    if (!hasJoinedVoice) return;

    let livekitRoom: LiveKitRoom | null = null;
    let cancelled = false;

    const connect = async () => {
      try {
        const tokenResponse = await fetchToken(roomId, userId, playerName);
        if (cancelled) return;
        setServerCanPublish(tokenResponse.canPublish ?? true);
        setPolicyReason(tokenResponse.policyReason ?? "ok");

        livekitRoom = new LiveKitRoom({
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: MIC_CAPTURE_OPTIONS,
          publishDefaults: MIC_PUBLISH_OPTIONS,
        });

        roomRef.current = livekitRoom;

        livekitRoom.on(RoomEvent.Connected, () => {
          if (!cancelled) setIsConnected(true);
        });

        livekitRoom.on(RoomEvent.Disconnected, () => {
          if (!cancelled) {
            setIsConnected(false);
            setIsMicOn(false);
          }
          cleanupMicPipeline();
          clearSpeakingListeners();
        });

        livekitRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
          if (cancelled) return;
          registerSpeakingListener(participant);
        });

        livekitRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
          if (cancelled) return;
          unregisterSpeakingListener(participant.identity);
        });

        livekitRoom.on(RoomEvent.TrackSubscribed, (_track, _pub, participant: RemoteParticipant) => {
          if (!cancelled) attachTrack(participant);
        });

        await livekitRoom.connect(LIVEKIT_URL, tokenResponse.token, { autoSubscribe: true });
        registerSpeakingListener(livekitRoom.localParticipant);
        livekitRoom.remoteParticipants.forEach((participant) => registerSpeakingListener(participant));

        if (cancelled) {
          livekitRoom.disconnect();
        }
      } catch (error) {
        console.warn("[DeceptionVoice] connect error", error);
        setPolicyReason("connect-failed");
      }
    };

    void connect();

    return () => {
      cancelled = true;
      livekitRoom?.disconnect();
      cleanupMicPipeline();
      clearSpeakingListeners();

      Object.values(audioEls.current).forEach((el) => {
        el.srcObject = null;
        el.remove();
      });
      audioEls.current = {};
    };
  }, [
    attachTrack,
    clearSpeakingListeners,
    cleanupMicPipeline,
    hasJoinedVoice,
    playerName,
    registerSpeakingListener,
    roomId,
    unregisterSpeakingListener,
    userId,
  ]);

  useEffect(() => {
    if (micAllowed && serverCanPublish) return;
    const room = roomRef.current;
    if (!room) return;

    if (isMicOn || room.localParticipant.audioTrackPublications.size > 0) {
      void unpublishMicTracks(room);
      setIsMicOn(false);
    }
  }, [isMicOn, micAllowed, serverCanPublish, unpublishMicTracks]);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room || !isConnected || isResettingMic || !micAllowed || !serverCanPublish) return;
    if (isTogglingMicRef.current) return;
    isTogglingMicRef.current = true;

    try {
      if (!isMicOn) {
        const permission = await refreshMicPermission();
        if (permission?.state === "denied") {
          setIsMicOn(false);
          return;
        }

        try {
          await room.startAudio();
          await publishMicTrack(room);
          setIsMicOn(true);
          void refreshMicPermission();
        } catch (error) {
          console.warn("[DeceptionVoice] mic enable failed", error);
          await unpublishMicTracks(room);
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
  }, [
    isConnected,
    isMicOn,
    isResettingMic,
    micAllowed,
    serverCanPublish,
    publishMicTrack,
    refreshMicPermission,
    unpublishMicTracks,
  ]);

  const resetMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room || !isConnected || isResettingMic || !micAllowed || !serverCanPublish) return;
    if (isTogglingMicRef.current) return;

    const hasOrphanTracks = room.localParticipant.audioTrackPublications.size > 0;
    if (!isMicOn && !hasOrphanTracks) return;

    const permission = await refreshMicPermission();
    if (permission?.state === "denied") {
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
    } catch (error) {
      console.warn("[DeceptionVoice] mic reset failed", error);
      cleanupMicPipeline();
      setIsMicOn(false);
      void refreshMicPermission();
    } finally {
      setIsResettingMic(false);
      isTogglingMicRef.current = false;
    }
  }, [
    cleanupMicPipeline,
    isConnected,
    isMicOn,
    isResettingMic,
    micAllowed,
    serverCanPublish,
    publishMicTrack,
    refreshMicPermission,
    unpublishMicTracks,
  ]);

  const setParticipantVolume = useCallback((participantId: string, volume: number) => {
    setVolumes((prev) => ({ ...prev, [participantId]: volume }));

    const room = roomRef.current;
    if (!room) return;

    room.remoteParticipants.forEach((participant) => {
      if (participant.identity === participantId) {
        participant.setVolume(volume / 100);
      }
    });
  }, []);

  const speakingOthers = players.filter(
    (player) => speakingIds.has(player.userId) && player.userId !== userId,
  );
  const iAmSpeaking = speakingIds.has(userId);

  const micToggleDisabled =
    !isConnected ||
    isResettingMic ||
    !micAllowed ||
    !serverCanPublish ||
    (micPermission === "denied" && !isMicOn);

  const hasOrphanTracks = roomRef.current?.localParticipant.audioTrackPublications.size ?? 0;
  const resetDisabled =
    !isConnected ||
    isResettingMic ||
    !micAllowed ||
    !serverCanPublish ||
    (!isMicOn && hasOrphanTracks === 0);

  const micToggleTitle = !isConnected
    ? "Voice is not connected"
    : !micAllowed
      ? "This role can only listen"
      : !serverCanPublish
        ? "Microphone publish disabled by server policy"
      : micPermission === "denied" && !isMicOn
        ? "Microphone permission denied"
        : isMicOn
          ? "Mute mic"
          : "Unmute mic";

  return (
    <>
      {!hideLauncher && (
        <div className="fixed bottom-3 left-3 z-50 pointer-events-auto">
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-lg backdrop-blur-md transition-all text-xs font-bold tracking-wide ${
              isConnected
                ? "bg-[rgba(6,12,22,0.72)] border-(--deception-cyan)/35 text-(--deception-cyan)"
                : "bg-[rgba(6,12,22,0.56)] border-(--deception-border) text-(--on-surface-variant)"
            }`}
            title="Voice chat"
            aria-label="Open voice panel"
          >
            {isMicOn ? (
              <Mic className={`h-3.5 w-3.5 ${iAmSpeaking ? "animate-pulse text-(--deception-cyan)" : ""}`} />
            ) : (
              <MicOff className="h-3.5 w-3.5 opacity-60" />
            )}

            <span>Voice</span>

            {!hasJoinedVoice ? (
              <span className="ml-1 text-[9px] font-bold uppercase text-(--deception-amber)">
                (not joined)
              </span>
            ) : !isConnected ? (
              <span className="ml-1 text-[9px] opacity-50">...</span>
            ) : null}

            {isConnected && speakingOthers.length > 0 && (
              <span className="max-w-24 truncate text-[9px] text-(--deception-cyan)">
                {speakingOthers.map((player) => player.name).join(", ")}
              </span>
            )}

            <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`} />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-start justify-start pointer-events-none p-3 pt-16">
          <div className="pointer-events-auto flex max-h-[calc(100dvh-6rem)] w-[min(300px,90vw)] flex-col overflow-hidden rounded-2xl border border-(--deception-border) bg-[rgba(7,13,24,0.96)] shadow-2xl backdrop-blur-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-(--deception-border) px-4 py-3">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-(--deception-cyan)" />
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-(--deception-cyan)">
                  Voice Chat
                </span>
                <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMic}
                  disabled={micToggleDisabled}
                  className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border transition-all ${
                    isMicOn
                      ? "bg-[rgba(0,212,255,0.18)] border-(--deception-cyan) text-(--deception-cyan)"
                      : "bg-[rgba(255,255,255,0.04)] border-(--deception-border) text-(--on-surface-variant)"
                  } ${micToggleDisabled ? "cursor-not-allowed opacity-60" : ""}`}
                  title={micToggleTitle}
                  aria-label={micToggleTitle}
                >
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>

                <button
                  onClick={resetMic}
                  disabled={resetDisabled}
                  className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border transition-all ${
                    resetDisabled
                      ? "cursor-not-allowed border-(--deception-border) bg-[rgba(255,255,255,0.03)] text-[rgba(255,255,255,0.25)]"
                      : "border-(--deception-border) bg-[rgba(255,255,255,0.04)] text-(--on-surface-variant)"
                  } ${isResettingMic ? "opacity-70" : ""}`}
                  title={isResettingMic ? "Resetting mic..." : "Reset mic"}
                  aria-label={isResettingMic ? "Resetting mic" : "Reset mic"}
                >
                  <RotateCcw className={`h-4 w-4 ${isResettingMic ? "animate-spin" : ""}`} />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 text-(--on-surface-variant) transition-colors hover:text-(--on-surface)"
                  aria-label="Close voice panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {hasJoinedVoice ? (
              <div className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
                {players.map((player) => {
                  const isSpeaking = speakingIds.has(player.userId);
                  const isMe = player.userId === userId;
                  const volume = volumes[player.userId] ?? 100;

                  return (
                    <div
                      key={player.userId}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${
                        isSpeaking
                          ? "border border-(--deception-cyan) bg-[rgba(0,212,255,0.12)]"
                          : "bg-[rgba(255,255,255,0.03)]"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all ${
                            isSpeaking
                              ? "border-(--deception-cyan) bg-[rgba(0,212,255,0.16)] text-(--deception-cyan)"
                              : "border-(--deception-border) bg-[rgba(255,255,255,0.04)] text-(--on-surface-variant)"
                          }`}
                        >
                          {player.name.charAt(0).toUpperCase()}
                        </div>

                        {isSpeaking && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 animate-pulse rounded-full border border-black bg-(--deception-cyan)" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[11px] font-bold ${isSpeaking ? "text-(--deception-cyan)" : "text-(--on-surface)"}`}>
                          {player.name}
                          {isMe ? " (you)" : ""}
                        </p>

                        {isSpeaking && (
                          <p className="text-[9px] uppercase tracking-[0.14em] text-(--deception-cyan)">
                            speaking
                          </p>
                        )}
                      </div>

                      {!isMe ? (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={volume}
                            onChange={(event) => {
                              setParticipantVolume(player.userId, Number(event.target.value));
                            }}
                            className="h-1 w-16 cursor-pointer accent-(--deception-cyan)"
                            aria-label={`Volume for ${player.name}`}
                          />
                          <span className="w-6 text-right text-[9px] text-(--on-surface-variant)">
                            {volume}
                          </span>
                        </div>
                      ) : (
                        <div className="shrink-0">
                          {isMicOn ? (
                            <Mic className="h-3.5 w-3.5 text-(--deception-cyan)" />
                          ) : (
                            <MicOff className="h-3.5 w-3.5 text-[rgba(255,255,255,0.35)]" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center space-y-4 px-6 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,212,255,0.12)]">
                  <Volume2 className="h-6 w-6 text-(--deception-cyan)" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-(--on-surface)">You are not in voice yet</h3>
                  <p className="text-[11px] leading-relaxed text-(--on-surface-variant)">
                    Join voice to hear discussion in real time.
                  </p>
                </div>
                <button
                  onClick={() => setHasJoinedVoice(true)}
                  className="deception-btn-cyan rounded-xl px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.16em]"
                >
                  Join Voice
                </button>
              </div>
            )}

            <div className="shrink-0 border-t border-(--deception-border) px-4 py-2">
              {!micAllowed && (
                <p className="mb-1 text-center text-[9px] uppercase tracking-[0.14em] text-(--deception-amber)">
                  This role can only listen
                </p>
              )}
              {serverCanPublish === false && micAllowed && (
                <p className="mb-1 text-center text-[9px] uppercase tracking-[0.14em] text-(--deception-amber)">
                  {policyReason === "forensic-muted"
                    ? "Forensic cannot speak during discussion"
                    : "Microphone publish disabled by server policy"}
                </p>
              )}
              {micPermission === "denied" && micAllowed && (
                <p className="mb-1 text-center text-[9px] uppercase tracking-[0.14em] text-(--deception-amber)">
                  Browser is blocking microphone access
                </p>
              )}
              <p className="text-center text-[9px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
                Powered by LiveKit
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
