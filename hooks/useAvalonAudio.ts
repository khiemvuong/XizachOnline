import { useCallback, useEffect, useRef, type RefObject } from 'react';

type AudioTrackName = 'lobby' | 'win' | 'lose';

const AVALON_AUDIO_SOURCES: Record<AudioTrackName, string> = {
  lobby: '/audio/lobby.opt.ogg',
  win: '/audio/win.opt.ogg',
  lose: '/audio/lose.opt.ogg',
};

const getOrCreateAudio = (
  ref: { current: HTMLAudioElement | null },
  src: string,
  options?: { loop?: boolean; volume?: number; preload?: 'none' | 'metadata' | 'auto' }
) => {
  if (typeof window === 'undefined') return null;
  if (!ref.current) {
    const audio = new window.Audio(src);
    audio.loop = options?.loop ?? false;
    audio.volume = options?.volume ?? 0.5;
    audio.preload = options?.preload ?? 'metadata';
    ref.current = audio;
  }
  return ref.current;
};

const stopAudio = (audio: HTMLAudioElement | null, reset = false) => {
  if (!audio) return;
  audio.pause();
  if (reset) {
    audio.currentTime = 0;
  }
};

const safePlay = (audio: HTMLAudioElement) => {
  void audio.play().catch(() => undefined);
};

export function useAvalonAudio({
  gamePhase,
  gameWinner,
  isLobbyMusicEnabled,
  winAudioRef,
  loseAudioRef,
}: {
  gamePhase?: string;
  gameWinner?: string | null;
  isLobbyMusicEnabled: boolean;
  winAudioRef: RefObject<HTMLAudioElement | null>;
  loseAudioRef: RefObject<HTMLAudioElement | null>;
}) {
  const lobbyAudioRef = useRef<HTMLAudioElement | null>(null);
  const raiseHandAudioContextRef = useRef<AudioContext | null>(null);
  const playedGameOverWinnerRef = useRef<'Good' | 'Evil' | null>(null);

  // Play Chime Logic
  const playRaiseHandChime = useCallback(() => {
    if (typeof window === 'undefined') return;

    const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    if (!raiseHandAudioContextRef.current) {
      raiseHandAudioContextRef.current = new AudioContextCtor();
    }

    const context = raiseHandAudioContextRef.current;
    if (!context) return;

    if (context.state === 'suspended') {
      void context.resume();
    }

    const startAt = context.currentTime;

    const playTone = (
      frequency: number,
      offset: number,
      duration: number,
      peak: number,
      type: OscillatorType = 'triangle',
      detune = 0,
    ) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startAt + offset);
      oscillator.detune.setValueAtTime(detune, startAt + offset);

      gainNode.gain.setValueAtTime(0.0001, startAt + offset);
      gainNode.gain.exponentialRampToValueAtTime(peak, startAt + offset + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + offset + duration);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(startAt + offset);
      oscillator.stop(startAt + offset + duration);
    };

    playTone(620, 0, 0.1, 0.045, 'triangle');
    playTone(860, 0.055, 0.12, 0.06, 'triangle', 6);
    playTone(1180, 0.125, 0.1, 0.042, 'sine');
  }, []);

  // Cleanup Audio Context
  useEffect(() => {
    return () => {
      if (raiseHandAudioContextRef.current) {
        void raiseHandAudioContextRef.current.close();
        raiseHandAudioContextRef.current = null;
      }
    };
  }, []);

  // Sync Game Track (Lobby, GameOver)
  useEffect(() => {
    if (!gamePhase) return;

    const stopEndTracks = () => {
      stopAudio(winAudioRef.current, true);
      stopAudio(loseAudioRef.current, true);
    };

    if (gamePhase === 'LOBBY') {
      playedGameOverWinnerRef.current = null;
      stopEndTracks();

      if (isLobbyMusicEnabled) {
        const lobbyTrack = getOrCreateAudio(lobbyAudioRef, AVALON_AUDIO_SOURCES.lobby, {
          loop: true,
          volume: 0.35,
          preload: 'auto',
        });
        if (lobbyTrack) safePlay(lobbyTrack);
      } else {
        stopAudio(lobbyAudioRef.current, true);
      }

      return;
    }

    stopAudio(lobbyAudioRef.current, true);

    if (gamePhase !== 'GAME_OVER') {
      playedGameOverWinnerRef.current = null;
      stopEndTracks();
      return;
    }

    if (gameWinner !== 'Good' && gameWinner !== 'Evil') {
      stopEndTracks();
      return;
    }

    if (playedGameOverWinnerRef.current === gameWinner) {
      return;
    }

    stopEndTracks();
    const endTrack =
      gameWinner === 'Good'
        ? getOrCreateAudio(winAudioRef, AVALON_AUDIO_SOURCES.win, { volume: 0.55, preload: 'auto' })
        : getOrCreateAudio(loseAudioRef, AVALON_AUDIO_SOURCES.lose, { volume: 0.75, preload: 'auto' });

    if (endTrack) {
      endTrack.currentTime = 0;
      safePlay(endTrack);
    }
    
    playedGameOverWinnerRef.current = gameWinner;
  }, [gamePhase, gameWinner, isLobbyMusicEnabled, winAudioRef, loseAudioRef]);

  // Method to manually unlock audio on interaction (for Safari)
  const unlockAudio = useCallback(() => {
    [
      { ref: winAudioRef, src: AVALON_AUDIO_SOURCES.win },
      { ref: loseAudioRef, src: AVALON_AUDIO_SOURCES.lose }
    ].forEach(({ ref, src }) => {
      const a = getOrCreateAudio(ref, src, { preload: 'auto' });
      if (a) {
        a.play().then(() => a.pause()).catch(() => {});
      }
    });
  }, [winAudioRef, loseAudioRef]);

  return { playRaiseHandChime, unlockAudio };
}
