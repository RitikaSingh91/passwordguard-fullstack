import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app';

describe('API (no database required)', () => {
  it('health check works and sends security headers', async () => {
    const r = await request(app).get('/api/health');
    expect(r.status).toBe(200);
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['x-powered-by']).toBeUndefined();
  });

  it('rejects unauthenticated access to history and admin', async () => {
    expect((await request(app).get('/api/analyses')).status).toBe(401);
    expect((await request(app).get('/api/admin/stats')).status).toBe(401);
  });

  it('rejects weak account passwords', async () => {
    const r = await request(app).post('/api/auth/register').send({ name: 'Ann', email: 'a@b.co', password: 'short' });
    expect(r.status).toBe(400);
  });

  it('rejects NoSQL operator injection in login', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: 'x' });
    expect(r.status).toBe(400);
  });

  it('requires auth before history accepts any body', async () => {
    const r = await request(app).post('/api/analyses').set('Authorization', 'Bearer bad').send({ password: 'hunter2' });
    expect(r.status).toBe(401);
  });

  it('blocks refresh/logout without the CSRF header or from a foreign origin', async () => {
    expect((await request(app).post('/api/auth/refresh')).status).toBe(403);
    const r = await request(app).post('/api/auth/logout').set('Origin', 'https://evil.example').set('X-Requested-With', 'PasswordGuard');
    expect(r.status).toBe(403);
  });
});
