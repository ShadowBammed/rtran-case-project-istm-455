import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'contacts.db');

export function createDb(dbPath = DB_PATH) {
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const count = db.prepare('SELECT COUNT(*) AS cnt FROM contacts').get();
  if (count.cnt === 0) {
    const insert = db.prepare(
      'INSERT INTO contacts (name, email, phone, address) VALUES (?, ?, ?, ?)'
    );
    const seed = db.transaction(() => {
      insert.run('Alice Johnson', 'alice@example.com', '555-0101', '123 Maple St');
      insert.run('Bob Smith', 'bob@example.com', '555-0102', '456 Oak Ave');
      insert.run('Carol White', 'carol@example.com', '555-0103', '789 Pine Rd');
      insert.run('David Brown', 'david@example.com', '555-0104', '321 Elm Blvd');
      insert.run('Eva Green', 'eva@example.com', '555-0105', '654 Cedar Ln');
      insert.run('Frank Lee', 'frank@example.com', '555-0106', '987 Birch Dr');
      insert.run('Grace Kim', 'grace@example.com', '555-0107', '147 Walnut Ct');
      insert.run('Henry Adams', 'henry@example.com', '555-0108', '258 Spruce Way');
      insert.run('Iris Clark', 'iris@example.com', '555-0109', '369 Willow Pass');
      insert.run('Jack Davis', 'jack@example.com', '555-0110', '741 Aspen Pl');
    });
    seed();
  }

  return db;
}
