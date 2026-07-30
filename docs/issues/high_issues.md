# 🟠 High Issues

---

## H-01: Arbitrary SQL Execution via IPC — No Query Validation or Allowlisting

**File:** `src/main/index.js:73-79`, `src/preload/index.js:7`
**Root Cause:** The `execute-sql` IPC handler passes any string from the renderer directly to `sqlite3.exe` via stdin. The preload exposes `window.api.db.execute(sql)` with no restriction on the SQL content. Any renderer-side code (or XSS payload injected via a product name displayed without sanitization) can execute `DROP TABLE`, `UPDATE users SET password_hash = ...`, or read the full users table.
**Impact:** Full database compromise. Although the app runs locally, any XSS vector (e.g., a supplier name containing a `<script>` tag rendered in an unsafe context) could escalate to arbitrary SQL execution.
**Fix:** Implement a command-type allowlist in the IPC handler:
```js
ipcMain.handle('execute-sql', async (event, sqlQuery) => {
  const forbidden = /^\s*(DROP|ALTER\s+TABLE\s+\w+\s+RENAME|ATTACH|DETACH)/i
  if (forbidden.test(sqlQuery)) {
    throw new Error('Forbidden SQL operation')
  }
  return await executeSql(sqlQuery)
})
```
Long-term: migrate to parameterized queries via better-sqlite3 instead of spawning sqlite3.exe.

---

## H-02: `escapeSql()` Only Escapes Single Quotes — Backslash, Null Bytes, and Unicode Bypass

**File:** `src/renderer/src/lib/utils.js:10-13`
**Root Cause:** `escapeSql` does `str.replace(/'/g, "''")` only. While SQLite standard quoting does not use backslash escapes, the function does not strip null bytes (`\0`) or control characters. A null byte in a string literal can truncate the SQL statement in the sqlite3 CLI, causing the rest of the query to be interpreted as a new command.
**Impact:** A crafted product name or client name containing `\0` could break out of a string literal and inject arbitrary SQL commands.
**Fix:**
```js
export function escapeSql(str) {
  if (!str) return ''
  return str.toString()
    .replace(/\0/g, '')          // strip null bytes
    .replace(/'/g, "''")         // standard SQL single-quote escape
}
```

---

## H-03: PIN Stored and Compared as Plaintext in `password_hash` Column

**File:** `src/renderer/src/hooks/usePOSController.js:111`, `src/renderer/src/lib/dao/shifts.dao.js:109`
**Root Cause:** User PINs are stored in the `password_hash` column as plaintext strings. Authentication queries compare the raw PIN directly: `WHERE password_hash = '${escapedPin}'`. The column name `password_hash` is misleading — no hashing is applied.
**Impact:** Anyone with file-system access (or a backup copy) can read every user's PIN in cleartext from the `users` table. Combined with H-01, any renderer-side code can query all PINs.
**Fix:** Hash PINs at creation time and compare hashes at login. For a 4-digit POS PIN, even a simple salted hash is a significant improvement:
```js
import { createHash } from 'crypto'
const hashPin = (pin, salt) => createHash('sha256').update(salt + pin).digest('hex')
```

---

## H-04: Failed Transaction `ROLLBACK` in Separate `executeSql` Call Is a No-Op

**File:** `src/renderer/src/hooks/useExpensesManager.js:56`, `src/renderer/src/hooks/useDamagedGoodsManager.js:78`, `src/renderer/src/hooks/useDamagedGoodsManager.js:101`
**Root Cause:** When a transaction fails in the `catch` block, the code calls `await executeQuery('ROLLBACK;')`. But `executeSql` spawns a new `sqlite3.exe` process per call. The new process has no active transaction — the `ROLLBACK` is a no-op against a fresh connection. The original process already exited (and its transaction was automatically rolled back by SQLite on process exit), so this is harmless — but it creates a false sense of manual transaction recovery.
**Impact:** Misleading error handling. If the original process exits non-zero, SQLite's implicit rollback is the actual safety net. The explicit `ROLLBACK` call is dead code that could mask real problems in debugging.
**Fix:** Remove the redundant `ROLLBACK` calls. Add a code comment explaining that SQLite auto-rolls back on process exit:
```js
} catch (err) {
  // No manual ROLLBACK needed: sqlite3.exe process exit auto-rolls back
  triggerCustomAlert('...: ' + err.message)
}
```

---

## H-05: Supplier Delete Performs Three Separate Non-Transactional DELETEs — Partial Deletion Possible

**File:** `src/renderer/src/hooks/useSuppliersManager.js:126-129`
**Root Cause:** `handleDeleteSupplier` executes three separate `DELETE` statements (ledger, purchases, supplier) as three independent `executeQuery` calls — each in its own `sqlite3.exe` process. If the second DELETE fails (e.g., FK constraint), the first DELETE has already committed, leaving the supplier with a deleted ledger but intact purchases.
**Impact:** Orphaned records, data inconsistency. The supplier's ledger is gone but the supplier and their purchases remain.
**Fix:** Wrap all three in a single transaction:
```js
let sql = 'BEGIN TRANSACTION;\n'
sql += `DELETE FROM supplier_ledger WHERE supplier_id = ${supplierId};\n`
sql += `DELETE FROM supplier_purchases WHERE supplier_id = ${supplierId};\n`
sql += `DELETE FROM suppliers WHERE id = ${supplierId};\n`
sql += 'COMMIT;\n'
await executeQuery(sql)
```

---

## H-06: `new Date().toLocaleString('ar-EG')` Produces Locale-Dependent Timestamps — Unparseable Across Environments

**File:** All hooks and DAOs (30+ occurrences)
**Root Cause:** Every timestamp stored in the database is generated by `new Date().toLocaleString('ar-EG')`, which produces Arabic-Indic digits and locale-specific date formats (e.g., `٢٤‏/٧‏/٢٠٢٦ ١٢:٠١:٥٩ م`). The output format varies by Node.js/Electron version and ICU data. `parseLocaleDateString()` attempts to parse these back, but it relies on regex heuristics that break on edge cases.
**Impact:** Timestamps cannot be reliably sorted, compared, or filtered at the SQL level. The `checks_register.due_date` comparison against today's date in `fetchChecksDueToday` tries both ISO and locale formats — a brittle heuristic that frequently fails.
**Fix:** Store ISO 8601 timestamps in the DB. Format for display only at the UI layer:
```js
const nowISO = new Date().toISOString()
// Store nowISO in DB; format with toLocaleString('ar-EG') only in JSX
```

---

## H-07: `sandbox: false` in BrowserWindow Disables Chromium Process Sandboxing

**File:** `src/main/index.js:27`
**Root Cause:** `webPreferences: { sandbox: false }` disables the Chromium renderer sandbox. Combined with `contextIsolation: true` (default) and the preload bridge, this is partially mitigated, but it still means the renderer process runs with the full privilege of the Electron app — any RCE vulnerability in Chromium gives full Node.js access.
**Impact:** Elevated attack surface. A single renderer exploit escalates to full OS access.
**Fix:** Enable sandbox and use the preload script's `contextBridge` (already in place) as the sole communication channel. Test that all IPC calls work with `sandbox: true`.

---

## H-08: DB Error Messages Exposed Raw to End Users via `triggerCustomAlert`

**File:** `usePOSController.js:163`, `useSuppliersManager.js:59,93,119`, `useClientsManager.js:246,284,319,349`, `useProductsManager.js:69,113`, `useChecksManager.js:55,66,79`, `useExpensesManager.js:57`, `useDamagedGoodsManager.js:79`, `useSalesManager.js:144,196`
**Root Cause:** Every `catch` block appends `err.message` to the Arabic alert string. This exposes raw SQLite error messages (table names, column names, constraint names, trigger text) directly to the end user.
**Impact:** Information disclosure. Users see internal DB schema details. Technical error messages in English mixed with Arabic UI are confusing and unprofessional.
**Fix:** Map known error patterns to user-friendly Arabic messages:
```js
function friendlyError(err) {
  const msg = err.message || ''
  if (msg.includes('UNIQUE constraint')) return 'هذا السجل موجود بالفعل.'
  if (msg.includes('FOREIGN KEY')) return 'لا يمكن الحذف - مرتبط بسجلات أخرى.'
  if (msg.includes('نفاد الكمية')) return 'الكمية غير متوفرة بالمخزن.'
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
}
```

---

## H-09: `fetchChecksDueToday` Uses Unreliable Date Matching — Most Due Checks Are Never Surfaced

**File:** `src/renderer/src/hooks/useChecksManager.js:20-33`
**Root Cause:** The query matches `due_date = '${todayISO}'` (ISO format) OR `due_date LIKE '%${new Date().getDate()}%'` (just the day number). But `due_date` is stored via user input — the `AddCheckModal` uses an HTML date input which yields ISO `YYYY-MM-DD`, while previously entered checks may have locale-formatted dates. The `LIKE '%dayNum%'` clause matches any date containing that digit anywhere (e.g., day 2 matches dates with "2" in the year/month).
**Impact:** False positives (checks not due today are surfaced) and false negatives (checks due today are missed if their date format doesn't match either pattern). The "checks due today" alert is unreliable.
**Fix:** Normalize all `due_date` values to ISO format at insertion time, then use exact match:
```sql
WHERE status = 'غير مسدد' AND due_date = '${todayISO}'
```

---

## H-10: Production Silences ALL Console Output Including Errors

**File:** `src/main/index.js:10-15`
**Root Cause:** `console.log = () => {}` and `console.error = () => {}` in production mode. This suppresses all diagnostic output, including critical errors from `initializeDatabase`, SQL execution failures, and printer errors.
**Impact:** In production, if the database fails to initialize or a migration fails, there is zero diagnostic output. Support and debugging become impossible.
**Fix:** Keep `console.error` and `console.warn` active in production. Redirect to a log file:
```js
if (app.isPackaged) {
  const logPath = path.join(app.getPath('userData'), 'app.log')
  const logStream = fs.createWriteStream(logPath, { flags: 'a' })
  console.log = () => {}
  console.info = () => {}
  // Keep error and warn for diagnostics
}
```

---

## H-11: `handleDeleteClient` Only Checks `debt_balance > 0` — Client with Negative Balance (Credit) Is Deletable Despite Active Ledger

**File:** `src/renderer/src/hooks/useClientsManager.js:334`
**Root Cause:** The guard only prevents deletion when `debt_balance > 0`. If a client has a negative balance (overpayment/credit), `debt_balance < 0` passes the check, and the client is deleted. Their ledger entries and sale references become orphaned.
**Impact:** Accounting data loss. The client's credit balance disappears. Sales referencing this client's ID now point to a nonexistent record.
**Fix:**
```js
if (client.debt_balance !== 0) {
  triggerCustomAlert('لا يمكن حذف عميل لديه رصيد مالي (دائن أو مدين)!')
  return
}
```

---

## H-12: Expense Deletion Does Not Reverse the Corresponding `safe_ledger` Outflow Entry

**File:** `src/renderer/src/hooks/useExpensesManager.js:61-75`
**Root Cause:** `handleDeleteExpense` deletes the expense record from the `expenses` table but does not remove or reverse the corresponding `safe_ledger` outflow entry that was created when the expense was added. The deletion warning says "سجل الخزنة التاريخي" won't be auto-reversed, but this is a known data integrity issue, not just a UX notice.
**Impact:** After deleting an expense, the `safe_ledger` still shows the outflow. Shift cash reconciliation will be wrong — expected cash will be lower than it should be by the deleted expense's amount.
**Fix:** Delete both the expense and its corresponding ledger entry in one transaction:
```js
let sql = 'BEGIN TRANSACTION;\n'
sql += `DELETE FROM expenses WHERE id = ${expenseId};\n`
sql += `DELETE FROM safe_ledger WHERE description LIKE '%${escapeSql(expenseDesc)}%' AND amount = ${expenseAmount} AND type = 'outflow';\n`
sql += 'COMMIT;\n'
await executeQuery(sql)
```
