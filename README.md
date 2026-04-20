# VDLV Site Activity Tracker

A standalone, professional-grade **Daily Site Activity Tracker** for construction projects.

Built for **J.C. Van der Linde & Venter Projects (Pty) Ltd**.

## Features

- **Dashboard** — At-a-glance daily summary with live stats
- **Site Information** — Project details & contract reference data
- **Labour Log** — Daily headcount by trade with status tracking
- **Plant & Equipment** — On-site plant register with operational status
- **Tool Hire** — Hired tools register with off-hire date tracking & alerts
- **Material Deliveries** — Delivery docket register with quantities
- **Activity Progress** — Detailed daily progress descriptions per activity
- **Delays & Events** — Delay event register for EOT claims (multi-contract support)
- **Comprehensive PDF Export** — Full multi-page A4 report with all captured data

## Contract Support

Supports a comprehensive range of standard construction contracts:
- JBCC (PBA, N/S Subcontract, Minor Works, Domestic, Direct, Small & Simple, L/O)
- FIDIC (Red, Yellow, Silver, Green, White Books)
- NEC (NEC3, NEC4 variants)
- GCC (2004, 2010, 2015 editions)

## Deployment

Deployed via Vercel as a static web application.

```bash
# Local development
npm run dev

# Deploy
vercel --prod
```

## Tech Stack

- Vanilla HTML / CSS / JavaScript (ES Modules)
- pdf-lib for PDF generation
- FileSaver.js for file downloads
- LocalStorage for data persistence
