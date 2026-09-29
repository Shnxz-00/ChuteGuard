# ChuteGuard

**Industrial chute blockage detection using computer vision.**

ChuteGuard watches a conveyor discharge chute through a camera, turns what it sees into a live **Choke %** score, and alerts operators the moment material starts building up, before the chute jams and the line stops.

🏆 **"Best Solution" award** at the hackathon it was built for.

[**Live demo**](https://your-app.vercel.app) · [How it works](#how-it-works) · [Run it locally](#getting-started)

![Live dashboard](docs/dashboard.png)

---

## The problem

Conveyor discharge chutes in steel, coal, and mining plants choke when moisture, poor geometry, or foreign debris makes material stick and pile up. The result is:

- **Downtime**: the whole line can stall until the chute is cleared
- **Manual labor**: clearing usually means sending a worker to hammer or reach into the chute
- **Safety risk**: people working inside or beside a jammed chute

Chhattisgarh's steel and mining belt runs bulk-material conveyors around the clock, so this is a daily, recurring cost.

## The solution

ChuteGuard is a **detect-and-alert** system:

1. A camera views the chute interior
2. A CV pipeline segments material buildup inside a defined region of interest
3. A persistence filter ignores material that is just passing through, so only real accumulation counts
4. The result is a single **Choke %** score, updated continuously
5. Crossing a threshold raises an alert (visual, spoken, and email-ready)
6. An operator clears the blockage, and the score dropping back to normal **confirms the fix worked**

**By design, ChuteGuard never actuates anything on the physical process.** A human always does the clearing. The system's job is to tell them exactly when, and to verify afterwards.

| Choke %  | State              | Meaning                        |
| -------- | ------------------ | ------------------------------ |
| 0 – 20   | 🟢 Normal          | Material flowing freely        |
| 20 – 50  | 🟡 Minimal choking | Buildup forming, watch closely |
| 50 – 100 | 🔴 Max choking     | Blockage, intervention needed  |

## Features

- **Live dashboard**: Choke % gauge driven by the detection video, with a phase badge and alert feed
- **Video-synced analysis**: press play and the gauge follows the detection score frame by frame for the duration of the clip
- **How It Works**: a full walkthrough (detect → alert → manual clearing → flow restored) plus a before/after comparison
- **Trends & ROI**: Choke % timeline and a projected downtime / manual-labor comparison
- **Architecture & Safety**: interactive 3D chute view and the reasoning behind the detect-only design
- **Alerts**: in-app alert feed with spoken (browser speech) alerts; email toggle is UI-only for now
- **Our Journey**: how the project evolved from a sensor-and-vibrator concept to a CV-only system

## How it works

```
Camera feed → Region of interest → Buildup segmentation → Persistence filter → Choke % → Alert / human clears it → Score confirms the clear
```

- **Region of interest**: only the part of the frame where material actually accumulates is scored
- **Persistence filtering**: a pixel region counts as blocked only if it stays "material" across many consecutive frames. Falling material is transient; a real pile is not. This is what keeps normal flow from triggering false alarms
- **Explainable by construction**: every score traces back to highlighted image regions, so an operator can see _why_ an alert fired

**How the dashboard gets its numbers today:** the detection scores were computed on recorded plant-chute footage, and the dashboard replays them in sync with the video (`public/chv1_readings.json`, `public/chv2_readings.json`). Each reading was extracted from the score overlay on the footage at 10 samples per second and is matched to `video.currentTime` during playback.

## Tech stack

| Layer            | Tools                                                     |
| ---------------- | --------------------------------------------------------- |
| Framework        | React, Vite, TypeScript                                   |
| Styling & motion | Tailwind CSS, Framer Motion                               |
| Charts           | Recharts                                                  |
| 3D               | Three.js via `@react-three/fiber` and `@react-three/drei` |
| State            | Zustand                                                   |
| Deploy           | Vercel                                                    |

## Getting started

```bash
git clone https://github.com/Shnxz-00/chuteguard.git
cd chuteguard
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`). No backend is required, since the dashboard runs from the files in `public/`.

Production build:

```bash
npm run build
npm run preview
```

## Project structure

```
public/          demo videos and pre-extracted detection readings (JSON)
src/
  components/    gauge, alert feed, layout, 3D chute view
  pages/         dashboard, how it works, trends & ROI, architecture, journey
  hooks/         video-synced Choke % hook
  lib/           global state (Zustand store)
```

## Current status and limitations

We'd rather be upfront about where this stands:

- **Demo, not a deployment.** The dashboard replays detection results from recorded footage. It does not run live inference in the browser or connect to a plant camera yet
- **No formal accuracy evaluation.** The score was validated qualitatively against real plant video (it rises and falls where a person watching would expect), but we have not yet measured precision/recall against labeled ground truth
- **Tuned to specific footage.** A new chute, camera angle, or material type needs its own region of interest and threshold calibration
- **ROI figures are illustrative estimates** (2.0 → 0.9 hrs/day downtime, 4.0 → 1.6 person-hrs/day manual labor), not measured plant data
- **Email alerts are a UI toggle only.** Spoken and in-app alerts work; email delivery needs a backend
- **Camera health handling is basic.** A dusty or obscured lens would degrade detection

## Roadmap

- [ ] Formal accuracy evaluation on labeled footage (precision, recall, false-alarm rate)
- [ ] Live camera input (RTSP / webcam) with real-time inference
- [ ] Alert acknowledgement and supervisor escalation
- [ ] Working email / SMS delivery
- [ ] Per-chute calibration workflow (region of interest and thresholds)
- [ ] Pilot on a real chute at a partner plant
- [ ] Multi-chute overview

## Team

**Block Busters**

|                        |                                       |
| ---------------------- | ------------------------------------- |
| Shashank (Team Leader) | [GitHub](https://github.com/Shnxz-00) |
| Sagnik                 |                                       |
| Vedant                 |                                       |
| Shivam                 |                                       |

Built at NIT Raipur.

## License

Copyright © 2026 Team Block Busters. All rights reserved.
