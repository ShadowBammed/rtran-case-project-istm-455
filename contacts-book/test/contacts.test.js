import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, 'test.db');

let app;
let db;

beforeAll(() => {
  db = createDb(TEST_DB);
  app = createApp(db);
});

afterAll(() => {
  db.close();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /contacts', () => {
  it('returns 10 seed contacts', async () => {
    const res = await request(app).get('/contacts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(10);
  });

  it('each contact has required fields', async () => {
    const res = await request(app).get('/contacts');
    for (const c of res.body) {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('email');
    }
  });
});

describe('GET /contacts/:id', () => {
  it('returns a single contact', async () => {
    const res = await request(app).get('/contacts/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 for missing contact', async () => {
    const res = await request(app).get('/contacts/9999');
    expect(res.status).toBe(404);
  });
});

describe('POST /contacts', () => {
  it('creates a new contact', async () => {
    const res = await request(app)
      .post('/contacts')
      .send({ name: 'Test User', email: 'test@example.com', phone: '555-9999' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test User');
    expect(res.body.id).toBeDefined();
  });

  it('rejects missing name', async () => {
    const res = await request(app)
      .post('/contacts')
      .send({ email: 'nope@example.com' });
    expect(res.status).toBe(400);
  });

  it('rejects missing email', async () => {
    const res = await request(app).post('/contacts').send({ name: 'No Email' });
    expect(res.status).toBe(400);
  });

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/contacts')
      .send({ name: 'Dup', email: 'alice@example.com' });
    expect(res.status).toBe(409);
  });
});

describe('PUT /contacts/:id', () => {
  it('updates an existing contact', async () => {
    const res = await request(app)
      .put('/contacts/2')
      .send({ name: 'Bob Updated', email: 'bob@example.com', phone: '555-0200' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Bob Updated');
  });

  it('returns 404 for missing contact', async () => {
    const res = await request(app)
      .put('/contacts/9999')
      .send({ name: 'Ghost', email: 'ghost@example.com' });
    expect(res.status).toBe(404);
  });

  it('rejects missing fields', async () => {
    const res = await request(app).put('/contacts/3').send({ phone: '555-0000' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /contacts/:id', () => {
  it('deletes a contact', async () => {
    const create = await request(app)
      .post('/contacts')
      .send({ name: 'To Delete', email: 'delete@example.com' });
    const id = create.body.id;

    const del = await request(app).delete(`/contacts/${id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/contacts/${id}`);
    expect(get.status).toBe(404);
  });

  it('returns 404 for missing contact', async () => {
    const res = await request(app).delete('/contacts/9999');
    expect(res.status).toBe(404);
  });
});
