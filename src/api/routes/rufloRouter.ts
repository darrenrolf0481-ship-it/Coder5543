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

export default router;
