# PasswordGuard

Privacy-first password security analyzer (MERN + TypeScript).

## Status
- [x] `server/` — Express API: auth (Argon2id, JWT + rotating refresh cookies, reset flow), private history, admin analytics, security middleware, tests
- [x] `client/` — React + TypeScript + Vite + Tailwind: landing, analyzer (zxcvbn-ts + custom patterns + HIBP k-anonymity), auth pages, dashboard, admin (Recharts)
- [ ] Playwright e2e, ESLint config, Vercel/Render deploy configs (Stage 4)

## Run the backend
```bash
cd server
cp .env.example .env     # fill MONGODB_URI and JWT_ACCESS_SECRET
npm install
npm run dev              # http://localhost:4000/api/health
npm test                 # 6 tests, no database needed
npm run seed:admin       # after setting ADMIN_EMAIL / ADMIN_PASSWORD
```

## API
| Method | Path | Auth |
|---|---|---|
| POST | /api/auth/register, /login | – |
| POST | /api/auth/refresh, /logout | cookie + `X-Requested-With: PasswordGuard` |
| GET | /api/auth/me | Bearer |
| POST | /api/auth/forgot-password, /reset-password | – |
| POST/GET/DELETE | /api/analyses, /api/analyses/:id | Bearer |
| GET | /api/analyses/stats | Bearer |
| GET | /api/admin/stats, /api/admin/users | Bearer + admin |

## Privacy rule
The raw password is analysed in the browser only. `POST /api/analyses` stores metadata (score, category, patterns) and rejects any unknown field, including `password`.

## Run the client
```bash
cd client
npm install
npm run dev     # http://localhost:5173 (proxies /api to :4000)
npm test        # 14 tests
npm run build
```
Start the server first (see above) so login/history work. The analyzer itself works without the server.

## Deployment notes
- Client on Vercel, API on Render/Railway. Set `VITE_API_URL` on the client and `CLIENT_ORIGIN` on the server.
- When client and API are on different sites set `COOKIE_SAMESITE=none` (needs HTTPS). The server's Origin + `X-Requested-With` check provides CSRF protection.
