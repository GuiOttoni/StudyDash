# StudyDash

Self-hosted learning dashboard with AI-powered study generation.
Install once, run anywhere — no Docker, no databases to configure.

```bash
npm install -g studydash
studydash up
```

---

## Requirements

- **Node.js 20+**
- An API key from [Anthropic](https://console.anthropic.com/) or [Google AI Studio](https://aistudio.google.com/)

---

## Quick Start

```bash
# 1. Install globally
npm install -g studydash

# 2. Configure your AI provider and API key
studydash config

# 3. Start
studydash up
# → API running at  http://localhost:5055
# → Dashboard at    http://localhost:8085
```

---

## CLI Commands

| Command | Description |
| ------- | ----------- |
| `studydash up` | Start the API and frontend |
| `studydash down` | Stop all processes |
| `studydash config` | Interactive wizard: provider, API key, model, skills, ports |
| `studydash status` | Show running processes and current configuration |

---

## Generating Studies

### Via the Dashboard UI

1. Open `http://localhost:8085`
2. Click **IA** in the header
3. Go to the **Gerar Estudo** tab
4. Describe the topic and click **Gerar estudo**

The study is saved and appears in the catalog at `/studies/{slug}`.

### What the AI generates

Each study is assembled by the AI using a set of **skills** (tool calls):

| Skill | Content |
| ----- | ------- |
| `set_metadata` | Title, slug, category, icon, description |
| `add_explanation` | Text sections with optional tip/warning callouts and bullet lists |
| `add_code_snippet` | Syntax-highlighted code examples with title and description |
| `add_comparison` | Side-by-side comparison tables with pros/cons |
| `add_quiz` | Multiple-choice questions with answers and explanations |

You can enable or disable individual skills in **Settings → Skills**.

---

## Configuration

Configuration is stored at `~/.studydash/config.json`.
Use `studydash config` or the Settings UI (`/settings`) to edit it.

### AI Provider

```json
{
  "ai": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "apiKey": "sk-ant-..."
  }
}
```

Supported providers:

| Provider    | Models                                                      |
| ----------- | ----------------------------------------------------------- |
| `anthropic` | `claude-opus-4-6`, `claude-sonnet-4-6`, `claude-haiku-4-5` |
| `google`    | `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`    |

### Skills

```json
{
  "ai": {
    "skills": {
      "codeSnippet": true,
      "comparison":  true,
      "quiz":        true,
      "explanation": true,
      "diagram":     false
    }
  }
}
```

### Ports

```json
{
  "backend":  { "port": 5055 },
  "frontend": { "port": 8085 }
}
```

---

## Data Storage

All data lives at `~/.studydash/`:

| Path | Contents |
| ---- | -------- |
| `~/.studydash/config.json` | Configuration (provider, API key, ports, skills) |
| `~/.studydash/studydash.db` | SQLite database (catalog sections, studies, AI content) |
| `~/.studydash/.pids` | Running process PIDs (used by `up`/`down`/`status`) |

The catalog starts empty. Everything is created through the UI or via `studydash generate`.

---

## Architecture

```text
studydash/
├── api/                  ← Hono (Node.js) API
│   └── src/
│       ├── routes/       ← catalog.ts · config.ts · ai.ts
│       ├── ai/
│       │   ├── skills.ts       ← tool definitions (Claude + Gemini)
│       │   ├── generate.ts     ← applySkillCall · generateStudy
│       │   └── providers/
│       │       ├── claude.ts   ← Anthropic tool_use agentic loop
│       │       └── gemini.ts   ← Gemini function calling loop
│       └── db/
│           ├── schema.ts       ← Drizzle tables (sections, studies, aiStudyContent)
│           └── client.ts       ← SQLite at ~/.studydash/studydash.db
│
├── cli/                  ← commander CLI (up · down · config · status)
│
├── frontend/             ← Next.js 16 (App Router, standalone output)
│   └── app/
│       ├── settings/     ← 4-tab Settings UI (AI, Skills, Backend, Generate)
│       └── studies/[slug]  ← AI study renderer
│
└── build.mjs             ← esbuild for api + cli, Next.js standalone copy
```

### AI Generation Flow

```text
User prompt
    │
    ▼
generateStudy(prompt)
    │
    ├─ provider: anthropic ──▶ Anthropic tool_use loop
    │                               AI calls: set_metadata → add_explanation
    │                                          → add_code_snippet → add_comparison
    │                                          → add_quiz (× N iterations)
    │
    └─ provider: google ────▶ Gemini function calling loop
                                    same skills as FunctionDeclarations

applySkillCall() assembles GeneratedStudy object
    │
    ▼
Saved to ~/.studydash/studydash.db
Accessible at /studies/{slug}
```

---

## Settings UI

Access at `http://localhost:8085/settings` (or click **IA** in the header).

| Tab | Contents |
| --- | -------- |
| **Inteligência Artificial** | Provider, API key, model selection |
| **Skills** | Toggle individual skills on/off |
| **Backend** | API and frontend port numbers |
| **Gerar Estudo** | Prompt textarea → trigger AI study generation |

---

## Development

```bash
# Clone
git clone https://github.com/your-username/studydash.git
cd studydash

# Install root deps
npm install

# Install frontend deps
cd frontend && npm install && cd ..

# Dev mode (API + frontend with hot reload)
npm run dev

# Build for distribution
npm run build
# → dist/api.js        (Hono API, bundled)
# → dist/cli/index.js  (CLI binary)
# → dist/frontend/     (Next.js standalone)
```

### Local install from source

```bash
npm run build
npm install -g .
studydash up
```

---

## Publishing to npm

### One-time setup

1. Create an account at [npmjs.com](https://www.npmjs.com/)

2. Login from your terminal:

   ```bash
   npm login
   ```

3. Generate an **Automation token** (for CI):
   - Go to npmjs.com → Account → Access Tokens → Generate New Token → **Automation**
   - Copy the token

4. Add the token as a GitHub secret:
   - Repository → Settings → Secrets and variables → Actions → New secret
   - Name: `NPM_TOKEN`
   - Value: the token you copied

### Manual publish

```bash
npm run build
npm publish
```

### Automated publish (CI/CD)

Every push to the `boilerplate-cli` branch that changes `package.json` version triggers a build and `npm publish` via GitHub Actions. See [`.github/workflows/publish.yml`](.github/workflows/publish.yml).

To release a new version:

```bash
# Bump version
npm version patch   # 0.1.0 → 0.1.1
# or
npm version minor   # 0.1.0 → 0.2.0

# Push (triggers CI)
git push origin boilerplate-cli --tags
```

---

## License

MIT
