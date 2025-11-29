# Assignment5 — UNO App (scaffold)

This folder contains a minimal monorepo scaffold for a UNO implementation (client + server + domain) modeled after the Yahtzee example.

Structure

- `domain/` — shared TypeScript types and helpers
- `client/` — Vite + React app using Apollo Client
- `server/` — minimal Apollo GraphQL server (TypeScript)

Quick start

1. From `Assignment5` run:

```bash
npm install
```

2. Start server (in separate terminal):

```bash
npm run start:server
```

3. Start client (in separate terminal):

```bash
npm run start:client
```

Notes

- Both client and server reference a local `domain` package.
- This scaffold is intentionally minimal; expand the schema and UI to implement full UNO rules.
