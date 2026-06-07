import { Router } from 'express';
import { brainService } from '../../services/brain/brainService.js';
import { PainType } from '../../services/brain/types.js';
import { spawn } from 'child_process';

const router = Router();

router.post('/context', async (req, res) => {
  const { input, personalityId } = req.body as { input?: string; personalityId?: number };
  if (!input) { res.status(400).json({ error: 'input required' }); return; }
  const [context, mode] = await Promise.all([
    brainService.prepareContext(input, personalityId),
    brainService.resolveOperationMode(input), // resolveOperationMode could also benefit from personalityId in future
  ]);
  res.json({ context, mode });
});

router.get('/endocrine', (_req, res) => {
  res.json(brainService.getEndocrineState());
});

router.post('/feedback', async (req, res) => {
  const { context, success, errorIntensity } = req.body as {
    context?: string; success?: boolean; errorIntensity?: number;
  };
  if (context === undefined || success === undefined) {
    res.status(400).json({ error: 'context and success required' }); return;
  }
  await brainService.processFeedback(context, success, errorIntensity ?? 0.5);
  res.json({ ok: true, endocrine: brainService.getEndocrineState() });
});

router.post('/pain', async (req, res) => {
  const { type, intensity, context } = req.body as {
    type?: string; intensity?: number; context?: string;
  };
  if (!type || !context || intensity === undefined) {
    res.status(400).json({ error: 'type, intensity, and context required' }); return;
  }
  if (!Object.values(PainType).includes(type as PainType)) {
    res.status(400).json({ error: `type must be one of: ${Object.values(PainType).join(', ')}` }); return;
  }
  await brainService.getPainPathway().processPainSignal(type as PainType, intensity, context);
  res.json({ ok: true, endocrine: brainService.getEndocrineState() });
});

router.post('/sleep', async (_req, res) => {
  const result = await brainService.sleepCycle();
  res.json(result);
});

router.post('/record', async (req, res) => {
  const { input, response, outcome } = req.body as {
    input?: string; response?: string; outcome?: 'success' | 'failure' | 'neutral';
  };
  if (!input || !response || !outcome) {
    res.status(400).json({ error: 'input, response, and outcome required' });
    return;
  }
  await brainService.recordInteraction(input, response, outcome);
  res.json({ ok: true, endocrine: brainService.getEndocrineState() });
});

// Python Brain Bridge
router.post('/python-process', (req, res) => {
  const { perception, intent, is_danger, agent_id } = req.body as {
    perception?: string;
    intent?: string;
    is_danger?: boolean;
    agent_id?: string;
  };
  if (!perception || !intent) {
    res.status(400).json({ error: 'perception and intent required' });
    return;
  }

  const payload = JSON.stringify({
    perception,
    intent,
    is_danger: !!is_danger,
    agent_id: agent_id || 'anonymous',
  });

  const python = spawn('python3', ['python-backend/brain_cli.py'], {
    cwd: process.cwd(),
    env: { ...process.env, PYTHONPATH: process.cwd() },
  });

  let stdout = '';
  let stderr = '';

  python.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
  python.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

  python.on('close', (code) => {
    if (code !== 0) {
      res.status(500).json({ error: 'Python brain failed', detail: stderr });
      return;
    }
    try {
      res.json(JSON.parse(stdout));
    } catch {
      res.status(500).json({ error: 'Invalid JSON from Python brain', raw: stdout });
    }
  });

  python.stdin.write(payload);
  python.stdin.end();
});

export default router;
