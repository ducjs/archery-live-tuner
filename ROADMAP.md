# Recurve Tuning Simulator — Roadmap

Phase tracker for the project. The specification lives in [recurve-tuning-simulator-spec.md](recurve-tuning-simulator-spec.md); section numbers below (§) refer to it.

How to use this file:
- tick a box when the item is merged and working
- update the status table when a phase starts or finishes
- a phase is done only when its exit criteria are met, not when all boxes are ticked
- each phase and milestone opens with a **Nói đơn giản** note: what it is for, without jargon

## Status

| Phase | Theme | Status |
|---|---|---|
| V0.1 | Basic simulator (MVP) | In progress (M1–M5 done; M6 next) |
| V0.2 | Improved dynamic model | Not started |
| V0.3 | Landscape, sensitivity, sharing | Not started |
| V0.4 | Real-world calibration | Not started |
| V0.5 | Advanced parameters and recommendations | Not started |
| V0.6 | Backend: setup storage | Not started |
| V1.0 | Stable public release | Not started |

**Current phase:** V0.1

---

## V0.1 — Basic simulator (MVP)

> **Nói đơn giản:** Bản đầu tiên dùng được. Nhập thông số cung và tên, xem mũi tên bay, kéo thử một thanh trượt và thấy kết quả đổi ngay. Kết quả mới chỉ là xu hướng (yếu/cứng, lệch trái/phải), chưa phải con số chính xác.

Goal: a user enters a setup, sees the arrow fly, changes a slider and sees the result change. Heuristic model only.

### M1. Project scaffold

> **Nói đơn giản:** Dựng khung dự án và bộ công cụ. Chưa có gì để xem, nhưng từ đây mọi dòng code đều được tự động kiểm tra lỗi và chạy test.

- [x] Vite + React + TypeScript (strict) + npm
- [x] Tailwind CSS
- [x] UI components: native inputs with our own styling. shadcn/ui was not adopted; revisit when dialogs or menus are needed (M6)
- [x] Vitest + fast-check
- [x] oxlint + Prettier, with `no-restricted-imports` so `engine/`, `models/`, `utils/` cannot import React or UI code
- [x] Folder structure from §24

### M2. Data models and utilities

> **Nói đơn giản:** Định nghĩa "một bộ setup" gồm những thông số nào, mỗi thông số có đơn vị gì, giới hạn bao nhiêu, mặc định là gì, thuộc nhóm cơ bản hay nâng cao. Kèm bộ đổi đơn vị (lb, inch, grain) và kiểm tra dữ liệu nhập sai.

- [x] `BowSetup`, `ArrowSetup`, `TuningSetup`, `SimulationResult` types (§5, §6, §20)
- [x] Parameter metadata table: label, unit, bounds, default, tier (§4.1)
- [x] Unit conversion utilities (§21)
- [x] Zod validation with bounds (§22), generated from the parameter table
- [x] Development reference setup as default profile (§19)

### M3. Engine v0

> **Nói đơn giản:** Bộ não của ứng dụng. Nhận một setup, trả lời: tên đang yếu hay cứng, dao động nhiều hay ít, lệch trái hay phải, có dễ chạm cung không, và đường bay trông thế nào. Chưa có giao diện; đúng sai kiểm bằng test (ví dụ: tăng point weight thì tên phải yếu đi).

- [x] `SimulationModel` interface
- [x] Heuristic model with normalized factors (§10), coefficients marked as heuristic
- [x] Handedness mirroring
- [x] Classification: stiffness, oscillation, lateral, clearance (§12)
- [x] Trajectory generator (§9)
- [x] Consistency tests 1–7 (§25), with property tests over random valid setups

### Demo slice (between M3 and M4)

> **Nói đơn giản:** Bản xem thử đầu tiên. Chỉ một thanh trượt point weight, nhưng đi trọn đường: kéo thanh trượt, bộ não tính lại, mũi tên trên màn hình bay khác đi và bảng kết quả đổi theo. Mục đích là chứng minh cả chuỗi chạy được trước khi làm đủ các bảng nhập.

- [x] Point weight slider with number input and reset
- [x] Top view animation: bow, arrow flex, drift, target
- [x] Result panel with the four classifications
- [x] Play / pause / restart, reduced-motion respected
- [x] Design tokens for light and dark, self-hosted Barlow fonts

### M4. Input UI

> **Nói đơn giản:** Màn hình nhập liệu. Hai bảng Cung và Tên, mỗi thông số có ô nhập số và thanh trượt. Có nút chuyển Simple/Advanced để người mới chỉ thấy những thông số cơ bản.

- [x] Bow and Arrow panels rendered from the parameter metadata
- [x] Numeric input + slider + unit + reset per parameter, with min/max and a hint on the convention
- [x] Simple / Advanced toggle, remembered in the browser, with "advanced values changed" notice (§4.1)
- [x] Zustand store
- [x] Estimated total arrow mass
- [x] Component tests for the panels (jsdom + Testing Library)

### M5. Visualization

> **Nói đơn giản:** Phần nhìn thấy được. Hoạt hình mũi tên rời cung, uốn, dao động rồi ổn định; kèm bảng kết quả. Kéo thanh trượt là hoạt hình và kết quả đổi theo, không cần bấm nút tính.

- [x] Top view: bow, arrow flex, oscillation, stabilization (§13)
- [x] Side view: vertical attitude (Advanced)
- [x] Play / pause / restart, speed, flex exaggeration (§23)
- [x] "Not to scale" label
- [x] Result panel (§12), with a vertical tendency (nock low / nock high) added
- [x] Live update while dragging sliders (§15)
- [x] Bare shaft and fletched arrow flown together in both views, with the reading in plain words (weak / stiff, nocking point too high / too low)

### M6. Snapshots and comparison

> **Nói đơn giản:** Lưu lại setup đang có, đổi vài thông số, rồi đặt hai bản cạnh nhau để so trước và sau. Dữ liệu lưu ngay trên trình duyệt, chưa cần tài khoản.

- [ ] `SetupRepository` interface + localStorage implementation (§35)
- [ ] Save / load / rename / delete setups
- [ ] Compare two setups, before/after animation (§14)

### M7. Release

> **Nói đơn giản:** Hoàn thiện để đưa cho người khác dùng: chạy tốt trên điện thoại, có tiếng Việt và tiếng Anh, đổi được đơn vị, có lời nhắc đây chỉ là mô hình gần đúng, và có đường link công khai.

- [ ] Responsive layout for phone (§4.2)
- [ ] i18n: Vietnamese + English
- [ ] Unit toggle
- [ ] Scientific disclaimer (§26)
- [ ] Deploy to static hosting

**Exit criteria:** all ten points of §33 pass, and the engine runs in tests without React.

---

## V0.2 — Improved dynamic model

> **Nói đơn giản:** Làm cho bộ não đáng tin hơn. Thay các hệ số ước chừng bằng công thức vật lý đơn giản (độ cứng thật của thân tên, tần số dao động), và báo kết quả theo cách người bắn quen dùng: bareshaft lệch đâu, xé giấy hướng nào. Giao diện gần như không đổi.

Goal: replace the blind heuristic core with a cheap physical basis. UI changes are minimal.

- [ ] Coefficients moved to versioned JSON, `modelVersion` in results (§34.7)
- [x] Bending stiffness `EI` from static spine (§34.1) (done early in M3, drives the animation frequency)
- [x] First bending mode frequency from `EI`, mass and length (end-mass correction is still heuristic)
- [ ] Clearance from oscillation phase vs time on string (§34.2)
- [x] String parameters feed the model (§5)
- [ ] Derived metrics: FOC, grains per pound with warning, estimated speed (§34.4)
- [x] Virtual tuning test: bare shaft (done early in M5)
- [ ] Virtual tuning tests: paper tear, walk-back (§34.3)
- [ ] Spine chart sanity test (§25 Test 8)

**Exit criteria:** the new model sits behind the same `SimulationModel` interface with no UI rewrite, all §25 tests pass, and the NEUTRAL zone agrees with a manufacturer spine chart for the reference setups.

---

## V0.3 — Landscape, sensitivity, sharing

> **Nói đơn giản:** Nhìn toàn cảnh thay vì thử từng cái. Một bảng màu cho biết tổ hợp spine và point weight nào tốt, một biểu đồ cho biết thông số nào ảnh hưởng mạnh nhất. Gửi setup cho người khác bằng một đường link, và dùng được khi không có mạng.

Goal: explore many setups at once, and pass a setup to someone else.

- [ ] Tuning landscape grid, e.g. spine × point weight (§16)
- [ ] Grid computed in a Web Worker
- [ ] Sensitivity (tornado) chart for the current setup (§34.5)
- [ ] Setup encoded in URL (§34.6)
- [ ] Export / import setups as JSON
- [ ] Compare more than two snapshots
- [ ] PWA, works offline (§34.8)

**Exit criteria:** the landscape renders without blocking slider interaction, and a shared URL reproduces the exact same result on another device.

---

## V0.4 — Real-world calibration

> **Nói đơn giản:** Dạy mô hình bằng thực tế. Người bắn ghi lại điều thật sự xảy ra ngoài bãi, ứng dụng so với dự đoán rồi tự chỉnh để lần sau đoán sát hơn cho chính bộ cung đó.

Goal: users record what really happened, and the model adjusts to it.

- [ ] Observation form attached to a setup: oscillation, impact tendency, clearance, bareshaft result (§18)
- [ ] MODEL RESULT vs REAL-WORLD OBSERVATION shown side by side (§26)
- [ ] Coefficient fitting by simple regression, no machine learning
- [ ] Personal calibrated coefficient set, switchable with the base set
- [ ] Export observations

**Exit criteria:** after a user logs observations for several setups, the calibrated model matches those observations better than the base model, and the user can always switch back to the base model.

---

## V0.5 — Advanced parameters and recommendations

> **Nói đơn giản:** Thêm chi tiết cho người tune sâu (từng thanh stabilizer, cách thả dây, barebow), và ứng dụng bắt đầu gợi ý nên thử đổi gì tiếp theo.

Goal: cover more equipment detail and suggest what to try next.

- [ ] Stabilizer breakdown: long rod, side rods, extender, weights (§5)
- [ ] Release parameters (§7)
- [ ] Barebow support (§1)
- [ ] Extra arrow detail: point length, fletching position (§6)
- [ ] Recommendation engine, labelled as model suggestions (§17)

**Exit criteria:** every new parameter is in the Advanced tier with a default, Simple mode is unchanged, and each recommendation is one the landscape shows as an improvement.

---

## V0.6 — Backend: setup storage

> **Nói đơn giản:** Có tài khoản và lưu trữ trên máy chủ. Thông số của từng setup được giữ lại theo người dùng, mở trên máy nào cũng thấy, kèm lịch sử thay đổi. Không đăng nhập vẫn dùng được như cũ.

Goal: store the parameters of every setup per user, across devices (§35).

- [ ] Choose stack (candidates: Supabase, Cloudflare Workers + D1)
- [ ] User accounts
- [ ] API-backed `SetupRepository`
- [ ] Upload existing local setups on first sign-in
- [ ] Change history per setup
- [ ] Observations stored with the setup
- [ ] Sync between devices
- [ ] App still works signed out, on localStorage

**Exit criteria:** a setup saved on one device appears on another, local setups are not lost on sign-in, and the signed-out experience is identical to V0.5.

---

## V1.0 — Stable public release

> **Nói đơn giản:** Bản chính thức cho cộng đồng. Không thêm tính năng lớn; tập trung vào độ ổn định, tốc độ trên máy yếu, dễ dùng cho mọi người, và tài liệu giải thích rõ mô hình làm được gì, không làm được gì.

- [ ] Accessibility pass (keyboard, screen reader, contrast)
- [ ] Performance pass on low-end phones
- [ ] Playwright end-to-end tests for the core flow
- [ ] User guide and model explanation page
- [ ] Privacy policy (needed once accounts exist)
- [ ] Feedback channel

**Exit criteria:** no known blocking bugs, and the model limitations are documented where users will read them.

---

## After V1.0

Not scheduled (§30):
- 3D mode
- real bow profiles, arrow database, commercial component database
- coach mode
- tuning history
- real-shot video comparison, slow-motion arrow-flight analysis
