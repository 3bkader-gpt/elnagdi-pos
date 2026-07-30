# 🔴 Critical Issues

---

## C-01: Checkout Transaction Inserts `original_amount = cartTotal` Instead of Pre-Discount Subtotal

**File:** `src/renderer/src/hooks/usePOSController.js:475`
**Root Cause:** The INSERT into `sales` sets both `total_amount` and `original_amount` to `cartTotal` (post-discount value). The `original_amount` column is supposed to store the pre-discount subtotal so shift cash reconciliation can use it. The correct value is `subTotal` (from `useCart`), not `cartTotal`.
**Impact:** `calculateExpectedShiftCash` uses `COALESCE(NULLIF(original_amount,0), total_amount)` — since `original_amount == total_amount` always, discounts are never reflected in expected cash. A cashier giving a 50 EGP discount on a 200 EGP cash sale causes a 50 EGP phantom surplus in the expected drawer balance, making every shift reconciliation wrong when discounts are used.
**Fix:**
```js
// usePOSController.js — pass subTotal from useCart as a prop, then:
sqlQuery += `INSERT INTO sales (..., total_amount, original_amount, discount, ...)
             VALUES (..., ${cartTotal}, ${subTotal}, ${finalDiscount}, ...);`
```

---

## C-02: `SELECT MAX(id) FROM sales` Race Condition Links Items to Wrong Invoice

**File:** `src/renderer/src/hooks/usePOSController.js:478`, `src/renderer/src/lib/dao/sales.dao.js:170`
**Root Cause:** Each `INSERT INTO sale_items` uses `(SELECT MAX(id) FROM sales)` to get the parent sale ID. Because `executeSql` spawns a new `sqlite3.exe` process per call, and the entire multi-statement transaction is sent as one stdin blob, this works only if no other process inserts a sale between the `INSERT INTO sales` and the `INSERT INTO sale_items` statements within the same stdin stream. However, if two checkout operations are triggered in rapid succession (double-click, keyboard shortcut), two separate processes can interleave, causing all items from sale B to be linked to sale A's ID.
**Impact:** Complete accounting corruption — items disappear from one invoice and double-appear on another. Stock deductions are applied to the wrong sale record. Irreversible without manual DB repair.
**Fix:** Use `last_insert_rowid()` instead of `MAX(id)`:
```sql
INSERT INTO sale_items (sale_id, ...) VALUES (last_insert_rowid(), ...);
```
This is safe within a single SQLite connection/session and is immune to concurrent inserts.

---

## C-03: Entire-Sale Return Uses Stale `selectedSale.total_amount` for Refund Amount

**File:** `src/renderer/src/hooks/useSalesManager.js:167`
**Root Cause:** `handleReturnEntireSale` computes `refundAmount = selectedSale ? selectedSale.total_amount : 0` from React state, which was loaded when the user clicked the sale row. If partial returns were already processed on this sale (reducing `total_amount` in the DB), the stale state value is higher than the actual remaining balance.
**Impact:** For a credit sale: `clients.debt_balance` is reduced by the original full amount even though part was already returned, driving the balance negative (phantom credit). For a cash sale: `safe_ledger` records an outflow larger than what was actually owed, corrupting the cash drawer balance.
**Fix:**
```js
// Re-fetch the current total_amount from DB before computing refund
const freshSale = await executeQuery(`SELECT total_amount FROM sales WHERE id = ${saleId} LIMIT 1;`)
const refundAmount = freshSale[0]?.total_amount || 0
```

---

## C-04: `sales.dao.js::returnEntireSale` Restores Full `item.quantity` Instead of Remaining Quantity

**File:** `src/renderer/src/lib/dao/sales.dao.js:126`
**Root Cause:** The DAO-layer `returnEntireSale` iterates items and does `stock_qty + item.quantity` for every item, ignoring `item.returned_qty`. If a partial return was already processed (restoring some stock), this adds the full original quantity again.
**Impact:** Stock is over-restored. A product that had 5 units sold, 2 already returned (stock +2 already applied), gets another +5 on full return instead of +3. Inventory count becomes permanently inflated.
**Fix:**
```js
items.forEach(item => {
  const remaining = item.quantity - (item.returned_qty || 0)
  if (remaining > 0)
    sql += `UPDATE products SET stock_qty = stock_qty + ${remaining} WHERE barcode = '${escapeSql(item.product_barcode)}';\n`
})
```
Note: `useSalesManager.js:156` already does this correctly — the DAO version does not. The DAO version is unused by the UI but is a latent correctness bug if ever called.

---

## C-05: Database Restore Overwrites Live DB File Without Closing Active Connections

**File:** `src/main/index.js:110`
**Root Cause:** `fs.copyFileSync(sourcePath, dbPath)` replaces the live `.db` file while `sqlite3.exe` child processes may be mid-query (WAL mode keeps the file open). On Windows, this can silently corrupt the WAL file or leave the database in an inconsistent state because the WAL journal references the old file's page checksums.
**Impact:** After restore, the database may be unreadable or contain mixed data from the old and new files. Data loss is possible.
**Fix:** Before copying, send a `PRAGMA wal_checkpoint(TRUNCATE);` and ensure no in-flight queries exist. At minimum, warn the user that the app must restart after restore, and perform the copy only after a brief quiesce:
```js
await executeSql('PRAGMA wal_checkpoint(TRUNCATE);')
fs.copyFileSync(sourcePath, dbPath)
return { success: true, requiresRestart: true }
```

---

## C-06: `prevent_negative_stock` Trigger Uses `RAISE(ROLLBACK, ...)` — Rolls Back Entire Multi-Statement Transaction

**File:** `src/main/db.js:207-213`
**Root Cause:** `RAISE(ROLLBACK, ...)` in SQLite aborts the entire transaction, not just the current statement. This is correct behavior for preventing negative stock, but the error message propagates raw Arabic SQL error text all the way to the renderer's `catch` block, which then calls `triggerCustomAlert('فشلت المعاملة...')` — a generic message that gives the cashier no actionable information about which product caused the failure.
**Impact:** When a multi-item cart has one out-of-stock item, the entire sale is silently rolled back. The cashier sees only a generic failure. No item is identified. The cart is not cleared, so the cashier may retry and hit the same failure repeatedly.
**Fix:** Parse the trigger error message in the catch block and surface the product name:
```js
} catch (e) {
  const msg = e.message || ''
  if (msg.includes('نفاد الكمية')) {
    triggerCustomAlert('فشل البيع: نفاد مخزون أحد الأصناف. يرجى مراجعة الكميات.')
  } else {
    triggerCustomAlert('فشلت المعاملة، يرجى المحاولة مرة أخرى.')
  }
}
```

---

## C-07: `sales.dao.js::createSaleTransaction` Uses `points / 10` While `usePOSController.js` Uses `points / 100` — Divergent Business Logic

**File:** `src/renderer/src/lib/dao/sales.dao.js:175` vs `src/renderer/src/hooks/usePOSController.js:466`
**Root Cause:** The DAO computes `pointsEarned = Math.floor(cartTotal / 10)` (1 point per 10 EGP). The hook computes `Math.floor(cartTotal / 100)` (1 point per 100 EGP). The UI uses the hook path; the DAO is unused by the UI but represents a 10× discrepancy if ever called.
**Impact:** If the DAO path is ever activated (e.g., during a refactor), clients receive 10× more points than intended, corrupting the loyalty program balance.
**Fix:** Align both to the same constant. Define it once:
```js
// lib/constants.js
export const POINTS_PER_CURRENCY_UNIT = 100
```

---

## C-08: Backup Copies Live `.db` File Without WAL Checkpoint — Backup May Be Incomplete

**File:** `src/main/index.js:91`
**Root Cause:** `fs.copyFileSync(dbPath, filePath)` copies only the main `.db` file. In WAL mode, recent committed transactions may reside in the `-wal` file and not yet be checkpointed into the main file. The backup therefore misses those transactions.
**Impact:** A backup taken mid-session may be missing the last N transactions. Restoring from this backup silently loses data.
**Fix:**
```js
await executeSql('PRAGMA wal_checkpoint(FULL);')
fs.copyFileSync(dbPath, filePath)
// Optionally also copy the -wal and -shm files if they exist
```
