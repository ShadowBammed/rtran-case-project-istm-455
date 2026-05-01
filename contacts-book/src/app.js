import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createDb } from './db.js';
import { contactsRouter } from './routes/contacts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(db) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/contacts', contactsRouter(db));

  return app;
}

// Allow direct HTTP run: node src/app.js
const isMain = process.argv[1] && process.argv[1].endsWith('app.js');
if (isMain) {
  const db = createDb();
  const app = createApp(db);
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`HTTP server on port ${PORT}`));
}
