import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

export function openSqliteConnection(dbPath: string): DatabaseSync {
  const dir = dirname(dbPath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')

  db.exec(`
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

  return db
}
