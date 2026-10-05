# Recurve Tuning Simulator

A web-based simulator for exploring how a recurve bow and arrow setup behaves when a parameter changes. The model reports tendencies (weak / stiff, left / right), not exact predictions.

- Specification: [recurve-tuning-simulator-spec.md](recurve-tuning-simulator-spec.md)
- Phase tracker: [ROADMAP.md](ROADMAP.md)

## Requirements

- Node.js 22 or newer
- npm

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the dev server |
| `npm test` | Run unit tests once |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | Lint with oxlint |
| `npm run format` | Format source files with Prettier |
| `npm run build` | Type-check and build for production |

## Layout

```text
src/
├── engine/      simulation model, pure TypeScript
├── models/      data types and parameter metadata
├── utils/       unit conversion, validation
├── state/       Zustand store
├── storage/     setup persistence
├── components/  React UI
└── pages/
```

`engine/`, `models/` and `utils/` must not import React or UI code. The lint config enforces this.
