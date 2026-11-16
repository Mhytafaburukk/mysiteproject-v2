# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # deps: express, better-sqlite3, cors, body-parser
npm start            # node server.js — serves http://localhost:5001 (0.0.0.0, PORT env overrides)
```

There is no build step, linter, or test suite. Frontend is static HTML/JS served directly by Express; edits to `public/` are visible on refresh, while server-side changes require restarting `npm start`.

## Architecture

An English-learning platform with a Turkish UI: a vanilla-JS multi-page frontend plus an Express API backed by SQLite, with an AI "English Mentor" that works either through a user-supplied LLM key or a built-in rule-based fallback engine.

### Backend (`server.js` → `database.js`, `ai_service.js`)

- **`server.js`** is the only Express entry point. It mounts `public/` statically and defines every route inline. It never touches SQL directly — all persistence goes through `database.js`; all AI text generation goes through `ai_service.js`.
- **`database.js`** wraps `better-sqlite3` synchronously (WAL mode, foreign keys on). Schema is created at `require` time via `CREATE TABLE IF NOT EXISTS`, and later column additions are done as `try { ALTER TABLE ... } catch {}` migration blocks — follow that pattern when adding columns. Passwords are SHA-256 hashed; `verifyLogin` transparently upgrades legacy plaintext passwords. On boot, `migrateFromJSON` imports `users.json` only when the `users` table is empty.
- **`ai_service.js`** is the AI layer:
  - Provider is inferred per request from the model name and key prefix (`gemini*`/`AIza` → Gemini, `llama*`/`groq*`/`gsk_` → Groq, `openrouter*` → OpenRouter, else OpenAI). Mismatched key/model pairs return a Turkish advisory error instead of calling the API.
  - Groq model IDs are auto-discovered from `/v1/models`, filtering out non-chat models, preferring `llama-3.3-70b-versatile` then `llama-3.1-8b-instant`.
  - Gemini history goes through `sanitizeContentsForGemini`, which enforces Gemini's rule that contents start with `user` and roles alternate.
  - Every AI feature has a deterministic, non-LLM fallback used when no key is supplied or the live call fails: `generateFallbackResponse` (mentor chat; also checks active quiz state in the DB and grades the user's answer), `generateFallbackInterviewResponse`, `generateVideoCallFallback`. Keep these in sync when changing chat behavior — most users run without an API key.
  - Vocabulary for quizzes and lookups comes from `BUILTIN_VOCABULARY` in this file plus `public/all_words.js`, parsed by regex-extracting its JSON array at startup into `cachedWords`.
- **Mentor identity:** the bot user is `English_Mentor` (`AI_BOT`), created/refreshed at boot with `known_words = 5000`, `is_ai = 1`, and an SVG avatar. The frontend historically used `English_AI`; server routes normalize `English_AI` → `English_Mentor`, and new aliases should be normalized the same way. Every new registration auto-follows both directions with the mentor and receives a welcome message.
- **Auth model:** there are no sessions or tokens. Login just returns `{ success, username }`; the browser stores it in `localStorage` and sends `username` in the body/params of subsequent calls. JS API keys and model choice are also user-supplied per request (browser `localStorage` keys `mentor_api_key`, `mentor_model`) — server env vars are not used for AI.
- Admin route `/admin-get-all-users/:adminUser` is gated by a hardcoded username (`Burak`), and the mentor password is hardcoded in `server.js`.

### Frontend (`public/`)

Each `.html` file is a self-contained page with inline CSS/JS (shared base styles in `public/style.css`). Page flow: `index.html` (landing) → `giris.html` / `kaydol.html` (login/register) → `girisliindex.html` (dashboard) → feature pages: `kelime.html` (word quiz), `TumKelimeler.html` (all words), `dinleme_testi.html` (listening test), `Message.html` (chat with mentor), `video_call.html` (AI tutor video-call UI), `mock_interview.html` (modes 1–5 technical mock interviews), `Profil.html` / `Otherprofiles.html`, `Admin.html`.

- `public/all_words.js` defines the global `comprehensiveWordList` consumed by the vocabulary pages, and is also read by the server.
- `public/languages.js` exposes `window.LanguageManager` (`getPreferences`, `setPreferences`, `t(key)`, `applyUILanguage`, `renderBar`, `openModal`) plus `UI_TRANSLATIONS` for ~8 native languages and `MULTI_LANG_WORDS` overlays. It persists preferences in `localStorage` (`user_native_lang`, `user_learning_lang`, `user_word_direction`) and syncs them to `POST /update-languages`; it emits a `languagePreferencesChanged` window event. Use `LanguageManager` rather than hardcoding translations on pages that already include it.
- Text-to-speech is browser `speechSynthesis`, used in `Message.html`, `kelime.html`, `video_call.html`, and `mock_interview.html`.

### Conventions and gotchas

- UI copy, comments, and server error messages are Turkish; user-facing AI prompts mix Turkish explanations with English examples.
- DB columns are `snake_case`; JSON returned by the API is `camelCase` (e.g. `known_words` → `knownWords`) — keep new endpoints consistent.
- `english_platform.db` (with `-wal`/`-shm` files) is committed in the repo root; it is the live database, not a fixture.
- `vercel.json` only rewrites everything to `/public/$1`, so a Vercel deployment serves the static site without the Express API — AI/chat/database features need `server.js` running somewhere.
