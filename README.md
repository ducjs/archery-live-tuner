# Recurve Tuning Simulator

A web-based simulator for exploring how a recurve bow and arrow setup behaves when a parameter changes. The model reports tendencies (weak / stiff, left / right), not exact predictions.

- Specification: [recurve-tuning-simulator-spec.md](recurve-tuning-simulator-spec.md)
- Phase tracker: [ROADMAP.md](ROADMAP.md)

## What it does today

- Bow and arrow inputs, in Simple and Advanced detail
- Arrow flight seen from above, from the side, or both, with a bare shaft flown next to the fletched arrow
- Play, pause, a slider to jump to any moment, playback from 1/48 of real time up to real speed, and target distances from 18 m to 90 m
- Model result: dynamic behavior, lateral and vertical tendency, oscillation, clearance sensitivity, bare shaft test
- Tuning suggestions in order of priority, each with a button to try it

- A preview of the bow in 3D, showing where center shot and nocking point height sit
- A roadmap page in Vietnamese ("Lộ trình")
- A previews page in Vietnamese ("Xem trước"), with one tab of demos per remaining phase: compare setups, derived metrics, paper tear and walk-back, tuning landscape, sensitivity, share link, target plot diagnosis, tuning plan, stabilizer builder, and mock-ups of accounts and history. Each card is marked as model-driven, a simple stand-in, or fake data

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
