// ─────────────────────────────────────────────────────────────
// Database IPC Bridge
// Sends SQL queries to the Electron main process via IPC.
// Falls back to the browser mock when running outside Electron.
// ─────────────────────────────────────────────────────────────
import { mockDbExecute } from './mockDb'

/**
 * Execute a raw SQL query string through the Electron IPC bridge.
 * Returns an array of result rows (objects), or [] for non-SELECT statements.
 *
 * @param {string} sqlQuery
 * @returns {Promise<object[]>}
 */
export async function executeQuery(sqlQuery) {
  if (window.api && window.api.db && window.api.db.execute) {
    try {
      return await window.api.db.execute(sqlQuery)
    } catch (err) {
      console.error('[DB] Native Error:', err.message)
      throw err
    }
  }
  // Fallback for browser-only previews (no Electron context)
  console.warn('[DB] IPC bridge unavailable — using mock database.')
  return mockDbExecute(sqlQuery)
}
