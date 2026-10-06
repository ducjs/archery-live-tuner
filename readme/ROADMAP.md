# Recurve Tuning Simulator — Roadmap

Phase tracker for the project. The specification lives in [recurve-tuning-simulator-spec.md](recurve-tuning-simulator-spec.md); section numbers below (§) refer to it.

## Việc cần bạn làm (ghim)

Những việc chỉ chủ dự án làm được: quyết định, cấp quyền, tìm tài liệu, xem bằng mắt. Xong việc nào thì tick, hết thì xóa dòng đó ở lần cập nhật sau.

- [ ] Cho phép push các commit đang chờ để site được deploy, rồi mở site thật trên điện thoại và rà 10 tiêu chí ở spec §33. *Đây là việc cuối cùng của V0.1. Push lên master là site tự cập nhật.*
- [ ] Xem khối "đang giả định" trong chế độ Cơ bản trên trình duyệt, nhất là trên điện thoại. *Khối này đã qua test nhưng chưa ai nhìn bằng mắt.*
- [ ] Quyết định điểm cân của center shot: giữ 0 mm, dời ra ngoài khoảng 2,4 mm theo sách Easton, hay đổi nghĩa thông số thành "lệch so với vị trí chuẩn". *Hiện đặt center shot đúng như sách thì mô hình báo bareshaft lệch trái. Chi tiết ở tuning-references.md mục 4.2.*
- [ ] Quyết định điểm cân của nocking point: giữ 4 mm hay nâng lên. *Các nguồn ghi từ 3 tới 13 mm; 4 mm nằm ở đầu thấp. Chi tiết ở tuning-references.md mục 4.3.*
- [ ] Tìm bảng chọn spine của Easton (PDF) và đặt vào docs/. *Cần cho bài test đối chiếu vùng cân với bảng của nhà sản xuất, là điều kiện để xong V0.2.*
- [ ] Tải bản PDF gốc sách Easton "Arrow Tuning and Maintenance Guide" (đủ 32 trang, có hình) và bản sạch sách của Murray Elliot, đặt vào docs/. *Bản lưu từ Scribd mất hết hình và thiếu trang; thiếu hình thì không làm được phần xé giấy.*
- [ ] Thêm ducnblue@gmail.com vào GitHub, Settings, Emails nếu chưa có. *Để các commit mới gắn với tài khoản ducjs.*

## How to use this file

- tick a box when the item is merged and working
- update the status table when a phase starts or finishes
- a phase is done only when its exit criteria are met, not when all boxes are ticked
- each phase and milestone opens with a **Nói đơn giản** note: what it is for, without jargon
- this file and the other project documents live in `readme/`; only `README.md` stays at the repository root, where GitHub shows it
- the app has a Vietnamese roadmap page ("Lộ trình", `#roadmap`) built from `src/pages/roadmap/roadmapData.ts`. When an item here is added, removed or ticked, make the same change there; a test fails until both match
- the pinned list above is for the project owner and is mirrored as `PINNED` in the same file, shown at the top of the roadmap page. Add a task when work is blocked on a decision, a permission or a document; the same test checks that both lists match

## Status

| Phase | Theme | Status |
|---|---|---|
| V0.1 | Basic simulator (MVP) | In progress (M1–M6 done; M7 done except the deploy) |
| V0.2 | Improved dynamic model | Not started |
| V0.3 | Landscape, sensitivity, sharing, 3D setup viewer | Not started |
| V0.4 | Real-world calibration | Not started |
| V0.5 | Advanced parameters and recommendations | Not started |
| V0.6 | Backend: setup storage | Not started |
| V1.0 | Stable public release | Not started |

**Current phase:** V0.1

Every phase has a demo on the "Xem trước" page of the app (`#demo-v0-1` to `#demo-v1-0`, one tab per phase). Each demo card says whether it runs on the current model, on a simple stand-in calculation, or on fake data. A demo does not tick its roadmap item: the items below stay open until the real feature is built.

Done ahead of their phase:
- V0.2: bending stiffness and frequency from spine, string parameters in the model, bare shaft test
- V0.3: a preview of the 3D setup viewer (center shot and nocking point height only)
- V0.5: ranked tuning suggestions

---

## V0.1 — Basic simulator (MVP)

> **Nói đơn giản:** Bản đầu tiên dùng được. Nhập thông số cung và tên, xem mũi tên bay, kéo thử một thanh trượt và thấy kết quả đổi ngay. Kết quả mới chỉ là xu hướng (yếu/cứng, lệch trái/phải), chưa phải con số chính xác.

Goal: a user enters a setup, sees the arrow fly, changes a slider and sees the result change. Heuristic model only.

### M1. Project scaffold

> **Nói đơn giản:** Dựng khung dự án và bộ công cụ. Chưa có gì để xem, nhưng từ đây mọi dòng code đều được tự động kiểm tra lỗi và chạy test.

- [x] Vite + React + TypeScript (strict) + npm
- [x] Tailwind CSS
- [x] UI components: native inputs with our own styling. shadcn/ui was not adopted; M6 did not need dialogs (confirmations are inline), so revisit only when menus or dialogs are needed
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
- [x] Simple mode says which values it assumes: how many, the ones that move the result most, the full list on request, and a way to enter them (§4.1)
- [x] Zustand store
- [x] Estimated total arrow mass
- [x] Component tests for the panels (jsdom + Testing Library)

### M5. Visualization

> **Nói đơn giản:** Phần nhìn thấy được. Hoạt hình mũi tên rời cung, uốn, dao động rồi ổn định; kèm bảng kết quả. Kéo thanh trượt là hoạt hình và kết quả đổi theo, không cần bấm nút tính.

- [x] Top view: bow, arrow flex, oscillation, stabilization (§13)
- [x] Side view: vertical attitude. Top, side or both together, in Simple and Advanced; both is the default, one above the other
- [x] Play / pause / restart, flex exaggeration (§23). The clip waits at full draw until play is pressed
- [x] Draw and release: the string is drawn back, pushes the arrow over the power stroke, and the arrow leaves it straight. In the side view the bow tilts to where it aims, with the long rod square to the string and the arrow tipped by the nocking point
- [x] Playback speed in Simple and Advanced: 1/48, 1/24, 1/12, 1/6 of real time, and real speed
- [x] Moment slider: jump to any instant of the flight, with the time since release and distance travelled
- [x] Target distance: 18, 30, 50, 70 or 90 m, with the flight time shown in the result
- [x] World Archery target face for the distance (40, 80 or 122 cm), drawn at the scale of the bow with its ten rings
- [x] Full-width page; on very wide screens inputs, animation and result sit in three columns
- [x] "Not to scale" label
- [x] Result panel (§12), with a vertical tendency (nock low / nock high) added
- [x] Live update while dragging sliders (§15)
- [x] Bare shaft and fletched arrow flown together in both views, with the reading in plain words (weak / stiff, nocking point too high / too low)
- [x] One point of impact: the fletched arrow is taken as sighted in on the gold, and the bare shaft is drawn by how far it lands from it, as in a real bare shaft test
- [x] A choice between two ways of drawing where the arrows land, in Simple and Advanced and in the comparison. "One point of impact" is the above and stays the default. "Two points of impact" lets both arrows land where the model puts them, so the tendency of the fletched arrow shows as a miss too

### M6. Snapshots and comparison

> **Nói đơn giản:** Lưu lại setup đang có, đổi vài thông số, rồi đặt hai bản cạnh nhau để so trước và sau. Dữ liệu lưu ngay trên trình duyệt, chưa cần tài khoản.

- [x] `SetupRepository` interface + localStorage implementation (§35). Async, so a server can replace it later; stored entries are validated on the way in
- [x] Save / load / rename / delete setups, plus "save as new" and "new setup". The setup on screen is kept as a draft across reloads, and replacing unsaved changes asks first
- [x] Compare two setups, before/after animation (§14): a "Compare" view flies the saved setup and the one on screen together, and lists the values and model results that differ

### M7. Release

> **Nói đơn giản:** Hoàn thiện để đưa cho người khác dùng: chạy tốt trên điện thoại, có tiếng Việt và tiếng Anh, đổi được đơn vị, có lời nhắc đây chỉ là mô hình gần đúng, và có đường link công khai.

- [x] Responsive layout for phone (§4.2), checked at 400 px wide in both languages
- [x] i18n: Vietnamese + English, with our own typed dictionaries instead of i18next. The simulator follows the browser language at first and remembers the choice. The roadmap and previews pages stay Vietnamese only
- [x] Unit toggle: lb / inch / grain or kg / cm / gram, for inputs, suggestions, saved setups and the comparison. Setups are stored in internal units either way
- [x] Scientific disclaimer (§26), at the foot of the simulator, next to the note under the model result
- [ ] Deploy to static hosting. Ready but not live: the build uses relative paths and `.github/workflows/deploy.yml` tests, builds and publishes to GitHub Pages on every push to `master`. Still needed: a GitHub repository, a push, and Pages set to "GitHub Actions"

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

## V0.3 — Landscape, sensitivity, sharing, 3D setup viewer

> **Nói đơn giản:** Nhìn toàn cảnh thay vì thử từng cái. Một bảng màu cho biết tổ hợp spine và point weight nào tốt, một biểu đồ cho biết thông số nào ảnh hưởng mạnh nhất. Gửi setup cho người khác bằng một đường link, và dùng được khi không có mạng.

Goal: explore many setups at once, and pass a setup to someone else.

- [ ] Tuning landscape grid, e.g. spine × point weight (§16)
- [ ] Grid computed in a Web Worker
- [ ] Sensitivity (tornado) chart for the current setup (§34.5)
- [ ] Setup encoded in URL (§34.6)
- [ ] Export / import setups as JSON
- [ ] Compare more than two snapshots
- [ ] PWA, works offline (§34.8)

### 3D setup viewer

> **Nói đơn giản:** Một cây cung 3D xoay được, làm bằng các bộ phận thật: riser, limb, dây, plunger, rest, stabilizer, mũi tên. Chỉnh thông số nào thì bộ phận đó chuyển động theo, camera tự bay tới chỗ đó và hiện thước đo. Ví dụ kéo center shot thì thấy đầu mũi tên dịch sang trái hoặc phải so với đường dây. Mục đích là hiểu "thông số này nằm ở đâu trên cung", không phải mô phỏng bay.

Preview status: a first version is in the app, opened with "Show: Bow in 3D" or `#3d` in the address. It covers center shot and nocking point height, the camera flying to the changed part, labels with real values, and 6× amplified offsets. The bow is a rough shape. The items below stay open until the full viewer is built.

- [ ] React Three Fiber scene, loaded only when the viewer is opened
- [ ] Bow built from code, not from a model file, so every part can move with its parameter
- [ ] Parts: riser, limbs, string, plunger, rest, arrow, long rod and side rods
- [ ] Parameters with a visible effect: handedness, center shot, brace height, tiller, nocking point height, plunger preload, draw length (full-draw pose), arrow length, point weight, stabilizer mass and position, strand count
- [ ] Focus on change: moving a slider flies the camera to that part, highlights it and shows a dimension line with the value
- [ ] Amplified offsets with a "not to scale" note, because real changes are a few millimetres on a 1.7 m bow
- [ ] Parameters with nothing to show (draw weight, spine, shaft weight, plunger stiffness) are marked as such, not faked
- [ ] Orbit, zoom, preset views (front, side, top, arrow rest close-up)
- [ ] Works on a phone, and falls back to the 2D views when WebGL is missing

**Exit criteria:** the landscape renders without blocking slider interaction, a shared URL reproduces the exact same result on another device, and for every parameter in the 3D list a user can see which part moved and in which direction.

---

## V0.4 — Real-world calibration

> **Nói đơn giản:** Dạy mô hình bằng thực tế. Người bắn ghi lại điều thật sự xảy ra ngoài bãi, ứng dụng so với dự đoán rồi tự chỉnh để lần sau đoán sát hơn cho chính bộ cung đó.

Goal: users record what really happened, and the model adjusts to it.

- [ ] Observation form attached to a setup: oscillation, impact tendency, clearance, bareshaft result (§18)
- [ ] MODEL RESULT vs REAL-WORLD OBSERVATION shown side by side (§26)
- [ ] Coefficient fitting by simple regression, no machine learning
- [ ] Personal calibrated coefficient set, switchable with the base set
- [ ] Export observations

### Target plot diagnosis

> **Nói đơn giản:** Giống app ghi điểm: chấm vị trí từng mũi tên trên bia, đánh dấu mũi nào là bareshaft, mũi nào có cánh. Ứng dụng so cụm bareshaft với cụm fletched, kết hợp với setup đã nhập (coi như gần đúng), rồi đoán nguyên nhân và gợi ý nên chỉnh gì trước. Khác với gợi ý hiện tại ở chỗ: dữ liệu đến từ bia thật, không phải từ mô hình tự đoán.

Why it matters: a setup can look tuned in the simulator and still shoot differently, because release, form and body differ from one archer to the next. The model cannot see that. The arrows in the target can, so advice has to be able to start from them.

- [ ] Target face to tap arrow positions, with distance and face size
- [ ] Mark each arrow as fletched or bare shaft; several ends can be added up
- [ ] Group centers and spread; bare shaft offset from the fletched group, in cm and in clock direction
- [ ] Reading that separates tuning from the archer: a bare shaft offset that is small against the group spread is reported as "not conclusive"
- [ ] Diagnosis that starts from the observed offset, uses the entered setup to choose between causes (spine, plunger, center shot, nocking point), and ranks the changes
- [ ] Observed offset stored as a real-world observation, so it also feeds calibration

### Sight marks (idea, not scheduled)

> **Nói đơn giản:** Nhập vạch thước ngắm (sight) ở vài cự ly đã bắn chuẩn, ví dụ 18 m vạch 15 và 30 m vạch 30, ứng dụng đoán vạch cho 50, 70, 90 m. Ra bãi không phải dò lại từ đầu, chỉ cần bắn vài mũi để chỉnh tinh. Đây mới là ý tưởng, chưa lên lịch làm.

Why it matters: every archer needs marks for distances they have not shot yet, and finding them by trial costs arrows and time. The known marks are also real measurements of how this bow throws this arrow, which the model otherwise only estimates. Details and limits are in §38.

- [ ] Enter sight marks for the distances already shot, at least two, in the archer's own sight scale (§38)
- [ ] Predict the marks for the other distances, 18 m to 90 m, from a flight path fitted to the known marks
- [ ] Air drag in the flight path, since without it the long distances come out too low
- [ ] A range for each predicted mark, wider the further it lies from the known ones, and a note that it is a starting point to confirm by shooting
- [ ] The arrow speed that the known marks imply, shown next to the model's estimate and stored as a real-world observation
- [ ] The sight drawn on the bow in the side view, with the pin where the mark for the chosen distance puts it, and a warning when the arrow or its vanes would pass too close to the pin or the sight bar (§38.6)

**Exit criteria:** after a user logs observations for several setups, the calibrated model matches those observations better than the base model, and the user can always switch back to the base model.

---

## V0.5 — Advanced parameters and recommendations

> **Nói đơn giản:** Thêm chi tiết cho người tune sâu (từng thanh stabilizer, cách thả dây, barebow), và ứng dụng bắt đầu gợi ý nên thử đổi gì tiếp theo.

Goal: cover more equipment detail and suggest what to try next.

- [ ] Stabilizer breakdown: long rod, side rods, extender, weights (§5)
- [ ] Release parameters (§7)
- [ ] Barebow support (§1)
- [ ] Extra arrow detail: point length, fletching position (§6)
- [x] Recommendation engine, labelled as model suggestions (§17) (done early: ranked single changes with a "Try it" button, shown in two groups: "Adjust directly" on the bow, and "Equipment")
- [ ] Recommendations that plan a sequence of changes, not only the next single step

### Execution errors (idea, not scheduled)

> **Nói đơn giản:** Giả lập lỗi kỹ thuật của người bắn: release dơ, tay cầm cung vặn, arm collapse, alignment sai. Thay vì một mũi tên "hoàn hảo", ứng dụng bắn thử vài chục mũi có sai số rồi vẽ cả cụm tên trên bia. Mục đích: thấy lỗi nào tạo dấu hiệu giống lỗi thiết bị, và thấy setup cân thì "dễ tha thứ" hơn setup lệch. Đây mới là ý tưởng, chưa lên lịch làm.

Why it matters: a dirty release reads on the bare shaft much like a wrong spine, so archers change arrows when the problem is the hand. And the real reason to tune, a setup that forgives small mistakes, is something a single perfect arrow cannot show. Details and limits are in §37.

- [ ] A group of simulated arrows on a target face, with one "consistency" control: each shot gets a small random error (§37)
- [ ] Collapse, dirty release and bow hand torque as separate errors, each in three levels (none, slight, clear) rather than in millimetres
- [ ] Each error as a constant part that moves the whole group and a varying part that widens it
- [ ] The same target face as the target plot diagnosis of V0.4, so the model's group and the real one can be compared
- [ ] Alignment and uneven finger pressure, once there are references for their size and direction
- [ ] Finger pressure as an input of its own: the share of the draw carried by the index, middle and ring finger, and what a top-heavy or bottom-heavy hook does to the vertical tendency and the bare shaft (§37.6)
- [ ] Wording that says "if you collapse, you would see this", never "you are collapsing"

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
- 3D arrow flight (the 3D setup viewer is in V0.3)
- real bow profiles, arrow database, commercial component database
- coach mode
- tuning history
- real-shot video comparison, slow-motion arrow-flight analysis
