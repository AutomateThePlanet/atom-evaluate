# Quality Process Maturity Tracker

A pure static (no backend) maturity tracking app that lets you:

- Define/edit **evaluation criteria** (0–10 scoring, weights, dimensions)
- Score companies against criteria
- Compute maturity metrics (**TSI / TQI / ATC / TAEI**) + two “overall” cross-checks
- Save **snapshots** over time and view trends
- Persist everything in **LocalStorage** (v1)

## Tech
- Static HTML/CSS/JS
- ES Modules (`type="module"`)
- No build step
- No external libraries

---

## Local start (recommended)

Because the app uses ES module imports, you must run it from an HTTP server (not `file://`).

### Option A: Python
```bash
cd "<repo-folder>"
python3 -m http.server 5500
