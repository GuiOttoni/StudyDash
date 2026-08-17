# StudyDash

Self-hosted learning dashboard with AI-powered study generation. Install once, run
anywhere — no Docker, no database setup, no API key required by default.

```bash
npm install -g studydash
studydash up
```

That's it — the dashboard opens at `http://localhost:5055`. By default it uses the
[Claude Code CLI](https://docs.claude.com/en/docs/claude-code) already installed and
authenticated on your machine, so there's nothing to configure. If you'd rather use an
Anthropic or Google API key instead, set that in **Settings** inside the dashboard.

## Requirements

- Node.js 22.5+
- Either the Claude Code CLI (default) or an API key from
  [Anthropic](https://console.anthropic.com/) / [Google AI Studio](https://aistudio.google.com/)

## CLI commands

| Command | Description |
| --- | --- |
| `studydash up` | Start the dashboard |
| `studydash down` | Stop it |
| `studydash status` | Show whether it's running and current config |

## How it works

Open **IA → Gerar Estudo** in the dashboard, describe a topic, and the AI assembles a
full study — explanations, code examples, comparison tables, a quiz, and a runnable
Node.js demo you can execute right in the browser. You can also edit any generated
study afterward, or export it as Markdown/PDF.

All data (SQLite database, config, generated code files) lives under `~/.studydash/` —
nothing is written anywhere else on your machine.

## Contributing

```bash
git clone https://github.com/GuiOttoni/StudyDash.git
cd StudyDash

cd package  && npm install
cd ../frontend && npm install

# Dev mode (API + Vite dev server with hot reload)
cd ../package && npm run dev

# Build the full distributable package
npm run build
npm test
```

## License

MIT
