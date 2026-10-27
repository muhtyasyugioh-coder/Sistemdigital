import express, { Express, Request, Response } from 'express';
import { simulateCircuit, generateTruthTable } from './services/simulator';
import { generateCodeTemplates } from './services/codeGenerator';
import { PRESET_CIRCUITS } from './services/presets';

/**
 * Konfigurasi rute API untuk Express.
 * Digunakan bersama oleh server.ts (Local/Node) dan api/index.ts (Vercel Serverless Function).
 */
export function configureApiRoutes(app: Express): Express {
  app.use(express.json({ limit: '10mb' }));

  // CORS headers agar API dapat diakses oleh platform atau developer eksternal
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  const apiRouter = express.Router();

  // 1. Health check
  apiRouter.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      engine: 'Sistem Digital SEM 5 Muhtyas Yugi Engine v1.0',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Daftar Preset
  apiRouter.get('/presets', (req: Request, res: Response) => {
    const list = Object.entries(PRESET_CIRCUITS).map(([key, circuit]) => ({
      key,
      name: circuit.name,
      description: circuit.description,
      nodeCount: circuit.nodes.length,
      wireCount: circuit.wires.length,
    }));
    res.json({ presets: list });
  });

  // 3. Detail Preset tertentu
  apiRouter.get('/presets/:key', (req: Request, res: Response) => {
    const key = req.params.key as keyof typeof PRESET_CIRCUITS;
    const preset = PRESET_CIRCUITS[key];
    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' });
    }
    res.json({ circuit: preset });
  });

  // 4. Simulasi Rangkaian & Tabel Kebenaran
  apiRouter.post('/simulate', (req: Request, res: Response) => {
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

  // 5. Generator Kode Pemrograman
  apiRouter.post('/generate-code', (req: Request, res: Response) => {
    try {
      const { nodes, wires, language } = req.body;
      if (!Array.isArray(nodes) || !Array.isArray(wires)) {
        return res.status(400).json({ error: 'Invalid payload: nodes and wires must be arrays' });
      }

      const templates = generateCodeTemplates(nodes, wires);
      if (language && (templates as any)[language]) {
        return res.json({ result: (templates as any)[language] });
      }

      res.json({ templates });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Code generation error' });
    }
  });

  // Info endpoint untuk API root (tersedia di /api dan /api/v1)
  apiRouter.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'Sistem Digital SEM 5 Muhtyas Yugi API',
      status: 'active',
      endpoints: ['/api/v1/health', '/api/v1/presets', '/api/v1/simulate', '/api/v1/generate-code'],
    });
  });

  // Pasang router pada prefix path API agar tidak menabrak rute frontend SPA (/)
  app.use('/api/v1', apiRouter);
  app.use('/v1', apiRouter);
  app.use('/api', apiRouter);

  return app;
}
