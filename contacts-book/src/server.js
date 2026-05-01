import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './app.js';
import { createDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certPath = path.join(__dirname, '..', 'certs', 'server.pem');

if (!fs.existsSync(certPath)) {
  console.error('certs/server.pem not found. Run: npm run gen-cert');
  process.exit(1);
}

// server.pem contains both private key and certificate concatenated
const pem = fs.readFileSync(certPath, 'utf8');

const db = createDb();
const app = createApp(db);
const PORT = process.env.PORT || 3443;

https
  .createServer({ key: pem, cert: pem }, app)
  .listen(PORT, () => console.log(`HTTPS server listening on port ${PORT}`));
