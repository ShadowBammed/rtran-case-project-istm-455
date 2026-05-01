import { Router } from 'express';

export function contactsRouter(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM contacts ORDER BY id').all();
    res.json(rows);
  });

  router.get('/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });

  router.post('/', (req, res) => {
    const { name, email, phone, address } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }
    try {
      const result = db
        .prepare('INSERT INTO contacts (name, email, phone, address) VALUES (?, ?, ?, ?)')
        .run(name, email, phone || null, address || null);
      const created = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(created);
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      throw err;
    }
  });

  router.put('/:id', (req, res) => {
    const { name, email, phone, address } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }
    const existing = db.prepare('SELECT id FROM contacts WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    try {
      db.prepare(
        'UPDATE contacts SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?'
      ).run(name, email, phone || null, address || null, req.params.id);
      const updated = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
      res.json(updated);
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      throw err;
    }
  });

  router.delete('/:id', (req, res) => {
    const existing = db.prepare('SELECT id FROM contacts WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
    res.status(204).send();
  });

  return router;
}
