# CLUEY CART 🛒✨
### The Niche-Aware AI Feedback & Action Engine

> **A specialized B2B feedback analytics platform built for e-commerce boutique store owners and marketplace sellers (Shopify, Meesho, Amazon). Filters out delivery courier noise and converts customer reviews into prioritized weekly operational checklists using Google Gemini AI, Supabase, and Vercel.**

---

## 🚀 Key Features

1. **Store Persona Setup & Multi-Store Switcher:**
   - Define custom niche parameters: Product Category (e.g. *Ethnic Wear & Handloom*), Target Demographic (*Women 25–45*), Price Tier, and Brand Tone.
   - Calibrate **acceptable artisanal variations** (e.g., natural handloom weave slubs, vegetable dye earthy scent) so Gemini does not flag them as manufacturing defects.
   - Live segmented store switcher in the header with persistent multi-store state.

2. **Noise-Stripping & Niche AI Categorization (Google Gemini 1.5):**
   - Strips out 3rd-party logistics noise (courier delays, damaged shipping cartons outside merchant control).
   - Deconstructs feedback across 6 core dimensions: *Sizing & Fit*, *Fabric & Material*, *Craftsmanship & Stitching*, *Color Fidelity*, *Price & Value*, and *Service*.
   - Computes net sentiment score (-100 to +100) and extracts key phrase telemetry.

3. **Interactive Operational Action Checklist:**
   - Automatically translates high-frequency review flaws into a checkable weekly punch-list.
   - Tags each task with Department (*Sizing/Catalog*, *Manufacturing*, *Packaging*, *Photography*) and estimated return rate reduction impact (e.g., *"Reduces return rate by ~24%"*).
   - Stateful task completion with celebratory feedback.

4. **Smart Sentiment Trend Alerts (Anomalies):**
   - High-visibility pulsing warning cards proactively flag statistical negative feedback surges (e.g. *+38.5% Sizing surge on XL kurtis*).

5. **AI Auto-Drafted Customer Reply Generator:**
   - Beside critical reviews, click **"Draft Public Response"** to generate an empathetic, brand-aligned public reply.
   - 1-click copy to clipboard for pasting into Shopify or Meesho seller portals.

6. **Executive Weekly Report PDF Export:**
   - 1-click client-side compiled PDF summary report containing executive telemetry, sentiment graphs, anomaly alerts, and prioritized action items.

7. **Universal CSV Ingestion & Simulator Sandbox:**
   - Drag-and-drop CSV importer with smart column mapping.
   - Includes ready-to-test sample review files in `public/samples/`.
   - Built-in Review Simulator sandbox with 1-click test scenarios (Sizing surge, logistics noise test, balanced mix) or custom review submission.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS (Luminous Design System tokens: `--r-container: 40px`, `--r-xl: 28px`), Recharts, Lucide Icons, jsPDF.
- **Backend & Database:** Supabase PostgreSQL, Row Level Security (RLS) multi-tenant policies, Supabase Auth.
- **AI Integration:** Google Gemini API (`gemini-1.5-flash`) via `@google/generative-ai`.
- **Deployment:** Vercel (unified full-stack deployment with serverless API functions in `/api`).

---

## 🏁 Quick Start Guide

### 1. Installation
```bash
npm install
```

### 2. Local Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### 3. Production Build
```bash
npm run build
```

---

## 🔑 Environment Variables Configuration

Copy `.env.example` to `.env`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini API Key
GEMINI_API_KEY=AIzaSy...your_gemini_api_key
VITE_GEMINI_API_KEY=AIzaSy...your_gemini_api_key

# Vercel Configuration
VITE_APP_URL=https://clueycart.vercel.app
```

> **Note on Out-of-the-Box Demo Mode:**
> If you launch the app without API keys, CLUEY CART automatically activates its **built-in high-precision heuristic intelligence engine**. You can explore every feature, ingest CSVs, test the simulator, toggle checklists, and download PDFs immediately. You can also paste your Gemini API key in the in-app **Connections** modal at any time.

---

## 🗄️ Supabase Database Setup

1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor**.
3. Copy and run the entire SQL schema located in [`supabase/schema.sql`](./supabase/schema.sql).
4. The schema automatically creates the required tables (`profiles`, `stores`, `reviews`, `action_items`, `sentiment_alerts`, `customer_replies`), enables Row Level Security (RLS), and sets up performance indices and auth triggers.

---

## 🚀 Deploying to Vercel

CLUEY CART is pre-configured with `vercel.json` for one-command deployment:

```bash
vercel --prod
```

In the Vercel Project Settings, add the environment variables (`GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

---

## 📄 License
MIT License. Built for e-commerce boutique merchants worldwide.
