# OpsCore — HR Operations Intelligence Dashboard

> End-to-end employee lifecycle visibility with AI-powered risk detection and automated alerts.

[opscore-dashboard.netlify.app](https://opscore-dashboard.netlify.app)

---

## What it does

OpsCore gives HR and operations teams a single real-time view across the full employee lifecycle — from hiring pipeline to offboarding — with automatic risk flags and named owners for every breach.

| Module | What it tracks |
|---|---|
| **Overview** | 500 employees · BGV status · compliance % · flight risk — filterable by region |
| **Hiring Pipeline** | Candidate funnel with SLA aging · US optimal · UK at risk · Singapore breach |
| **Compliance Hub** | Every employee × every training module · one-click Send Reminder |
| **Production Logs** | Flight risk by region · active employee status · AI Academy pilot engagement |
| **Exit Workflow** | Offboarding checklist · security audit log · 48 delayed exits flagged |

---

## Key metrics (from 500-employee dataset)

- **52** BGV overdue — SLA breached
- **157** BGV at risk — needs action
- **206** high flight risk employees
- **50.3%** average compliance (target: 85%)

---

## Risk routing

Every risk has a named owner and an automated action — no manual triage needed.

| Risk | Owner | Action |
|---|---|---|
| BGV overdue (SLA breach) | Compliance Director | Automated alert email to agency |
| High flight risk (satisfaction < 3) | BU Managing Director | Stay interview within 48 hours |
| Training module incomplete | L&D Manager | Send Reminder from dashboard |
| Onboarding incomplete >21 days | HR Business Partner | Audit Day 0 blockers |
| Exit — access still active after LWD | IT / Ops Lead | Trigger Global Exit Protocol |

---

## Tech stack

- **Frontend:** React + TypeScript + Vite
- **AI layer:** Google AI Studio (Gemini) + Anthropic Claude — risk logic design, data architecture, code generation, and automated alert drafting
- **Data:** Real Kaggle HR dataset (3,000 employees) cleaned to a 500-row, 47-column master file
- **Deployment:** GitHub → Netlify (CI/CD)
- **Export:** PDF report generation

---

## Run locally

**Prerequisites:** Node.js 18+

```bash
# 1. Clone the repo
git clone https://github.com/anushkanaidu/hire-to-retire-.git
cd hire-to-retire-

# 2. Install dependencies
npm install

# 3. Add your Gemini API key
cp .env.example .env.local
# Edit .env.local and set GEMINI_API_KEY=your_key_here

# 4. Start the dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173)

---

## Project structure

```
src/
├── components/       # Reusable UI components
├── pages/            # Dashboard pages (Overview, Hiring, Compliance, Logs, Exit)
├── data/             # Cleaned HR dataset (CSV)
└── lib/              # AI Studio integration, PDF export
```

---

## Roadmap

- [ ] Connect Google Sheets as live data source
- [ ] HireRight / Credence BGV API integration
- [ ] LMS integration for real training completion data
- [ ] Deploy to private GCP environment with access controls
- [ ] Add RAG layer for natural language HR policy queries

---

## Built by

**Anushka Naidu** — MS Data Science, Seattle University  
[GitHub](https://github.com/anushkanaidu) · [LinkedIn](https://linkedin.com/in/anushkanaidu)

---

> *Built as a prototype from a real HR operations brief. Data architecture, risk logic, and interface are production-ready. BGV SLA thresholds and training module definitions are based on the original brief and can be updated to match any organisation's SOPs.*
