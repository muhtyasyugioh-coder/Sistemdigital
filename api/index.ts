import express from 'express';
import { configureApiRoutes } from '../src/serverApp';

const app = express();

// Pasang rute API
configureApiRoutes(app);

// Export handler untuk Vercel Serverless Function
export default app;
