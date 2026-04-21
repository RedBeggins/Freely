# Freely 🚀

[![Open Source](https://img.shields.io/badge/Open%20Source-❤️-blue)](https://github.com/RedBeggins/freely)
[![Tauri](https://img.shields.io/badge/Built%20with-Tauri-orange)](https://tauri.app/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](LICENSE)

> A lightning-fast, privacy-first AI assistant that works seamlessly during meetings, interviews, and conversations — completely free, forever.

---

## ⚡ Lightweight. Private. Always on.

### 🎯 Just 10MB · Always On Display · One Click Away

|       🪶 **Ultra Lightweight**       |         📺 **Always Visible**         |          ⚡ **Instant Access**          |
| :----------------------------------: | :-----------------------------------: | :-------------------------------------: |
|    **Only ~10MB** total app size     | **Translucent overlay** on any window | **One click** to activate AI assistance |
|   **50% less compute power** usage   |    Always on top, never intrusive     |  Overlaps seamlessly with your workflow  |
|       **<100ms** startup time        |      Perfect transparency level       |       Ready when you need it most       |

---

## ✅ Everything is Free

All features in Freely are available at no cost — no license keys, no subscriptions, no accounts. Just download and use it.

---

# Features

## Invisibility Mode

Freely operates with complete stealth during sensitive scenarios. The application features a translucent overlay window that sits above all other applications, making it invisible in video calls, screen shares, and recordings. It is undetectable in Zoom, Google Meet, Microsoft Teams, and Slack Huddles. Your audience won't see it while you get real-time AI assistance.

## System Audio Capture

Capture and transcribe system audio in real-time — perfect for meetings, presentations, or any audio playing on your system. Captured audio is processed through your selected speech-to-text provider and sent to the AI for analysis or transcription. Includes voice activity detection and real-time audio visualization.

**Keyboard Shortcut:** `Cmd+Shift+M` (macOS) / `Ctrl+Shift+M` (Windows/Linux)

## Voice Input

Record your voice and convert it to text using advanced speech-to-text providers including OpenAI Whisper, ElevenLabs, Groq Whisper, and custom providers. Voice activity detection automatically identifies when you're speaking.

**Keyboard Shortcut:** `Cmd+Shift+A` (macOS) / `Ctrl+Shift+A` (Windows/Linux)

## Screenshot Capture

Capture screenshots and send them to AI for visual analysis. Two modes available:

- **Screenshot Mode:** Capture the entire screen instantly.
- **Selection Mode:** Click and drag to select a specific area.

**Keyboard Shortcut:** `Cmd+Shift+S` (macOS) / `Ctrl+Shift+S` (Windows/Linux)

**Processing Modes:**

- **Manual Mode:** Screenshots are added to your attached files. Capture multiple and submit them later with your own prompt.
- **Auto Mode:** Screenshots are automatically submitted to AI using a pre-configured prompt for instant analysis.

## File Attachments

Attach documents, images, code files, or any text-based content to your AI conversations. Drag and drop files directly into the input area or browse from your system. Files are displayed as chips and can be removed individually or cleared all at once.

---

# Dashboard

Access all features and settings through an intuitive sidebar. Open with `Cmd+Shift+D` (macOS) / `Ctrl+Shift+D` (Windows/Linux).

## Chats

View and manage your full conversation history, organized by date. Search conversations by title, browse message counts, and continue any previous chat. Export any conversation as a markdown file or delete it when no longer needed.

## System Prompts

Create and manage custom system prompts to define how the AI behaves. Features include:

- Create, edit, and delete prompts
- Set an active prompt that applies to all interactions
- Search prompts by name or content
- AI-powered prompt generation
- Visual indicator for the currently selected prompt

## App Settings

- **Theme:** Light, dark, or system default
- **Autostart:** Launch silently at system startup
- **App Icon Visibility:** Show or hide the dock/taskbar icon
- **Always On Top:** Keep the overlay above all other windows

## Responses

- **Response Length:** Short, Medium, Long, or Auto
- **Response Language:** Over 50 supported languages
- **Auto-Scroll:** Automatically scroll to the latest message

## Screenshot Settings

Configure capture method (full screen or selection) and processing mode (manual or auto). Set a default auto prompt for instant AI analysis.

## Audio Settings

Select your preferred microphone and system audio capture devices. All available audio devices are listed with real-time status.

## Cursor & Shortcuts

**Cursor modes:** Invisible, Default, or Auto.

**Customizable keyboard shortcuts:**

| Action | Default (macOS) | Default (Windows/Linux) |
|---|---|---|
| Toggle Dashboard | `Cmd+Shift+D` | `Ctrl+Shift+D` |
| Toggle Overlay Window | `Cmd+\` | `Ctrl+\` |
| Refocus Input | `Cmd+Shift+I` | `Ctrl+Shift+I` |
| Move Window | `Cmd` + Arrow Keys | `Ctrl` + Arrow Keys |
| System Audio | `Cmd+Shift+M` | `Ctrl+Shift+M` |
| Voice Input | `Cmd+Shift+A` | `Ctrl+Shift+A` |
| Screenshot | `Cmd+Shift+S` | `Ctrl+Shift+S` |

## Dev Space

Configure AI and speech-to-text providers using simple curl commands. Supports full streaming and non-streaming.

**Pre-configured AI providers:** OpenAI, Anthropic Claude, Google Gemini, xAI Grok, Mistral, Cohere, Perplexity, Groq, Ollama.

**Pre-configured STT providers:** OpenAI Whisper, ElevenLabs, Groq Whisper, Google Speech-to-Text, Deepgram, Azure, Speechmatics, Rev.ai, IBM Watson.

**Custom AI Provider Example:**

```bash
curl -X POST https://api.example.com/v1/chat/completions \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "{{MODEL}}",
    "messages": [
      {"role": "system", "content": "{{SYSTEM_PROMPT}}"},
      {"role": "user", "content": "{{TEXT}}"}
    ]
  }'
```

**Dynamic variables:** `{{TEXT}}`, `{{IMAGE}}`, `{{SYSTEM_PROMPT}}`, `{{MODEL}}`, `{{API_KEY}}` (AI) · `{{AUDIO}}`, `{{API_KEY}}`, `{{LANGUAGE}}` (STT)

---

# Why Freely?

## Complete Invisibility

The translucent overlay is undetectable in video calls, screen shares, and recordings. Adjust transparency, toggle visibility instantly with keyboard shortcuts, and move it anywhere on your screen.

## Privacy-First Architecture

- **Local storage:** All conversations stored in a local SQLite database. Nothing leaves your device.
- **No telemetry:** No analytics, no usage tracking, no data collection of any kind.
- **Zero server dependency:** API calls go directly from your device to your chosen AI provider. No proxy, no middleware.
- **Secure credentials:** API keys stored in local storage and never sent anywhere except your provider.
- **Offline capable:** All local features work without internet. You only need a connection for AI responses.

## Blazing Fast Performance

- ~10MB app size
- Launches in under 100ms
- Typically under 50MB RAM during normal operation
- Built on Tauri + Rust — no Electron, no embedded Chromium

## Complete Control

- Connect to any LLM or STT provider via curl commands
- Create unlimited custom system prompts
- Customize all keyboard shortcuts
- Adjust transparency, window behavior, response settings, and more
- Full GPL v3 open source — inspect, modify, fork freely

## Always Ready

- Persistent conversation history in SQLite
- Background operation with autostart support
- Hide the dock icon for full stealth
- No subscriptions, no accounts, no maintenance

---

## 📋 Prerequisites

Before building from source, install the required system dependencies for your platform:

👉 [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

---

## Installation & Setup

### Requirements

- Node.js v18+
- Rust (latest stable)
- npm or yarn

### Quick Start

```bash
# Clone the repository
git clone https://github.com/RedBeggins/freely.git
cd freely

# Install dependencies
npm install

# Start development server
npm run tauri dev
```

### Build for Production

```bash
npm run tauri build
```

Output in `src-tauri/target/release/bundle/`:

- **macOS:** `.dmg`
- **Windows:** `.msi`, `.exe`
- **Linux:** `.deb`, `.rpm`, `.AppImage`

---

## Contributing

We keep contributions focused to keep Freely lean and reliable.

- ✅ Bug fixes and improvements to existing functionality are welcome.
- ❌ New AI/STT providers, feature requests, and large UI overhauls are not currently accepted via PR.

### How to Contribute

1. Find an open bug or issue that fits the guidelines above.
2. Fork the repository and create a feature branch.
3. Fix the bug, add tests where applicable, and submit a clear PR.

```bash
git checkout -b fix/your-fix
git commit -m 'Fix: description of the fix'
git push origin fix/your-fix
# Open a Pull Request
```

---

## 📄 License

Licensed under the **GNU General Public License v3.0** — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **[Pluely](https://github.com/iamsrikanthnani/pluely)** — The open source project this fork is based on
- **[Tauri](https://tauri.app/)** — Desktop application framework
- **[tauri-nspanel](https://github.com/ahkohd/tauri-nspanel)** — macOS native panel integration
- **[shadcn/ui](https://ui.shadcn.com/)** — UI components
- **[@ricky0123/vad-react](https://github.com/ricky0123/vad)** — Voice Activity Detection
- **[OpenAI](https://openai.com/)** — GPT models and Whisper API
- **[Anthropic](https://anthropic.com/)** — Claude AI models
- **[xAI](https://x.ai/)** — Grok AI models
- **[Google](https://gemini.google.com/)** — Gemini AI models

---

## 🔗 Links

- **Issues:** [GitHub Issues](https://github.com/RedBeggins/freely/issues)
- **Discussions:** [GitHub Discussions](https://github.com/RedBeggins/freely/discussions)
