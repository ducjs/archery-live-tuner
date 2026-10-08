# Recurve Tuning Simulator — Roadmap

Phase tracker for the project. The specification lives in [recurve-tuning-simulator-spec.md](recurve-tuning-simulator-spec.md); section numbers below (§) refer to it.

## Việc cần bạn làm (ghim)

Những việc chỉ chủ dự án làm được: quyết định, cấp quyền, tìm tài liệu, xem bằng mắt. Xong việc nào thì tick, hết thì xóa dòng đó ở lần cập nhật sau.

- [ ] Mở site thật trên điện thoại và rà 10 tiêu chí ở spec §33. *Đây là việc cuối cùng của V0.1: mọi mục đã tick, chỉ còn bước kiểm này.*
- [ ] Mở "Hiển thị: Cung 3D" trên điện thoại thật: xoay bằng một ngón, phóng to bằng hai ngón, bấm thử năm góc nhìn có sẵn. *Mới kiểm bằng Chrome trên máy tính ở bề rộng điện thoại, với WebGL phần mềm; thao tác cảm ứng trên cảnh 3D chưa thử được.*
- [ ] Thử thanh trượt trên điện thoại thật: vuốt dọc ngang qua thanh trượt phải cuộn trang, chỉ kéo đúng nút tròn mới đổi giá trị. *Mới kiểm bằng Chrome giả lập màn cảm ứng trên máy tính, chưa thử trên máy thật.*
- [ ] Chuyển repo GitHub sang private, rồi nối repo với Cloudflare Pages: lệnh build `npm run build`, thư mục xuất `dist`. *Ở gói GitHub miễn phí, repo private thì GitHub Pages ngừng chạy, nên site sẽ tắt cho tới khi Cloudflare chạy. Nối xong thì báo để bỏ bước deploy GitHub Pages khỏi workflow.*
- [ ] Xem khối "đang giả định" trong chế độ Cơ bản trên trình duyệt, nhất là trên điện thoại. *Khối này đã qua test nhưng chưa ai nhìn bằng mắt.*
- [ ] Quyết định điểm cân của center shot: giữ 0 mm, dời ra ngoài khoảng 2,4 mm theo sách Easton, hay đổi nghĩa thông số thành "lệch so với vị trí chuẩn". *Hiện đặt center shot đúng như sách thì mô hình báo bareshaft lệch trái. Chi tiết ở tuning-references.md mục 4.2.*
- [ ] Quyết định điểm cân của nocking point: giữ 4 mm hay nâng lên. *Easton ghi 13 mm, Total Archery ghi 4,8 tới 9,5 mm; 4 mm nằm dưới cả hai. Tiller cũng vậy: sách ghi 4,8 tới 6,4 mm, mô hình coi 4 mm là cân. Chi tiết ở tuning-references.md mục 4.3.*
- [ ] Tìm bảng chọn spine của Easton (PDF) và đặt vào docs/. *Cần cho bài test đối chiếu vùng cân với bảng của nhà sản xuất, là điều kiện để xong V0.2.*
- [ ] Tìm bài của Kooi và Sparenberg, "On the mechanics of the arrow: Archer's Paradox" (Journal of Engineering Mathematics, 1997), và bản sạch sách của Murray Elliot, đặt vào docs/. *Bài của Kooi là nguồn duy nhất đã biết có mô hình tên uốn quanh cung, cần để kiểm độ lớn của weak và stiff. Sách Easton đủ trang đã có, và phần xé giấy đã làm xong.*
- [ ] Quyết định có giữ lời nhắc tên nhẹ ở mốc 5 gr/lb không, khi đã có cảnh báo theo bảng AMO. *Hiện có cả hai: dưới bảng AMO thì cảnh báo cung có thể gãy, dưới 5 gr/lb thì chỉ nhắc là tên nhẹ. Mốc 5 gr/lb là quy tắc của compound và cao hơn bảng AMO ở hầu hết recurve. Chi tiết ở tuning-references.md mục 9.2.*
- [ ] Bắn xé giấy ở ba cự ly, ví dụ 2 m, 4 m và 6 m, và bareshaft ở 18 m; ghi lại vết rách về phía nào ở từng cự ly. *Bạn thấy trên phim quay chậm: có lúc đuôi tên đá ngang ngay khi rời cung, có lúc ra thẳng rồi gần 18 m đuôi mới đá, mũi nào cũng vậy. Mô hình chưa tái hiện được trường hợp sau. Nếu vết rách đổi chiều theo cự ly thì đó là đuôi lắc qua lại, và quãng giữa hai lần đổi chiều cho biết chu kỳ thật để chỉnh mô hình.*
- [ ] Đo lực kéo trên cung của bạn bằng cân cung ở ba chỗ: full draw, trước đó 2 inch và trước đó 8 inch, kèm brace height và cỡ cung lúc đo. *Để kiểm hai hệ số hình dạng mặc định của đường lực kéo, hiện vẫn là ước lượng; ứng dụng đã nhận thẳng các số này ở Nâng cao, "Lực kéo tự đo". Chi tiết ở spec §39 và tuning-references.md mục 8.4.*
- [x] Duyệt thiết kế đường lực kéo ở spec §39. *Chưa code gì cho tới khi bạn đồng ý.*
- [x] Duyệt thiết kế ba mức tune và màn hình setup bấm vào bộ phận cung ở spec §40. *Bạn đã bảo cứ làm; đã làm xong.*
- [ ] Dùng thử màn hình mới (ba mức, bốn màn hình làm việc, Setup có cung 3D) trên máy tính và điện thoại thật, rồi báo chỗ nào chưa vừa ý. *Mới xem bằng Chrome không giao diện ở 1440 px và 400 px. Chưa ai dùng thử bằng tay, và cảm ứng trên cảnh 3D chưa kiểm được.*
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
| V0.1 | Basic simulator (MVP) | M1–M9 built. Open in M9: 49 skipped tests of the screen to rewrite. Open: the owner's check of the ten points of §33 on a phone |
| V0.2 | Improved dynamic model | In progress (8 of 12 done; walk-back needs a better source; the spine chart test waits for the Easton chart; the tail wobble needs measurements) |
| V0.3 | Landscape, sensitivity, sharing, 3D setup viewer | All items done. Open: the owner's look at the 3D viewer on a real phone |
| V0.4 | Real-world calibration | All items done. Open: the exit criterion, which waits for real observations; the fit has only been tested on made-up ones |
| V0.5 | Advanced parameters and recommendations | In progress (the draw force curve and the items done ahead of the phase are built) |
| V0.6 | Backend: setup storage | Not started |
| V1.0 | Stable public release | Not started |

**Current phase:** V0.1

Every phase has a demo on the "Xem trước" page of the app (`#demo-v0-1` to `#demo-v1-0`, one tab per phase). Each demo card says whether it runs on the current model, on a simple stand-in calculation, or on fake data. A demo does not tick its roadmap item: the items below stay open until the real feature is built.

Done ahead of their phase:
- V0.2: everything except the walk-back test and the spine chart test. Walk-back has only one low-trust source so far (tuning-references.md section 9.7). The spine chart test waits for the Easton chart in the pinned list
- V0.3: all of it
- V0.5: ranked tuning suggestions and the plan of a whole session, bow size, limb alignment, the draw force curve, the extra arrow detail

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
- [x] Deploy to static hosting: the build uses relative paths and `.github/workflows/deploy.yml` tests, builds and publishes to GitHub Pages on every push to `master`. Planned by the owner: make the repository private and move the hosting to Cloudflare Pages

### M8. A calmer screen

> **Nói đơn giản:** Màn hình đang có quá nhiều thứ cùng lúc, nhìn vào khá rối. Phần này sắp lại để thứ quan trọng hiện trước, phần còn lại mở ra khi cần. Trên điện thoại, vuốt để cuộn trang không còn vô tình kéo trúng thanh trượt.

Raised by the project owner on 2026-10-06, who then asked for all of it.

- [x] Sliders on a touch screen move only when their thumb is dragged, and a vertical swipe that starts on a slider scrolls the page. Each value also gets minus and plus buttons, so it can be changed without dragging. Checked in Chrome with a touch screen emulated; a real phone is still to be tried
- [x] Playback options put away: play, restart and the bare shaft switch stay in view; view, distance, points of impact, speed and amplification open from one "display options" button
- [x] The result leads with one sentence in plain words (for example "the arrow reads a little weak; the bare shaft lands to the right"). The gauges and numbers open on request: put away at first on a phone, shown at first on a wide screen
- [x] Inputs in groups that fold, with the changed values counted on the group. On a phone, setup, result and suggestions become three tabs under the animation instead of one long page
- [x] The standing notes under the controls and the result shortened to one line each, with the full text behind an "about this drawing" link
- [x] The whole screen reviewed with the two UI skills and checked by eye at 400 px wide, in both languages
- [x] A button that puts the top and side views away and brings them back, to leave a small screen to the values and the result

### M9. Three levels and a setup of its own

> **Nói đơn giản:** Chia ứng dụng thành ba mức: Cơ bản, Nâng cao, Chuyên nghiệp. Mức nào chỉ thấy đúng thứ của mức đó, từ ô nhập tới kết quả và các màn hình. Phần setup ra một chỗ riêng: bấm vào một bộ phận trên cây cung 3D, thông số của nó hiện ra và kéo thanh trượt ngay tại chỗ, giống màn hình độ súng trong game.

Raised by the project owner on 2026-10-08, and built the same day. Design and what was built: §40.

- [x] Three levels in place of two, for the whole app: inputs, the detail of the result, and which workspaces exist (§40.2). Tiller and limb alignment become Basic; the draw curve and the extra arrow detail become Professional
- [x] Values in five groups (bow, tuning, arrow, string, balance), one open at a time, each closed group showing its main values. A value is one row that opens to its slider when it is in use
- [x] Four workspaces in place of the "Show" switch: Setup, Flight, Target, Analysis. Name, save and share in one bar above them; language and units behind a settings button (§40.3)
- [x] Setup with the values next to the 3D bow: press a part to go to its value, and the bow moves while a slider is dragged. The 3D bow can be switched off, and the flight can be drawn from above or from the side next to it (§40.4)
- [x] The result built around the next step: the sentence, one suggestion to try, and the rest in tabs (§40.5)
- [x] A callout for every part of the 3D bow: a box with a drawing of the part, its name and its value, and a line to the part, as on the screen where a weapon is fitted out in a shooter game. Pressing the box goes to the value
- [x] Search for a value at Professional. Looked at in headless Chrome at 1440 px and at 400 px wide, in Vietnamese
- [ ] The tests of the screen rewritten for the workspaces: 49 of them were written for the old layout and are skipped (§40.9)

**Exit criteria:** all ten points of §33 pass, and the engine runs in tests without React.

---

## V0.2 — Improved dynamic model

> **Nói đơn giản:** Làm cho bộ não đáng tin hơn. Thay các hệ số ước chừng bằng công thức vật lý đơn giản (độ cứng thật của thân tên, tần số dao động), và báo kết quả theo cách người bắn quen dùng: bareshaft lệch đâu, xé giấy hướng nào. Giao diện gần như không đổi.

Goal: replace the blind heuristic core with a cheap physical basis. UI changes are minimal.

- [x] Coefficients moved to versioned JSON, `modelVersion` in results (§34.7). The file is checked when it is loaded, so a calibrated set with a missing number is refused
- [x] Bending stiffness `EI` from static spine (§34.1) (done early in M3, drives the animation frequency)
- [x] First bending mode frequency from `EI`, mass and length (end-mass correction is still heuristic)
- [x] Clearance from oscillation phase vs time on string (§34.2): the risk now depends on how many bending cycles the shaft has gone through when its tail passes the riser. Coefficient set `heuristic-0.2`
- [x] String parameters feed the model (§5)
- [x] Derived metrics: FOC, grains per pound with warning, estimated speed (§34.4). The numbers show in Advanced; the warning for an arrow under 5 gr/lb shows in both modes
- [x] Warning for an arrow under the AMO minimum weight for the draw weight and draw length, from the chart in the Easton guide. It replaces the 5 gr/lb note when both apply
- [x] Tests that hold the model against published figures: the bending cycles on the string (Pratt, 1.25), the share of the stored energy the arrow gets, speed against arrow mass and brace height. Sources in tuning-references.md section 10.3
- [x] Virtual tuning test: bare shaft (done early in M5)
- [x] Virtual tuning test: paper tear (§34.3). The result panel draws the sheet and reads the tear, next to the bare shaft test; directions from the Easton guide
- [ ] Virtual tuning test: walk-back (§34.3). Only one low-trust source describes it so far (tuning-references.md section 9.7)
- [ ] Tail wobble as the real oscillation of an arrow in the air: frequency and damping from the fletching, the balance and the speed, so that an arrow that leaves straight and kicks its tail near the target can be shown, and a bare shaft drifts off instead of settling. Today every disturbance is largest at the bow and only dies away (reported by the owner from slow motion video on 2026-10-07)
- [ ] Spine chart sanity test (§25 Test 8)

**Exit criteria:** the new model sits behind the same `SimulationModel` interface with no UI rewrite, all §25 tests pass, and the NEUTRAL zone agrees with a manufacturer spine chart for the reference setups.

---

## V0.3 — Landscape, sensitivity, sharing, 3D setup viewer

> **Nói đơn giản:** Nhìn toàn cảnh thay vì thử từng cái. Một bảng màu cho biết tổ hợp spine và point weight nào tốt, một biểu đồ cho biết thông số nào ảnh hưởng mạnh nhất. Gửi setup cho người khác bằng một đường link, và dùng được khi không có mạng.

Goal: explore many setups at once, and pass a setup to someone else.

- [x] Tuning landscape grid, e.g. spine × point weight (§16): "Show: Explore" in the simulator. Spine 400 to 1000 against point weight 80 to 140 gr, colored weak to stiff; a cell puts its pair into the setup
- [x] Grid computed in a Web Worker, with the sensitivity chart. The previous result stays on screen until the new one arrives, and a browser without workers computes in place
- [x] Sensitivity (tornado) chart for the current setup (§34.5): under the landscape, the values that move weak and stiff most, largest first. Simple mode lists only the values it shows
- [x] Setup encoded in URL (§34.6): "Copy a link to this setup" under the saved setups. The link holds every value at full precision. Opening it offers the setup and replaces nothing until the user agrees
- [x] Export / import setups as JSON: one file with the saved setups and the one on screen. Importing adds setups and never replaces a saved one
- [x] Compare more than two snapshots: up to three saved setups next to the one on screen, each with its drawing and its column in the tables
- [x] PWA, works offline (§34.8): after one visit the site opens without a network, and it can be installed to the home screen. A new version is picked up the next time the site is opened with a connection

### 3D setup viewer

> **Nói đơn giản:** Một cây cung 3D xoay được, làm bằng các bộ phận thật: riser, limb, dây, plunger, rest, stabilizer, mũi tên. Chỉnh thông số nào thì bộ phận đó chuyển động theo, camera tự bay tới chỗ đó và hiện thước đo. Ví dụ kéo center shot thì thấy đầu mũi tên dịch sang trái hoặc phải so với đường dây. Mục đích là hiểu "thông số này nằm ở đâu trên cung", không phải mô phỏng bay.

Status: built, in three rounds. Opened with "Show: Bow 3D" or `#3d` in the address. Touch on a real phone is still to be tried by the owner.

- [x] React Three Fiber scene, loaded only when the viewer is opened
- [x] Bow built from code, not from a model file, so every part can move with its parameter
- [x] Parts: riser with a sight window cut out of it (shelf, wall and the bar that is left), grip and limb pockets, limbs, string with center serving and nocking points, plunger, rest, arrow, long rod with damper and weight, V-bar and side rods
- [x] Parameters with a visible effect: handedness, riser and limb size, center shot, limb alignment, brace height, tiller, nocking point height, plunger preload, draw length (an "at full draw" pose), arrow length, point weight, stabilizer mass and position, strand count
- [x] Focus on change: moving a slider flies the camera to that part and shows a dimension line there with the value. Opening another setup does not move the camera
- [x] Amplified offsets with a "not to scale" note, because real changes are a few millimetres on a 1.7 m bow: nocking point, center shot, tiller and limb alignment are drawn six times larger, and the switch for it says so
- [x] Parameters with nothing to show (draw weight, spine, shaft weight, plunger stiffness and others) are named in a note under the viewer, not faked
- [x] Orbit, zoom, and quick buttons in two groups. "View": whole bow, from the target, from above, and along the string, which is how limb alignment is checked. "Equipment": limbs, string, nocking point, rest, plunger, arrow, stabilizer
- [x] Works on a phone, and falls back to the 2D views when WebGL is missing, with a line that says why
- [x] Pressing a part of the bow, or the button of a piece of equipment, goes to its value: the input scrolls into view, takes the focus and is marked for a moment. Advanced opens first if the value lives there. Thin parts such as the string and the arrow answer a press beside them too (asked for by the owner on 2026-10-06)

**Exit criteria:** the landscape renders without blocking slider interaction, a shared URL reproduces the exact same result on another device, and for every parameter in the 3D list a user can see which part moved and in which direction.

---

## V0.4 — Real-world calibration

> **Nói đơn giản:** Dạy mô hình bằng thực tế. Người bắn ghi lại điều thật sự xảy ra ngoài bãi, ứng dụng so với dự đoán rồi tự chỉnh để lần sau đoán sát hơn cho chính bộ cung đó.

Goal: users record what really happened, and the model adjusts to it.

- [x] Observation form attached to a setup: oscillation, impact tendency, clearance, bareshaft result (§18). Under "Show: Target"; each observation keeps the values the setup had when it was shot
- [x] MODEL RESULT vs REAL-WORLD OBSERVATION shown side by side (§26): each kept observation lists what was seen beside what the model says, and counts where they agree
- [x] Coefficient fitting by a simple search, no machine learning. Three shifts only: the archer's own weak or stiff shift, and the neutral points of nocking point and center shot; the sensitivities stay as in the base model. Tested on made-up observations only, not yet on real ones
- [x] Personal calibrated coefficient set, switchable with the base set: switched on by itself only when it agrees with more of the observations, and always one switch from the base model. Results made with it carry the version `heuristic-…+personal`
- [x] Export observations: one file with every observation in the browser

### Target plot diagnosis

> **Nói đơn giản:** Giống app ghi điểm: chấm vị trí từng mũi tên trên bia, đánh dấu mũi nào là bareshaft, mũi nào có cánh. Ứng dụng so cụm bareshaft với cụm fletched, kết hợp với setup đã nhập (coi như gần đúng), rồi đoán nguyên nhân và gợi ý nên chỉnh gì trước. Khác với gợi ý hiện tại ở chỗ: dữ liệu đến từ bia thật, không phải từ mô hình tự đoán.

Why it matters: a setup can look tuned in the simulator and still shoot differently, because release, form and body differ from one archer to the next. The model cannot see that. The arrows in the target can, so advice has to be able to start from them.

- [x] Target face to tap arrow positions, with distance and face size. In the simulator, under "Show: Target". Arrows can also be marked with the keyboard: the arrow keys move a cursor over the face, Enter marks under it
- [x] Mark each arrow as fletched or bare shaft; several ends can be added up. The target being marked is kept when the page is closed
- [x] Group centers and spread; bare shaft offset from the fletched group, in cm and in clock direction
- [x] Reading that separates tuning from the archer: a bare shaft offset that is small against the group spread, or against what a bare shaft does on its own at that distance, is reported as "not conclusive"
- [x] Diagnosis that starts from the observed offset, uses the entered setup to choose between causes (spine, plunger, center shot, nocking point), and ranks the changes in the order of the tuning guides. It says when the model reads the setup differently from the target
- [x] Target stored as a real-world observation, with the values of the setup as it was shot, so it also feeds calibration

### Sight marks

> **Nói đơn giản:** Nhập vạch thước ngắm (sight) ở vài cự ly đã bắn chuẩn, ví dụ 18 m vạch 15 và 30 m vạch 30, ứng dụng đoán vạch cho 50, 70, 90 m. Ra bãi không phải dò lại từ đầu, chỉ cần bắn vài mũi để chỉnh tinh. Đã làm xong, kể cả vẽ thước ngắm lên cung.

Why it matters: every archer needs marks for distances they have not shot yet, and finding them by trial costs arrows and time. The known marks are also real measurements of how this bow throws this arrow, which the model otherwise only estimates. Details and limits are in §38.

- [x] Enter sight marks for the distances already shot, at least two, in the archer's own sight scale (§38). Under "Show: Target"; marks are kept per setup
- [x] Predict the marks for the other distances, 18 m to 90 m, from a flight path fitted to the known marks
- [x] Air drag in the flight path, since without it the long distances come out too low. The animation and the sight marks fly the same path
- [x] A range for each predicted mark, wider the further it lies from the known ones, and a note that it is a starting point to confirm by shooting
- [x] The arrow speed that the known marks imply, shown next to the model's estimate and stored as a real-world observation. From three marks on, and given as a rough reading with its own range
- [x] The sight drawn on the bow in the side view, with the pin where the chosen distance puts it, and a warning when the vanes would pass too close to the pin (§38.6). The room under the pin is listed for every distance; it follows from the anchor, the sight extension and the arrow speed, and needs no marks

**Exit criteria:** after a user logs observations for several setups, the calibrated model matches those observations better than the base model, and the user can always switch back to the base model.

---

## V0.5 — Advanced parameters and recommendations

> **Nói đơn giản:** Thêm chi tiết cho người tune sâu (từng thanh stabilizer, cách thả dây, barebow, đường lực kéo của cung), và ứng dụng bắt đầu gợi ý nên thử đổi gì tiếp theo.

Goal: cover more equipment detail and suggest what to try next.

- [ ] Stabilizer breakdown: long rod, side rods, extender, weights (§5)
- [ ] Release parameters (§7)
- [x] Bow size: riser (H23, H25, H27) and limbs (66, 68, 70), in a section of their own above the other inputs. They give the bow length, which sets the recommended brace height range (done early, asked for by the owner on 2026-10-06)
- [x] Limb alignment: how far each limb tip sits to the side, in mm. Both to one side act as a center shot error; apart, they add wobble and clearance risk. Coefficient set `heuristic-0.3` (done early, same request)
- [ ] Barebow support (§1)
- [x] Extra arrow detail: how far the point sticks out past the shaft, how high the vanes stand and how far they sit from the nock (§6). The front of center is computed from those places, with a note in Advanced when it lies outside the 7 to 16 % of the Easton guide. The vane height also sets the room under the sight pin
- [x] Recommendation engine, labelled as model suggestions (§17) (done early: ranked single changes with a "Try it" button, shown in two groups: "Adjust directly" on the bow, and "Equipment")
- [x] Suggestions in the order the tuning guides work in: set-up, up and down, plunger, point, draw weight, brace height, new shaft. Center shot is only suggested back to where it was set. A bare shaft a little low or a little stiff counts as tuned (§17.1)
- [x] Recommendations that plan a sequence of changes, not only the next single step: "The whole session" under the suggestions, each value changed once in the order of the tuning guides, with a button to try all of it

### Draw force curve

> **Nói đơn giản:** Vẽ đường lực kéo của cây cung: kéo tới đâu thì nặng bao nhiêu, cung tích được bao nhiêu năng lượng, và lúc gần clicker lực còn tăng nhanh hay chậm. Hãng không công bố đường này, nên ứng dụng dựng một đường chung từ cỡ cung và draw length, rồi sửa lại cho đúng cây cung của bạn nếu bạn tự đo vài điểm bằng cân cung. Không đoán theo lõi foam hay gỗ, vì số đo cho thấy lõi không quyết định hình dạng đường này.

Why it matters: two bows of the same draw weight can store different energy and feel different at the clicker, and the model used to treat them as one. It now draws the curve, estimated from the bow size or shaped by forces the archer measured. Details and limits are in §39; the sources are in tuning-references.md section 8.

- [x] A common curve from draw weight, draw length and brace height, with two shape numbers: fullness, which sets the stored energy, and end rise, which sets the force gain at the clicker (§39.2)
- [x] Curve style in three steps (straight, standard, full in mid-draw), labelled as an estimate. It replaces the fixed `drawCurveFactor`; the standard style gives the same results as today
- [x] End rise from how the bow length fits the draw length: a short bow drawn long climbs more steeply at the end (§39.3)
- [x] Own measurement: the force at one or two shorter draw lengths, read from a bow scale, replaces the estimate and is stored with the setup (§39.4)
- [x] The curve as a chart, with stored energy and the force gain per inch at the clicker; two curves in the comparison of setups
- [x] Helper from the draw weight marked on the limbs to the force on the fingers: 5% per inch from 28 in, limb bolts ±5%, shown as an estimate (§39.6)

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
