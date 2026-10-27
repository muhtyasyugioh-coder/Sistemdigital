import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { simulateCircuit, generateTruthTable } from './src/services/simulator.ts';
import { generateCodeTemplates } from './src/services/codeGenerator.ts';
import { PRESET_CIRCUITS } from './src/services/presets.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // CORS headers for external developer API integration
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // REST API Routes
  app.get('/api/v1/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      engine: 'Sistem Digital SEM 5 Muhtyas Yugi Engine v1.0',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/v1/presets', (req: Request, res: Response) => {
    const list = Object.entries(PRESET_CIRCUITS).map(([key, circuit]) => ({
      key,
      name: circuit.name,
      description: circuit.description,
      nodeCount: circuit.nodes.length,
      wireCount: circuit.wires.length,
    }));
    res.json({ presets: list });
  });

  app.get('/api/v1/presets/:key', (req: Request, res: Response) => {
    const preset = PRESET_CIRCUITS[req.params.key];
    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' });
    }
    res.json({ circuit: preset });
  });

  app.post('/api/v1/simulate', (req: Request, res: Response) => {
    try {
      const { nodes, wires, maxIterations } = req.body;
      if (!Array.isArray(nodes) || !Array.isArray(wires)) {
        return res.status(400).json({ error: 'Invalid payload: nodes and wires must be arrays' });
      }

      const simulationResult = simulateCircuit(nodes, wires, maxIterations || 16);
      const truthTable = generateTruthTable(simulationResult.nodes, simulationResult.wires);

      res.json({
        success: true,
        nodes: simulationResult.nodes,
        wires: simulationResult.wires,
        changed: simulationResult.changed,
        truthTable,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Simulation error' });
    }
  });

  app.post('/api/v1/generate-code', (req: Request, res: Response) => {
    try {
      const { nodes, wires, language } = req.body;
      if (!Array.isArray(nodes) || !Array.isArray(wires)) {
        return res.status(400).json({ error: 'Invalid payload: nodes and wires must be arrays' });
      }

      const templates = generateCodeTemplates(nodes, wires);
      if (language && templates[language as keyof typeof templates]) {
        return res.json({ result: templates[language as keyof typeof templates] });
      }

      res.json({ templates });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Code generation error' });
    }
  });

  // Vite middleware in dev or static files in prod
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sistem Digital SEM 5 Muhtyas Yugi] Server running on port ${PORT}`);
  });
}

startServer();
