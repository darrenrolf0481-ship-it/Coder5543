import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const execAsync = promisify(exec);
const router = Router();

// One distinct voice per personality ID
const VOICE_MAP: Record<number, string> = {
  1: 'en-US-AriaNeural',        // ADHD Sage — warm, authoritative female
  2: 'en-US-JennyNeural',       // Frontend Master — friendly female
  3: 'en-US-GuyNeural',         // Backend Guru — calm male
  4: 'en-US-DavisNeural',       // Fullstack Architect — confident male
  5: 'en-GB-RyanNeural',        // DevOps Engineer — British male
  6: 'en-US-TonyNeural',        // Security Auditor — serious male
  7: 'en-US-BrandonNeural',     // Sage 7 — measured male
  8: 'en-GB-SoniaNeural',       // Projscan Intelligence — precise British female
};

const DEFAULT_VOICE = 'en-US-AriaNeural';

// Strip markdown so TTS doesn't read raw symbols
function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, 'code block omitted')
    .replace(/`[^`]+`/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/>\s/g, '')
    .replace(/[-*+]\s/g, '')
    .trim();
}

router.post('/speak', async (req: Request, res: Response) => {
  const { text, personalityId } = req.body as { text?: string; personalityId?: number };

  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  const voice = VOICE_MAP[personalityId ?? 0] ?? DEFAULT_VOICE;
  const clean = stripMarkdown(text).slice(0, 500); // cap length

  const tmpFile = path.join(os.tmpdir(), `tts_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);

  try {
    // edge-tts escapes its own args; wrap text in single quotes with escaping
    const safeText = clean.replace(/'/g, "'\\''");
    await execAsync(`python3 -m edge_tts --voice "${voice}" --text '${safeText}' --write-media "${tmpFile}"`);

    const audio = await fs.readFile(tmpFile);
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'no-cache');
    res.send(audio);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'TTS failed' });
  } finally {
    fs.unlink(tmpFile).catch(() => {});
  }
});

export default router;
