# Dormiqa - Africa's Verified Student Housing Ecosystem

<p align="center">
  <img src="/public/logo.svg" alt="Dormiqa Logo" width="220" />
</p>

**Dormiqa** is a tech-enabled student housing discovery platform built to eliminate accommodation scams, high-risk middleman fees, and housing anxiety for higher education students across Nigerian and African university campuses.

---

## 🌟 Overview

Every year, millions of university students navigate off-campus housing markets dominated by unverified middlemen and fraudulent advance fee demands. **Dormiqa** replaces informal, high-risk property searches with a clean, verified, tech-driven marketplace that connects students directly with identity-verified property agents and landlords.

### Key Pillars
- **Strict Identity Verification**: Verified Agent badges issued after government photo ID (NIN, Driver’s License, International Passport) and property management authorization checks.
- **Direct Landlord Payments**: Students inspect properties physically and pay rent directly to verified agents or landlords. Dormiqa never holds or processes rent payments.
- **Campus-Centric Search**: Search and filter off-campus hostels, self-contain apartments, and lodges by exact distance to university gates, pricing, and essential amenities (solar inverter, treated water, security gates, Wi-Fi).

---

## 🚀 Features

### 🎓 For Students
- **Campus Filters**: Find listings grouped by major university campuses (e.g., UNILAG, OAU, UI, UNN, ABU, FUTA, UNILORIN, Covenant, LASU, etc.).
- **Physical Inspection Bookings**: Schedule inspection dates and times with verified agents at zero cost.
- **Saved Favorites**: Bookmark listings for comparison across pricing, distance, and facilities.
- **Student Housing AI Assistant**: Embedded AI advisor powered by Google Gemini to answer questions on rental norms, tenancy rights, and recommended locations.

### 🏢 For Property Agents & Landlords
- **Identity Verification Workflow**: Submit NIN / CAC credentials to earn the green **Verified Agent** badge.
- **Property Listing Management**: Upload photos, specify rental rates (annual rent, agreement fees, caution deposits), and set property amenities.
- **Inspection Lead Dashboard**: Receive direct inspection requests from active university students.

### 📜 Comprehensive Legal & Safety Knowledge Base (Info Hub)
- **Legal & Policies**: Master Terms & Conditions, Privacy Policy, Cookie Policy, Acceptable Use Policy, Agent Terms, Student Conduct, and Platform Disclaimer.
- **Trust & Safety**: Community Guidelines, Agent Verification Policy, Listing Quality Standards, Review Integrity Policy, Anti-Fraud Policy, and Report Abuse workflow.
- **Support & Company**: Help Centre walkthroughs, FAQs, Direct Contact Channels (`support@dormiqa.ng`), Bug Reporting, and Corporate Governance.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Animations**: `motion` (Framer Motion)
- **Icons**: `lucide-react`
- **Backend**: Express.js custom server (`server.ts`)
- **AI Integration**: `@google/genai` TypeScript SDK (server-side proxy at `/api/chat`)
- **Database & Auth**: Firebase Firestore & Firebase Authentication
- **Build System**: Vite + `esbuild` CommonJS bundling for Cloud Run container deployments

---

## 📁 Project Structure

```
├── public/
│   ├── favicon.svg              # Brand map pin + house roof favicon
│   └── logo.svg                 # Full Dormiqa logo with typography
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Navigation header with university selector & role toggles
│   │   ├── Footer.tsx           # Footer with complete Legal & Safety links
│   │   ├── InfoHub.tsx          # Centralized Knowledge Base & Legal Documentation Hub
│   │   ├── LandingPage.tsx      # Main discovery homepage with campus listings & search
│   │   ├── SearchFilters.tsx    # Multi-parameter search & property filtering
│   │   ├── ListingDetailModal.tsx # Full listing inspection & agent details modal
│   │   ├── BusinessVerificationPage.tsx # Agent NIN/CAC identity verification portal
│   │   └── AiChatbot.tsx        # Gemini AI Student Housing Assistant
│   ├── data/
│   │   ├── mockData.ts          # Default campus listings & universities data
│   │   └── info/                # Modular documentation data
│   │       ├── legalDocs.ts     # Master Terms, Privacy, Cookies, Disclaimers
│   │       ├── safetyDocs.ts    # Agent Verification, Anti-Fraud, Review Integrity
│   │       ├── supportDocs.ts   # Help Centre, FAQs, Contact Us, Report Bug
│   │       ├── companyDocs.ts   # About Dormiqa, Mission, Vision, Careers, Press
│   │       └── index.ts         # Consolidated export & category metadata
│   ├── context/
│   │   └── AuthContext.tsx      # User authentication, university state, and view routing
│   ├── App.tsx                  # Main app entry & layout router
│   └── main.tsx                 # React DOM mount point
├── .env.example                 # Required environment variable specifications
├── firebase-applet-config.json  # Firebase client SDK configuration
├── firestore.rules              # Firestore security rules
├── server.ts                    # Express backend & Gemini API proxy server
└── index.html                   # Entry HTML with favicon & meta tags
```

---

## ⚙️ Getting Started & Installation

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and configure required keys:
```env
# Server-side Gemini API Key for AI Assistant
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```
The application will start at `http://localhost:3000`.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 🛡️ Anti-Fraud & Safety Mandate

> **Important Notice**: Dormiqa NEVER charges students for searching or requesting physical property inspections. Rent payments are strictly made directly to verified property owners or agents after physical inspection. Any demand for off-platform upfront payment before viewing should be immediately reported to `abuse@dormiqa.ng`.

---

## 📄 License & Copyright

© 2026 **Dormiqa Africa Inc.** All rights reserved.
