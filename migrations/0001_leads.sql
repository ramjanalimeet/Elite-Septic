CREATE TABLE IF NOT EXISTS leads (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL DEFAULT '',
 service TEXT NOT NULL, message TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','called','scheduled','done','spam')),
 note TEXT NOT NULL DEFAULT '', booking_date TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 1, expires INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS leads_created ON leads(created_at DESC);
