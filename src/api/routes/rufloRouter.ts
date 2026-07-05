import { Router } from 'express';
import { mcpManager } from '../../services/mcp/McpManager.js';

const router = Router();

router.get('/status', async (_req, res) => {
  try {
    const enabled = process.env.RUFLO_ENABLED === 'true';
    if (enabled) {
      await mcpManager.initialize(process.cwd());
    }
    const instance = mcpManager.getInstance('ruflo');
    const tools = instance?.tools.map((t: any) => t.name) ?? [];
    res.json({
      enabled,
      connected: !!instance,
      toolCount: tools.length,
      tools,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/call', async (req, res) => {
  try {
    const enabled = process.env.RUFLO_ENABLED === 'true';
    if (!enabled) {
      return res.status(403).json({ error: 'Ruflo is not enabled. Set RUFLO_ENABLED=true.' });
    }
    await mcpManager.initialize(process.cwd());
    const { tool, args = {} } = req.body;
    if (!tool || typeof tool !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "tool" field.' });
    }
    const result = await mcpManager.callTool(tool, args, `ruflo_call_${Date.now()}`);
    res.json({ ok: true, result });
  } catch (err: any) {
    console.error('[rufloRouter] callTool error:', err);
    res.status(500).json({ error: err.message || 'Ruflo tool call failed.' });
  }
});

export default router;
