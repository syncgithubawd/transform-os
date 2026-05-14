# Transformation OS — Life Operating System

## Files

- `index.html` — Main app shell + all HTML
- `style.css` — Full stylesheet
- `app.js` — All logic, IndexedDB, Coach AI, workout tracker
- `manifest.json` — PWA manifest (installable)
- `sw.js` — Service worker (offline-first)
- `icon-192.svg` — App icon

## Install on iPhone (No server needed)

1. Open `index.html` in Safari
1. Tap Share → Add to Home Screen
1. Done — it works fully offline

## Deploy to GitHub Pages (Recommended)

1. Create a new GitHub repo
1. Upload all files to root
1. Go to Settings → Pages → Deploy from main branch
1. Your app is live at `https://yourusername.github.io/reponame`
1. Open that URL in Safari → Add to Home Screen

## Features Built (Phase 1 — Offline PWA)

- ⚡ Dashboard with daily quote, stats, habits, goal mini cards, alerts
- 🤖 Coach AI — powered by Claude (chat + voice input)
- 🏋️ Workout logger — progressive overload, exercise library, set tracking
- 📋 Daily Maxxing — goals, planner, reflection, streak tracker
- 🩸 Health — body stats, sleep log, bloodwork with smart analysis
- 💉 Cycle tab — full protocol, PCT timeline, Week 6 reminder
- 📲 Brand — social follower tracking, post counter, growth charts
- 🎯 Goals — transformation targets + custom goals
- 📱 Phone Log — screen time tracker, honesty log
- 💼 Business — notes + Phase 2 placeholders
- 🔍 Global search across all data
- 💾 IndexedDB storage — all data persists permanently

## Phase 2 (Requires Linux Server)

- Progress photo gallery with timeline comparison
- Sleep ring import (Oura, Apple Watch, WHOOP)
- Auto follower count sync (TikTok, Instagram, YouTube APIs)
- AI Investment Strategies + Stocks portfolio
- Content ideas AI + scheduling
- Push notifications (pin reminders, daily planning)
- Cloud sync across devices

## Coach AI

The Coach tab is powered by Claude (claude-sonnet-4-20250514).
It has your full context: age, cycle, week, bloodwork alerts, sleep, habits.
Tell it honestly what you ate, how you slept, phone usage → it gives a step-by-step daily action plan.

## Your Cycle Context (pre-loaded)

- Test E: 150mg × 3/wk (Sun/Wed/Fri) = 450mg/wk
- HCG: 250 IU × 3/wk (Sun/Wed/Fri) = 750 IU/wk
- Anavar: 20mg daily
- Started: 26 April 2026
- PCT: Enclomiphene 12.5–25mg × 4–6 weeks
- PCT Start: 14 days after last Test pin
- HCG Stop: 4 days before PCT