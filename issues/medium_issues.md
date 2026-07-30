# 🟡 Medium Issues

---

## M-01: Floating-Point Arithmetic Used for All Monetary Calculations — Rounding Errors Accumulate

**File:** `src/renderer/src/hooks/useCart.js:20-26`, all hooks
**Root Cause:** All monetary values (prices, totals, discounts, debt balances) are stored as SQLite `REAL` (IEEE 754 double) and computed with JavaScript `parseFloat`. Binary floating-point cannot represent many decimal fractions exactly (e.g., 0.1 + 0.2 = 0.30000000000000004).
**Impact:** Over many transactions, rounding errors accumulate in `debt_balance`, `total_amount`, and profit calculations. A client's debt may show as 99.99999 instead of 100.00. Shift reconciliation differences may appear as tiny non-zero values even when the drawer is exactly correct.
**Fix:** Round all monetary values to 2 decimal places at every write boundary:
```js
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
// Apply before every INSERT/UPDATE involving money
const cartTotal = round2(Math.max(0, subTotal - (parseFloat(discount) || 0)))
```

---

## M-02: `parseLocaleDateString` Misidentifies 12:xx AM as 12:xx PM When No AM/PM Marker Present

**File:** `src/renderer/src/lib/utils.js:118-121`
**Root Cause:** The function only adjusts hours when an explicit `م` (PM) or `ص` (AM) marker is found. When the timestamp has no AM/PM marker (e.g., ISO format `2026-07-24 00:30:00`), `hours = 0` is left as-is, which is correct. However, when a locale string omits the marker for 12:xx noon (some `ar-EG` locales output `12:00:00` without `م`), the function treats it as midnight.
**Impact:** Period filters (daily/weekly/monthly) in `useClientsManager` and `fetchAnalytics` may misclassify noon transactions as midnight, causing them to fall outside the expected time window.
**Fix:** Validate the 12-hour edge case explicitly:
```js
if (isPM && hours !== 12) hours += 12
if (isAM && hours === 12) hours = 0
// If no AM/PM marker and hours < 12, leave as-is (24h format assumed)
```

---

## M-03: `fetchAnalytics` Loads All Shifts Into Memory to Filter by Date — O(n) In-Memory Scan

**File:** `src/renderer/src/hooks/useAdminController.js:59-70`
**Root Cause:** To filter analytics by period, the function fetches all shifts (`SELECT id, start_time FROM shifts`) and filters them in JavaScript using `parseLocaleDateString`. As the number of shifts grows (years of operation), this loads an unbounded result set into memory.
**Impact:** Performance degrades linearly with shift count. With 3 years of daily shifts (~1000 rows), this is a noticeable delay. The in-memory date parsing is also less accurate than a SQL date comparison.
**Fix:** Store timestamps in ISO format (see H-06) and filter in SQL:
```sql
SELECT id FROM shifts WHERE start_time >= '${sinceDate.toISOString()}'
```

---

## M-04: `fetchClientStats` Issues One SQL Query Per Client in a Loop — N+1 Query Problem

**File:** `src/renderer/src/hooks/useClientsManager.js:135-145`
**Root Cause:** After computing per-client totals in JavaScript, the function loops over `sortedClients` and issues a separate `SELECT name, phone FROM clients WHERE id = ${item.client_id}` for each client. With 50 active clients in a month, this is 50 sequential round-trips to `sqlite3.exe`.
**Impact:** Each `sqlite3.exe` spawn takes ~50-100ms on Windows. Loading the clients tab can take 2-5 seconds with a moderate client base.
**Fix:** Fetch all client details in one query and join in memory:
```js
const allClients = await executeQuery(`SELECT id, name, phone FROM clients;`)
const clientMap = Object.fromEntries(allClients.map(c => [c.id, c]))
const reportData = sortedClients.map(item => ({
  ...item,
  name: clientMap[item.client_id]?.name || '',
  phone: clientMap[item.client_id]?.phone || ''
}))
```

---

## M-05: `handleReturnItem` Uses `selectedSale` From Stale React State for Payment Type Check

**File:** `src/renderer/src/hooks/useSalesManager.js:118`
**Root Cause:** The return logic checks `selectedSale.payment_type === 'آجل'` to decide whether to debit the client ledger or the safe ledger. `selectedSale` is React state set when the user clicked the sale row. If the user navigates away and back, or if the sale was modified externally, the stale state may have the wrong payment type.
**Impact:** A cash sale could be incorrectly processed as a credit return (reducing a client's debt instead of issuing a cash refund), or vice versa.
**Fix:** Re-fetch the sale's payment type from the DB inside the transaction:
```sql
-- Already done in sales.dao.js returnSaleItem — use the DAO instead of inline SQL
```
The DAO version (`sales.dao.js:77`) correctly re-fetches `payment_type` from the DB. The hook should delegate to the DAO rather than duplicating the logic with stale state.

---

## M-06: `useBarcode` Suffix-Match Fallback Selects Shortest Barcode — Ambiguous for Overlapping Codes

**File:** `src/renderer/src/hooks/usePOSController.js:316-319`
**Root Cause:** When an exact barcode match fails and the input is 6-12 chars, the code queries `WHERE barcode LIKE '%${escaped}'` and selects the candidate with the shortest barcode. If two products have barcodes ending in the same suffix (e.g., `123456` and `9999123456`), the shorter one is always selected regardless of which was scanned.
**Impact:** Wrong product added to cart silently. The cashier may not notice if the names are similar. This is a silent data integrity issue.
**Fix:** Only use suffix match when exactly one candidate is found. When multiple candidates match, show a disambiguation prompt rather than silently picking the shortest:
```js
if (candidates.length === 1) {
  product = candidates[0]
} else if (candidates.length > 1) {
  // Show disambiguation UI instead of guessing
  setSearchResults(candidates)
  return
}
```

---

## M-07: `playSound` Creates a New `AudioContext` on Every Call — Context Leak

**File:** `src/renderer/src/lib/utils.js:38`
**Root Cause:** Every call to `playSound` creates a `new AudioContext()`. Browsers limit the number of concurrent `AudioContext` instances (typically 6). In a busy checkout session with rapid barcode scans, contexts accumulate and the browser starts refusing new ones silently.
**Impact:** After ~6 rapid scans, audio feedback stops working. The browser console shows `AudioContext was not allowed to start` or similar warnings.
**Fix:** Create a single shared context:
```js
let _audioCtx = null
const getAudioCtx = () => {
  if (!_audioCtx || _audioCtx.state === 'closed')
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return _audioCtx
}
```

---

## M-08: `handleSearchChange` Fires a DB Query on Every Keystroke With No Debounce

**File:** `src/renderer/src/hooks/usePOSController.js:379-399`
**Root Cause:** The product search input calls `handleSearchChange` on every `onChange` event, which immediately spawns a `sqlite3.exe` process. Typing "كوكا كولا" (8 characters) spawns 8 sequential processes.
**Impact:** On slower machines, each spawn takes 80-150ms. Rapid typing causes a queue of pending processes, and results arrive out of order (the result for "ك" may arrive after the result for "كوكا"). The last result to arrive wins, potentially showing stale results.
**Fix:** Debounce the search handler:
```js
const debounceRef = useRef(null)
const handleSearchChange = (e) => {
  const val = e.target.value
  setSearchInput(val)
  clearTimeout(debounceRef.current)
  debounceRef.current = setTimeout(() => {
    if (val.trim()) executeSearch(val)
    else setSearchResults([])
  }, 150)
}
```

---

## M-09: `fetchInventoryPage` Sort Field Interpolated Directly Into SQL Without Validation

**File:** `src/renderer/src/hooks/useProductsManager.js:38`
**Root Cause:** `ORDER BY ${activeSortField} ${activeSortAsc ? 'ASC' : 'DESC'}` interpolates `activeSortField` directly. While this value comes from internal state (not user input), it is set via `setProductsSortField` which could theoretically be called with any string.
**Impact:** If `activeSortField` is ever set to a malicious value (e.g., via a future UI bug), it becomes a SQL injection vector in the ORDER BY clause.
**Fix:** Validate against an allowlist:
```js
const ALLOWED_SORT_FIELDS = ['name', 'barcode', 'stock_qty', 'retail_price', 'cost_price', 'reorder_limit']
const safeField = ALLOWED_SORT_FIELDS.includes(activeSortField) ? activeSortField : 'name'
```

---

## M-10: `useSalesManager` Runs Schema Migrations in `useEffect` on Every Mount

**File:** `src/renderer/src/hooks/useSalesManager.js:14-33`
**Root Cause:** `useEffect(() => { runMigrations() }, [])` runs `ALTER TABLE` statements every time the `useSalesManager` hook mounts. In React StrictMode (active in development), this runs twice. In production, it runs once per admin tab open. The `ALTER TABLE` calls are idempotent (they catch the "already exists" error), but they add unnecessary DB round-trips on every mount.
**Impact:** Two extra `sqlite3.exe` spawns on every admin panel open. Minor performance cost, but also a code smell — migrations belong in `initializeDatabase`, not in a React hook.
**Fix:** Move these migrations to `src/main/db.js:initializeDatabase()` alongside the other migrations already there (lines 176-202).

---

## M-11: `handleConfirmCloseShift` Expected Cash Calculation Runs 3 Separate Queries — Not Atomic

**File:** `src/renderer/src/hooks/usePOSController.js:205-223`
**Root Cause:** The expected cash is computed from three separate `executeQuery` calls (sales total, safe inflows, safe outflows). Each spawns a separate `sqlite3.exe` process. If a transaction commits between the first and second query, the calculation uses inconsistent snapshots.
**Impact:** The expected cash shown at shift close may be off by the amount of any transaction that committed between the three queries. This is a TOCTOU (time-of-check-time-of-use) race.
**Fix:** Combine into a single query:
```sql
SELECT
  IFNULL(SUM(CASE WHEN s.payment_type='نقدي' THEN COALESCE(NULLIF(s.original_amount,0),s.total_amount) ELSE 0 END),0) as cash_sales,
  IFNULL((SELECT SUM(amount) FROM safe_ledger WHERE shift_id=? AND type='inflow'),0) as inflows,
  IFNULL((SELECT SUM(amount) FROM safe_ledger WHERE shift_id=? AND type='outflow'),0) as outflows
FROM sales WHERE shift_id=?;
```
