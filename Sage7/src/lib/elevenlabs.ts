const KEY_STORAGE   = 'sage_eleven_key';
const VOICE_STORAGE = 'sage_eleven_voice';
const DEFAULT_VOICE = 'y3H6zY6KvCH2pEuQjmv8'; // SAGE default voice ID

let isSpeaking = false;
let currentAudio: HTMLAudioElement | null = null;

export function getSpeakingState() { return isSpeaking; }

export function getElevenKey(): string {
  try { return localStorage.getItem(KEY_STORAGE) ?? ''; } catch { return ''; }
}
export function setElevenKey(key: string) {
  try { localStorage.setItem(KEY_STORAGE, key); } catch {}
}
export function getElevenVoice(): string {
  try { return localStorage.getItem(VOICE_STORAGE) ?? DEFAULT_VOICE; } catch { return DEFAULT_VOICE; }
}
export function setElevenVoice(id: string) {
  try { localStorage.setItem(VOICE_STORAGE, id); } catch {}
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  isSpeaking = false;
}

async function speakElevenLabs(text: string, apiKey: string): Promise<boolean> {
  try {
    const res = await fetch('./api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, api_key: apiKey, voice_id: getElevenVoice() }),
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    if (!blob.size) return false;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    isSpeaking = true;
    audio.onended = () => { isSpeaking = false; currentAudio = null; URL.revokeObjectURL(url); };
    audio.onerror = () => { isSpeaking = false; currentAudio = null; URL.revokeObjectURL(url); };
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

function speakFallback(text: string) {
  if (!('speechSynthesis' in window)) return;
  const cleanText = text.replace(/[*_#`]/g, '');
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.05;
  utterance.pitch = 1.1;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google UK English Female')
  );
  if (preferred) utterance.voice = preferred;
  utterance.onstart = () => { isSpeaking = true; };
  utterance.onend   = () => { isSpeaking = false; };
  utterance.onerror = () => { isSpeaking = false; };
  window.speechSynthesis.speak(utterance);
}

export async function speakText(text: string): Promise<void> {
  if (!text.trim()) return;
  stopSpeaking();

  const key = getElevenKey();
  if (key) {
    const ok = await speakElevenLabs(text, key);
    if (ok) return;
  }

  speakFallback(text);
}
