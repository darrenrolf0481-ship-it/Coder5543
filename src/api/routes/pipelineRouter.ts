import { Router } from 'express';
import { EventEmitter } from 'events';
import logger from '../../utils/logger.js';

export const serverBus = new EventEmitter();
serverBus.setMaxListeners(50);

export interface ServerSignal {
  id: string;
  type: string;
  source: string;
  data: unknown;
  timestamp: number;
}

const serverDLQ: ServerSignal[] = [];
const DLQ_MAX = 100;

let _seq = 0;
function newId(): string {
  return `srv-${Date.now().toString(36)}-${(++_seq).toString(36)}`;
}

const router = Router();

router.get('/status', (_req, res) => {
  res.json({
    status: 'operational',
    stages: ['ingestion', 'filtering', 'pattern_injection'],
    dlqDepth: serverDLQ.length,
    timestamp: Date.now(),
  });
});

router.get('/dlq', (_req, res) => {
  res.json({ count: serverDLQ.length, items: serverDLQ });
});

router.post('/dlq/retry', (req, res) => {
  const { id } = req.body as { id?: string };
  if (!id) {
    res.status(400).json({ error: 'id required' });
    return;
  }
  const idx = serverDLQ.findIndex((s) => s.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Signal not found in DLQ' });
    return;
  }
  const [signal] = serverDLQ.splice(idx, 1);
  logger.info(`[Pipeline] Retrying signal ${signal.id} from DLQ`);
  serverBus.emit('signal', { ...signal, retried: true });
  res.json({ replayed: signal.id });
});

router.delete('/dlq', (_req, res) => {
  const count = serverDLQ.length;
  serverDLQ.length = 0;
  logger.info(`[Pipeline] Cleared ${count} items from DLQ`);
  res.json({ cleared: count });
});

router.post('/inject', (req, res) => {
  const { type, source, data } = req.body as Partial<ServerSignal>;
  if (!type || !source || data === undefined) {
    res.status(400).json({ error: 'type, source, and data are required' });
    return;
  }
  const signal: ServerSignal = { id: newId(), type, source, data, timestamp: Date.now() };

  try {
    const dataSize = JSON.stringify(data).length;
    if (dataSize > 64_000) {
      logger.warn(
        `[Pipeline] Signal ${signal.id} payload too large (${dataSize} bytes). Moving to DLQ.`,
      );
      if (serverDLQ.length < DLQ_MAX) serverDLQ.push(signal);
      res.status(413).json({ error: 'Payload too large — moved to DLQ', id: signal.id });
      return;
    }
  } catch {
    logger.error(`[Pipeline] Unserializable payload from ${source}`);
    res.status(400).json({ error: 'Unserializable payload' });
    return;
  }

  logger.info(
    `[Pipeline] Injected signal: ${signal.type} from ${signal.source} (id: ${signal.id})`,
  );
  serverBus.emit('signal', signal);
  res.status(202).json({ accepted: true, id: signal.id });
});

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // @ts-ignore
  if (res.flushHeaders) res.flushHeaders();

  logger.info(`[Pipeline] Client connected to events SSE stream`);

  const onSignal = (signal: ServerSignal) => {
    res.write(`data: ${JSON.stringify(signal)}\n\n`);
  };

  serverBus.on('signal', onSignal);

  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 25_000);

  req.on('close', () => {
    logger.info(`[Pipeline] Client disconnected from events SSE stream`);
    clearInterval(heartbeat);
    serverBus.off('signal', onSignal);
  });
});

export default router;
