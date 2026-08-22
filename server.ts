import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { agentOrchestrator } from './server/agentOrchestrator';
import { mem0Store } from './server/mem0Store';
import { skillManager } from './server/skillManager';
import { runCliCommand } from './server/cliRunner';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // API Routes FIRST
  // ==========================================
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      mem0Count: mem0Store.listMemories().length,
      skillsCount: skillManager.getAllSkills().filter(s => !!s.content).length,
    });
  });

  // Start research run
  app.post('/api/research/start', async (req, res) => {
    try {
      const { topic, triggerCallbackDemo, forcePatternCheck } = req.body;
      if (!topic || typeof topic !== 'string' || topic.trim() === '') {
        return res.status(400).json({ error: 'Topic is required' });
      }

      // Execute asynchronously and return run state
      const runPromise = agentOrchestrator.executeResearch(topic.trim(), {
        triggerCallbackDemo: !!triggerCallbackDemo,
        forcePatternCheck: !!forcePatternCheck,
      });

      // If client wants direct await or async
      const run = await runPromise;
      res.json(run);
    } catch (err: any) {
      console.error('Error starting research:', err);
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // Get run status by ID
  app.get('/api/research/status/:id', (req, res) => {
    const run = agentOrchestrator.getRun(req.params.id);
    if (!run) {
      return res.status(404).json({ error: 'Research run not found' });
    }
    res.json(run);
  });

  // Get all run history
  app.get('/api/research/history', (req, res) => {
    res.json(agentOrchestrator.getAllRuns());
  });

  // Mem0 MCP endpoints
  app.get('/api/mem0/memories', (req, res) => {
    const query = req.query.q as string;
    const category = req.query.category as string;
    if (query) {
      const results = mem0Store.searchMemory(query);
      return res.json(results);
    }
    const results = mem0Store.listMemories(category ? { category } : undefined);
    res.json(results);
  });

  app.post('/api/mem0/memory', (req, res) => {
    try {
      const { text, category, relations, tags } = req.body;
      if (!text) return res.status(400).json({ error: 'Text is required' });
      const result = mem0Store.addMemories([{ text, category, relations, tags }], 'orchestrator');
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/mem0/memory/:id', (req, res) => {
    const success = mem0Store.deleteMemory(req.params.id);
    res.json({ success });
  });

  app.post('/api/mem0/reset', (req, res) => {
    mem0Store.resetMemories();
    res.json({ success: true, message: 'Mem0 long-term memory reset to cold-start zero state.' });
  });

  // Autonomous Skills endpoints
  app.get('/api/skills', (req, res) => {
    res.json(skillManager.getAllSkills());
  });

  app.post('/api/skills/check', async (req, res) => {
    try {
      const { agent, topic, outputSnippet } = req.body;
      const mems = mem0Store.listMemories();
      const result = await skillManager.patternCheckAndGenerate(agent || 'research', mems, {
        topic: topic || 'Manual Pattern Check',
        outputSnippet: outputSnippet || '',
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/skills/reset', (req, res) => {
    skillManager.resetSkills();
    res.json({ success: true, message: 'All agent SKILL.md files reset to cold-start zero state.' });
  });

  // CLI execution endpoint for web terminal
  app.post('/api/cli/execute', async (req, res) => {
    try {
      const { command } = req.body;
      if (!command) return res.json({ output: 'No command provided.' });
      
      // Parse shell arguments safely
      const matchRegex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
      const args: string[] = [];
      let match;
      while ((match = matchRegex.exec(command)) !== null) {
        args.push(match[1] || match[2] || match[0]);
      }

      const output = await runCliCommand(args);
      res.json({ output });
    } catch (err: any) {
      res.status(500).json({ output: `Execution Error: ${err.message}` });
    }
  });

  // ==========================================
  // Vite Middleware Setup
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Research Team Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
