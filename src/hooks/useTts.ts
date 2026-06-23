import { useCallback, useRef, useState } from 'react';
import { resolveApiUrl } from '../utils/apiUrl';

export function useTts(personalityId: number) {
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(
    async (text: string) => {
      if (muted || !text.trim()) return;

      // Cancel any currently playing speech
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      try {
        const res = await fetch(resolveApiUrl('tts/speak'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, personalityId }),
        });

        if (!res.ok) return;

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => URL.revokeObjectURL(url);
        audio.play().catch(() => {});
      } catch {
        // TTS is non-critical — swallow errors silently
      }
    },
    [muted, personalityId],
  );

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      if (!prev) stop(); // stop current speech when muting
      return !prev;
    });
  }, [stop]);

  return { speak, stop, muted, toggleMute };
}
