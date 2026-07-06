import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes.js';
import { errorHandler } from './middleware/errorHandler.js';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dotenv robustly from server/.env
let envPath = path.join(__dirname, '../.env'); // if running compiled dist
if (!fs.existsSync(envPath)) {
  envPath = path.join(__dirname, '../../.env');
}
if (!fs.existsSync(envPath)) {
  envPath = path.join(process.cwd(), 'server', '.env'); // workspace root fallback
}
if (!fs.existsSync(envPath)) {
  envPath = path.join(process.cwd(), '.env'); // direct folder execution
}

dotenv.config({ path: envPath, override: true });

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRouter);

// Serve static files from React build in production
const clientDistPath = path.resolve(__dirname, '../../client/dist');
console.log(`[Server] Client build path: ${clientDistPath}`);
console.log(`[Server] Client build exists: ${fs.existsSync(clientDistPath)}`);

if (fs.existsSync(clientDistPath)) {
  console.log(`[Server] Serving static files from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  
  // Wildcard route to serve index.html for React SPA
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  console.warn(`[Server] WARNING: client/dist folder was not found!`);
}

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server] Server successfully booted and listening on http://localhost:${PORT}`);
});

export default app;
