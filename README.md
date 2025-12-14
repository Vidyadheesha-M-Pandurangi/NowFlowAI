🌌 NowFlowAI

The Instagram of Tech News — powered by AI

NowFlowAI is a premium, mobile-first, AI-native technology news platform that transforms how developers, students, and professionals consume tech content. Inspired by Instagram’s swipe-first experience and LinkedIn’s professional context, NowFlowAI aggregates technical blogs and news from leading companies and publications, summarizes them using Google Gemini, and delivers insights through a beautiful Aurora Glass UI.

This project is built to prove one idea:

Tech news doesn’t have to be boring, overwhelming, or text-heavy — it can be visual, intelligent, and delightful.

✨ Key Features
📱 Instagram-Inspired Intelligent Feed

Swipe-first, gesture-driven article cards

Double-tap to like, swipe to bookmark, long-press for instant AI summaries

High-quality visuals with clean metadata and hashtag-style takeaways

📖 Immersive Reading Experience

Full-screen slide-up reading mode

Header image blurs and fades on scroll

Title smoothly transitions into a compact sticky navbar

Dedicated AI Insight Summary explaining why the article matters

One-tap Read Aloud powered by the Web Speech API

🧠 Gemini-Powered AI Assistant

Context-aware chat (RAG-style): understands the article you’re reading

Real-time answers using Google Search tools

Tone controls: Concise / Detailed / ELI5

Push-to-talk voice input

🎧 Audio-First Exploration (Future-Ready)

Vertical, swipeable audio briefings (TikTok/Reels-style)

Auto-advancing tracks with immersive visuals

🎨 Aurora Glass Design System

Animated gradient backgrounds with subtle noise texture

Glassmorphism UI with blur, translucency, and thin borders

Smooth micro-animations and editorial typography

🧱 Tech Stack
Layer	Technology
Framework	React 18 (Functional Components + Hooks)
Language	TypeScript
Styling	Tailwind CSS v3.4+
Icons	lucide-react
AI Engine	Google Gemini API (@google/genai)
Persistence	LocalStorage
Audio	Web Speech API (TTS & Speech Recognition)

🔌 Gemini Integration

Gemini powers the intelligence layer of NowFlowAI:

Article Summaries & Insights

Contextual Chat (RAG-style) — injects active article content into prompts

Personalized Recommendations based on reading history

AI-Generated App Logo using gemini-2.5-flash-image

All Gemini interactions are centralized in geminiService.ts.

💾 Local Persistence

The app stores user data client-side using LocalStorage:

nowflow:bookmarks
nowflow:history
nowflow:settings
nowflow:theme


This keeps the experience fast, private, and resilient.

♿ Accessibility & Performance

Keyboard alternatives for gestures

ARIA labels for interactive elements

prefers-reduced-motion respected

Debounced search & optimized rendering

Offline fallback using cached mock data

🎯 Project Goals

Demonstrate AI-native product thinking

Showcase premium UI/UX engineering

Build a realistic, production-grade prototype

Combine design, frontend, and AI systems into one cohesive product

🧪 Status

🚧 Prototype / Contest Submission Stage
Future plans include backend scraping pipelines, user accounts, and deeper personalization.

⭐ Final Note

NowFlowAI is not just a news app — it’s an experiment in how AI, design, and modern web engineering can reshape daily knowledge consumption.

If this repo caught your attention, feel free to ⭐ star it or fork it.









