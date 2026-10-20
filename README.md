# EmoSense B2B — AI Customer Emotion Analytics Dashboard

EmoSense B2B is a business dashboard that uses Google Gemini AI to analyze customer emotions and surface how customers feel about a brand, product, or interaction. Built for businesses that want fast, visual sentiment and emotion insights from customer text.

## What it does

- **Emotion detection** — analyzes customer text or feedback and detects the emotions behind it, then shows a clear response automatically.
- **B2B analytics dashboard** — visualizes customer emotion data for business teams in a single-page React app.

## How it's built

- `App.tsx` + `components/` — the React dashboard UI.
- `services/geminiService.ts` — calls the Gemini AI API for emotion analysis.
- `services/authService.ts` — authentication for the app.
- `types.ts` — shared TypeScript data types.
- `index.html` / `index.tsx` — app entry points; `metadata.json` — app metadata.
- Vite + React + TypeScript.

## Run it locally

```bash
npm install
# create a .env.local file with your Gemini API key:
# GEMINI_API_KEY=your_api_key_here
npm run dev
```

## Tech stack

React · TypeScript · Vite · Gemini AI

---

**Built by Muhammad Mohsin — Onyx AI** · [YouTube](https://www.youtube.com/@onyxaipk) · [All products](https://mohsina91.gumroad.com) · [Catalog](https://onyxailabs.github.io/Catalog/)
