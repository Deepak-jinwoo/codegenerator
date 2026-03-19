/**
 * Database helper functions using sql.js (pure JS SQLite)
 * 
 * This replaces the Trickle platform's database SDK (trickleCreateObject, etc.)
 * with a local SQLite database that persists to disk.
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'memory.db');

let db = null;

/**
 * Initialize the SQLite database.
 * Must be called before any other database function.
 */
async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database file if it exists, otherwise create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('✅ Loaded existing database from', DB_PATH);
  } else {
    db = new SQL.Database();
    console.log('✅ Created new database');
  }

  // Create tables if they don't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'New Chat',
      language TEXT NOT NULL DEFAULT 'en',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'ai')),
      content TEXT NOT NULL,
      is_error INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_session 
      ON chat_messages(session_id, created_at)
  `);

  saveToFile();
  return db;
}

/**
 * Persist the in-memory database to disk.
 */
function saveToFile() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/**
 * Generate a unique ID (similar to what Trickle would provide).
 */
function generateId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

// ── Session Functions ──

function createSession(title, language) {
  const id = generateId();
  db.run(
    `INSERT INTO chat_sessions (id, title, language) VALUES (?, ?, ?)`,
    [id, title || 'New Chat', language || 'en']
  );
  saveToFile();

  const results = db.exec(`SELECT * FROM chat_sessions WHERE id = '${id}'`);
  if (results.length > 0 && results[0].values.length > 0) {
    const row = results[0].values[0];
    const cols = results[0].columns;
    const session = {};
    cols.forEach((col, i) => session[col] = row[i]);
    return session;
  }
  return { id, title: title || 'New Chat', language: language || 'en' };
}

function getSessions(limit = 50) {
  const results = db.exec(
    `SELECT * FROM chat_sessions ORDER BY updated_at DESC LIMIT ${limit}`
  );
  if (results.length === 0) return [];

  const cols = results[0].columns;
  return results[0].values.map(row => {
    const session = {};
    cols.forEach((col, i) => session[col] = row[i]);
    return session;
  });
}

function getSession(id) {
  const results = db.exec(`SELECT * FROM chat_sessions WHERE id = '${id}'`);
  if (results.length === 0 || results[0].values.length === 0) return null;

  const cols = results[0].columns;
  const row = results[0].values[0];
  const session = {};
  cols.forEach((col, i) => session[col] = row[i]);
  return session;
}

function updateSessionTitle(id, title) {
  db.run(
    `UPDATE chat_sessions SET title = ?, updated_at = datetime('now') WHERE id = ?`,
    [title, id]
  );
  saveToFile();
}

// ── Message Functions ──

function createMessage(sessionId, role, content, isError = false) {
  const id = generateId();
  db.run(
    `INSERT INTO chat_messages (id, session_id, role, content, is_error) VALUES (?, ?, ?, ?, ?)`,
    [id, sessionId, role, content, isError ? 1 : 0]
  );
  saveToFile();
  return { id, session_id: sessionId, role, content, is_error: isError };
}

function getMessages(sessionId) {
  const stmt = db.prepare(
    `SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC`
  );
  stmt.bind([sessionId]);

  const messages = [];
  while (stmt.step()) {
    messages.push(stmt.getAsObject());
  }
  stmt.free();
  return messages;
}

/**
 * Get the N most recent messages for a session — this is the "memory" function.
 * 
 * Chain-of-Thought:
 * By fetching the last N messages and returning in chronological order,
 * we create a sliding context window. This prevents the AI prompt from
 * growing unboundedly while still providing relevant conversation history.
 */
function getConversationMemory(sessionId, messageCount = 20) {
  const stmt = db.prepare(
    `SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?`
  );
  stmt.bind([sessionId, messageCount]);

  const messages = [];
  while (stmt.step()) {
    messages.push(stmt.getAsObject());
  }
  stmt.free();
  return messages.reverse(); // Convert from DESC to chronological ASC
}

/**
 * Close the database connection gracefully.
 */
function closeDatabase() {
  if (db) {
    saveToFile();
    db.close();
    console.log('Database closed');
  }
}

module.exports = {
  initDatabase,
  createSession,
  getSessions,
  getSession,
  updateSessionTitle,
  createMessage,
  getMessages,
  getConversationMemory,
  closeDatabase
};
