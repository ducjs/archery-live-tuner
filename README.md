# Recurve Tuning Simulator

A web-based simulator for exploring how a recurve bow and arrow setup behaves when a parameter changes. The model reports tendencies (weak / stiff, left / right), not exact predictions.

- Specification: [readme/recurve-tuning-simulator-spec.md](readme/recurve-tuning-simulator-spec.md)
- Phase tracker: [readme/ROADMAP.md](readme/ROADMAP.md)
- Physics and calculations of the model, in Vietnamese: [readme/physics-and-calculations.md](readme/physics-and-calculations.md)
- Tuning references and how the model compares with them, in Vietnamese: [readme/tuning-references.md](readme/tuning-references.md)
- Working rules for the AI assistant on this project: [readme/memory/](readme/memory/MEMORY.md)

## What it does today

- Bow size first: riser (H23, H25, H27) and limbs (66, 68, 70), which give the bow length and the brace height range for it
- Bow and arrow inputs, in Simple and Advanced detail. Simple mode lists the values it assumes for everything it does not ask
- A screen that leads with the result in a sentence and keeps options, gauges and notes one press away; on a phone, setup, result and suggestions are three tabs, and sliders do not catch a swipe to scroll
- Arrow flight seen from above, from the side, or both, with a bare shaft flown next to the fletched arrow
- Two ways to draw where the arrows land: one point of impact (the fletched arrow sighted in on the center, as in a bare shaft test) or two (both arrows where the model throws them)
- The shot from full draw: the string is drawn back, released on play, and pushes the arrow off the bow
- Play, pause, a slider to jump to any moment, playback from 1/48 of real time up to real speed, and target distances from 18 m to 90 m
- Model result: dynamic behavior, lateral and vertical tendency, oscillation, clearance sensitivity, bare shaft test
- Grains per pound, front of center and kinetic energy in Advanced, and a warning when the arrow is too light for the bow
- Tuning suggestions in two groups, adjustments on the bow and changes of equipment, each in order of priority and with a button to try it
- Works offline after the first visit, and can be installed to the home screen of a phone
- Explore: which spine and point weight suit the bow on screen, as a colored grid, and which values move the result most
- Share and back up: a link that carries the setup on screen, and a JSON file of the saved setups to export and import
- Saved setups: save, open, rename, delete, save as new. They are kept in this browser, and the setup on screen survives a reload
- Compare: up to three saved setups and the one on screen fly together, with a table of the values and model results that differ
- English and Vietnamese, and a choice of lb / inch / grain or kg / cm / gram

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

## Deploy

The app is static and can be served from any folder: the build uses relative paths, and pages are picked by the `#` part of the address.

GitHub Pages: `.github/workflows/deploy.yml` lints, tests, builds and publishes on every push to `master`. One-time setup in the repository: Settings → Pages → Source → "GitHub Actions".

Anywhere else: run `npm run build` and upload the `dist/` folder.

## Layout

```text
readme/          specification, roadmap, and the assistant's working rules (memory/)
src/
├── engine/      simulation model, pure TypeScript
├── models/      data types and parameter metadata
├── utils/       unit conversion, validation
├── i18n/        English and Vietnamese texts
├── state/       Zustand stores: the setup on screen, the saved setups
├── storage/     setup persistence behind a `SetupRepository` interface
├── components/  React UI
└── pages/
```

`engine/`, `models/`, `utils/` and `storage/` must not import React or UI code. The lint config enforces this.
