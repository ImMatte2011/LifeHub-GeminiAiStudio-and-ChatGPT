import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { authenticateRequest } from './server/middleware/auth.js';
import authRouter from './server/routes/auth.js';
import coreRouter from './server/routes/core.js';
import metaRouter from './server/routes/meta.js';
import sharedRouter from './server/routes/shared.js';
import peopleRouter from './server/routes/people.js';
import placesRouter from './server/routes/places.js';
import eventsRouter from './server/routes/events.js';
import knowledgeRouter from './server/routes/knowledge.js';
import buildingsRouter from './server/routes/buildings.js';
import extensionsRouter from './server/routes/extensions.js';
import searchRouter from './server/routes/search.js';
import databasesRouter from './server/routes/databases.js';
import translationRouter from './server/routes/translation.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.text({ type: ['text/yaml', 'application/x-yaml', 'text/plain'] }));

  // Global stateless per-request authentication middleware
  app.use('/api', authenticateRequest);

  // API Routes
  app.use('/api/core/auth', authRouter);
  app.use('/api/core', coreRouter);
  app.use('/api/meta', metaRouter);
  app.use('/api/shared', sharedRouter);
  app.use('/api/people', peopleRouter);
  app.use('/api/places', placesRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/knowledge', knowledgeRouter);
  app.use('/api/buildings', buildingsRouter);
  app.use('/api/extensions', extensionsRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/databases', databasesRouter);
  app.use('/api/translate', translationRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      platform: 'LifeHub Core v1.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Vite middleware for development vs static dist for production
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
    console.log(`[LifeHub] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
