# OpsCore — HR Operations Intelligence Dashboard

A real-time HR dashboard I built to track the full employee lifecycle, from hiring to offboarding, with AI-powered risk detection and automated alerts.

[opscore-dashboard.netlify.app](https://opscore-dashboard.netlify.app)

---

## About the project

I built this as a first-year MS Data Science student after receiving a real HR operations brief. The goal was to solve a genuine problem: HR teams had no single view of what was happening across hiring, onboarding, compliance, and exits.

The dashboard tracks 500 employees across 5 pages, automatically flags risks, assigns named owners, and triggers actions — no manual chasing required.

---

## What it does

| Page | What it shows |
|---|---|
| Overview | BGV status · compliance % · flight risk by region |
| Hiring Pipeline | Candidate funnel with SLA aging by country |
| Compliance Hub | Per-employee training completion · one-click reminders |
| Production Logs | Flight risk · employee status · AI Academy engagement |
| Exit Workflow | Offboarding checklist · security audit · delayed exits |

---

## Tech stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS + custom dark theme
- **AI:** Google AI Studio (Gemini) + Claude
- **Data:** Kaggle HR dataset cleaned to 500 rows, 47 columns using Python
- **Deployment:** Netlify

---

## How I built it

1. Read the brief and mapped out 9 employee lifecycle stages
2. Found a real Kaggle HR dataset (3,000 employees) and cleaned it in Python
3. Used Claude and Gemini AI to design the risk logic, data architecture, and alert system
4. Google AI Studio scaffolded the React + TypeScript + Vite + Tailwind boilerplate — I built the 5 dashboard pages, risk logic, compliance tracking, and region filters on top of it
5. Deployed via GitHub → Netlify

---

## Run locally

**Prerequisites:** Node.js 18+

```bash
git clone https://github.com/anushkanaidu/hire-to-retire-.git
cd hire-to-retire-
npm install
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local
npm run dev
```

Then open http://localhost:5173

---

## Project structure

```
src/
├── data/mockData.ts       # 500-employee HR dataset
├── lib/utils.ts           # Tailwind helpers
├── services/gemini.ts     # Gemini AI integration
├── App.tsx                # All dashboard pages
├── types.ts               # TypeScript types
└── index.css              # Global styles + dark theme
```

---

## What I'd improve next

- [ ] Connect to live Google Sheets instead of CSV
- [ ] Real BGV API integration (HireRight / Credence)
- [ ] Split App.tsx into separate page components
- [ ] Add a RAG layer for natural language HR policy queries

---

## Built by

**Anushka Naidu** — MS Data Science, Seattle University  
[GitHub](https://github.com/anushkanaidu) · [LinkedIn](www.linkedin.com/in/anushka-naidu-maddisetty-24b146204)

> *Note: This is a prototype built from a real HR brief. The data architecture and risk logic are solid but BGV SLA thresholds and training modules would need to be updated to match a real organisation's SOPs.*
