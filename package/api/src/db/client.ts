import Database from 'better-sqlite3'
import { drizzle }  from 'drizzle-orm/better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import { homedir }  from 'os'
import { join }     from 'path'
import * as schema  from './schema.js'

// Armazena o banco em ~/.studydash/ — nunca no diretório do projeto
const STUDYDASH_DIR = join(homedir(), '.studydash')
const DB_PATH       = join(STUDYDASH_DIR, 'studydash.db')

if (!existsSync(STUDYDASH_DIR)) mkdirSync(STUDYDASH_DIR, { recursive: true })

const sqlite = new Database(DB_PATH)

// WAL mode: leituras concorrentes sem bloquear escritas
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

// ── Criação de tabelas (idempotente, sem migrations) ─────────────────────────
export function initDatabase(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sections (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT    NOT NULL UNIQUE,
      title       TEXT    NOT NULL,
      icon        TEXT    NOT NULL,
      description TEXT    NOT NULL,
      categories  TEXT    NOT NULL,
      "order"     INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS studies (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      slug           TEXT    NOT NULL UNIQUE,
      title          TEXT    NOT NULL,
      icon           TEXT    NOT NULL,
      category       TEXT    NOT NULL,
      description    TEXT    NOT NULL,
      available      INTEGER NOT NULL DEFAULT 1,
      "order"        INTEGER NOT NULL DEFAULT 0,
      ai_content_id  INTEGER
    );

    CREATE TABLE IF NOT EXISTS ai_study_content (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      study_slug   TEXT    NOT NULL UNIQUE,
      content      TEXT    NOT NULL,
      generated_by TEXT    NOT NULL,
      prompt       TEXT    NOT NULL,
      created_at   INTEGER NOT NULL
    );
  `)
}
