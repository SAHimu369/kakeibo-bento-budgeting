# 🏯 Kakeibo Bento Glass

> A mindful household budget tracker inspired by the Japanese **Kakeibo** (家計簿) method — beautifully packaged in a frosted-glass bento layout, and completely offline.

<p align="center">
  <a href="https://your-username.github.io/kakeibo-bento/"><strong>🚀 Live Demo</strong></a> ·
  <a href="#-features"><strong>Features</strong></a> ·
  <a href="#-getting-started"><strong>Getting Started</strong></a> ·
  <a href="#-how-it-works"><strong>How It Works</strong></a>
</p>

<p align="center">
  <img alt="HTML5"      src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white">
  <img alt="CSS3"       src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black">
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square">
  <img alt="License"    src="https://img.shields.io/badge/license-MIT-blue?style=flat-square">
</p>

---

## 🌸 About

**Kakeibo** is a century-old Japanese budgeting practice that asks four simple questions at the end of every month:

> 💰 *How much money do I have?*
> 🏦 *How much would I like to save?*
> 💸 *How much am I spending?*
> 🧘 *How can I improve next month?*

**Kakeibo Bento Glass** turns that ritual into a beautiful, private, offline-first web app. Every expense is tagged to one of the four Kakeibo pillars — **Needs**, **Wants**, **Culture**, or **Extra** — and the app quietly recalculates your safe daily allowance so you always know what you can spend without guilt.

Everything lives in your browser's `localStorage`. No accounts, no servers, no analytics, no ads.

---

## ✨ Features

### 🎯 Core budgeting
- **Safe Daily Spending Allowance** — auto-computed from `(income − fixed − savings) ÷ days left`
- **Four Kakeibo Pillars** — Needs · Wants · Culture · Extra, with colour-coded tags and totals
- **Pillars donut chart** — pure SVG, animated, zero chart libraries
- **Variable-capacity progress bar** — see how much of your monthly pool is spent at a glance
- **Reflection journal** — end-of-month note saved alongside your data
- **Over-budget awareness** — KPI turns crimson with an "Over by …" warning when you exceed your pool

### 🎨 Interface
- **Glassmorphism bento grid** — frosted cards over an ambient, animated background
- **Light / dark theme** — one-click toggle, remembered across sessions
- **Fully responsive** — 1 column on mobile, 3 on tablet, 4 on desktop
- **Drag-and-drop layout editing** — rearrange the bento cards by dragging
- **Per-card resize handles** — drag the ⤢ corner to span 1–4 columns
- **Layout persistence** — order and spans restored on next visit

### 🛠️ Personalisation
- **Currency switcher** — 16 presets (`$ € £ ¥ ₹ ₩ ₽ ₺ ₪ R$ A$ C$ CHF kr zł ₿`) plus any custom symbol or code (up to 5 chars)
- **Custom background** — set by URL **or** upload a local image, which is auto-compressed to 1600 px / JPEG via canvas before storage
- **Reset to default** buttons for both currency and background

### 🔒 Privacy & offline
- **100 % client-side** — nothing leaves your device
- **Works offline** — once loaded, no network required (background image URL aside)
- **No cookies, no tracking, no third-party scripts**
- **Corruption-safe storage loader** — validates every field on load; a corrupted localStorage entry can never crash the app

### ♿ Accessibility
- Semantic landmarks, `role="dialog"` + `aria-modal` on all modals
- `aria-label` on all icon-only buttons
- **Esc** closes any open modal · **backdrop click** closes any open modal
- Respects `prefers-reduced-motion` — disables orbs and card transitions

---

## 📸 Screenshots

> Replace these with your own when you take them.

| Dark theme | Light theme |
|---|---|
| ![dark](docs/screenshot-dark.png) | ![light](docs/screenshot-light.png) |

| Currency modal | Background modal |
|---|---|
| ![currency](docs/screenshot-currency.png) | ![background](docs/screenshot-bg.png) |

---

## 🚀 Getting Started

### Option 1 — Use it right now

Open the [live demo](https://your-username.github.io/kakeibo-bento/) in your browser. Done.

### Option 2 — Run it locally

Because the app uses no server-side code and no ES modules, you can just open `index.html`:

```bash
git clone https://github.com/your-username/kakeibo-bento.git
cd kakeibo-bento
open index.html          # macOS
# or
start index.html         # Windows
# or
xdg-open index.html      # Linux
