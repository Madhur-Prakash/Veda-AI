import type { Request, Response } from 'express';
import { toolkitService, type ToolId } from '@/services/toolkit.service.js';

export async function runTool(req: Request, res: Response) {
  const { toolId, prompt } = req.body as { toolId: ToolId; prompt: string };
  const result = await toolkitService.run(toolId, prompt);
  res.json({ data: { result } });
}
