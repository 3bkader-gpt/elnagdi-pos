# 🟢 Low Issues

---

## L-01: `console.log` Debug Statements Left in Production Code Paths

**File:** `src/main/printer.js:60-63`, `src/renderer/src/hooks/usePOSController.js:97-113`
**Root Cause:** Multiple `console.log('[PRINTER DEBUG]...')` and `console.log('[AUTH FLOW]...')` statements are present in production code paths. In production, `console.log` is silenced in the main process but still executes in the renderer process (only main process logs are suppressed in `src/main/index.js:10-15`).
**Impact:** Minor performance cost from string interpolation on every barcode scan and every print job. Sensitive data (PIN values, user objects) are logged to the renderer console which is accessible via DevTools in development.
**Fix:** Remove debug log statements or gate them behind `isDev`:
```js
if (isDev) console.log('[AUTH FLOW] User authenticated:', user.username)
```

---

## L-02: `useShift.js` Default `startingCash` Hardcoded to `'100'`

**File:** `src/renderer/src/hooks/useShift.js:14`
**Root Cause:** `const [startingCash, setStartingCash] = useState('100')` hardcodes 100 as the default opening cash. The `handlePinSubmit` flow overwrites this with the last shift's `actual_end_cash`, but only after a DB query. If the query fails or returns nothing, the cashier sees 100 pre-filled.
**Impact:** A cashier who doesn't notice the pre-filled value may open a shift with the wrong starting cash, causing a reconciliation discrepancy.
**Fix:** Default to `'0'` and let the handoff query populate the value:
```js
const [startingCash, setStartingCash] = useState('0')
```

---

## L-03: `lrPad` in `printer.js` Uses Character Count for Alignment — Breaks on Arabic Multi-Width Characters

**File:** `src/main/printer.js:22-25`
**Root Cause:** `lrPad(l, r)` computes padding as `W - left.length - right.length` using JavaScript string `.length`, which counts UTF-16 code units, not display width. Arabic characters are typically rendered at the same width as Latin characters in monospace fonts, but some Unicode characters (e.g., combined diacritics, zero-width joiners) have `.length > 1` but display width 0 or 1.
**Impact:** Receipt column alignment is slightly off when product names contain Arabic diacritics or special Unicode characters. Visual misalignment on the printed receipt.
**Fix:** Strip zero-width characters before measuring:
```js
const displayLen = (s) => s.replace(/[​-‏‪-‮﻿]/g, '').length
const lrPad = (l, r) => {
  const left = String(l || ''), right = String(r || '')
  return left + ' '.repeat(Math.max(1, W - displayLen(left) - displayLen(right))) + right
}
```

---

## L-04: `handleQtyChangeAttempt` Silently Ignores Empty String Input — No Visual Feedback

**File:** `src/renderer/src/hooks/useCart.js:91-93`
**Root Cause:** When the quantity input is cleared to an empty string, the function returns early without updating the cart or showing feedback. The input field shows empty but the cart item retains its previous quantity.
**Impact:** Confusing UX — the cashier clears the field expecting to type a new value, but if they tab away without typing, the displayed quantity snaps back to the old value with no explanation.
**Fix:** This is acceptable behavior but should be documented. Alternatively, show a placeholder or restore the previous value visually on blur:
```jsx
onBlur={() => { if (!qtyInput) setQtyInput(item.qty.toString()) }}
```

---

## L-05: `fetchSalesHistory` Hard-Limits Results to 100 Rows With No Pagination

**File:** `src/renderer/src/hooks/useSalesManager.js:68`, `src/renderer/src/lib/dao/sales.dao.js:28`
**Root Cause:** Both the hook and the DAO cap sales history at `LIMIT 100` with no pagination controls. A busy store processing 200+ transactions per day will silently truncate the sales list.
**Impact:** Cashiers and managers cannot see sales older than the most recent 100 when searching. Returns and reprints for older sales become inaccessible through the UI.
**Fix:** Add pagination to the sales history tab, similar to the inventory tab which already implements `LIMIT ${itemsPerPage} OFFSET ${offset}`.

---

## L-06: `center()` in `printer.js` Uses Floor Division — Off-by-One for Even-Length Strings

**File:** `src/main/printer.js:17-20`
**Root Cause:** `Math.floor((W - str.length) / 2)` left-pads only. For a string of length 10 on a 48-char line, this adds 19 spaces on the left but 19 on the right is never added — the string is left-of-center by 1 character.
**Impact:** Centered text on receipts (store name, branch name, "شكراً") is visually slightly left of center. Minor cosmetic issue on printed receipts.
**Fix:**
```js
const center = (s) => {
  const str = String(s).trim()
  const totalPad = Math.max(0, W - str.length)
  const left = Math.floor(totalPad / 2)
  return ' '.repeat(left) + str
}
```
This is the same formula — the issue is that GDI renders the text with its own alignment when `[C]` is detected in the PowerShell script, so this Node-side centering is redundant. The PowerShell script handles `[C]` with `StringFormat.Alignment = Center`. The Node-side `center()` function is only used for the `dateTimeLine` which does not use `[C]`. Low impact.

---

## L-07: `parseLocaleDateString` Returns `new Date(0)` (Unix Epoch) for Unparseable Dates — Silently Treated as Valid

**File:** `src/renderer/src/lib/utils.js:97`
**Root Cause:** When a timestamp cannot be parsed, the function returns `new Date(0)` (January 1, 1970). Callers in `filterByPeriod` and `fetchAnalytics` treat this as a valid date, so records with bad timestamps appear to be from 1970 and are excluded from all period filters without any warning.
**Impact:** If any record has a malformed timestamp (e.g., from a migration or manual DB edit), it silently disappears from all filtered views. No error is surfaced.
**Fix:** Return `null` for unparseable dates and handle `null` explicitly in callers:
```js
if (!dateMatch) return null
// In callers:
const itemDate = parseLocaleDateString(item.timestamp)
if (!itemDate) return false // exclude records with bad timestamps
```

---

## L-08: `triggerClearCart` Does Not Reset `paymentType` to Default

**File:** `src/renderer/src/hooks/useCart.js:104-108`
**Root Cause:** `triggerClearCart` resets `cart`, `discount`, and `paidAmount` but does not reset `paymentType` back to `'نقدي'`. If a cashier sets payment to `'آجل'` (credit) and then clears the cart, the next transaction starts with credit payment pre-selected.
**Impact:** The next cash sale may be accidentally recorded as a credit sale if the cashier doesn't notice the payment type. This creates a phantom debt entry for the client.
**Fix:**
```js
const triggerClearCart = () => {
  if (cart.length === 0) return
  setCart([])
  setDiscount(0)
  setPaidAmount('')
  setPaymentType('نقدي')
}
```

---

## L-09: `useBestSellersManager` Not Included in `fetchAdminData` — Best Sellers Tab Never Auto-Refreshes

**File:** `src/renderer/src/hooks/useAdminController.js:256-268`
**Root Cause:** `fetchAdminData` calls all sub-manager fetch functions except `bestSellersManager.fetchBestSellers`. The best sellers tab data is only loaded when the user explicitly triggers it.
**Impact:** After a sale or return, the best sellers tab shows stale data until the user manually refreshes it.
**Fix:** Add to `fetchAdminData`:
```js
await bestSellersManager.fetchBestSellers(bestSellersManager.bsPeriod)
```

---

## L-10: `AddCheckModal` Stores `due_date` as ISO String but `fetchChecksDueToday` Also Tries Locale Format Match

**File:** `src/renderer/src/hooks/useChecksManager.js:22-28`
**Root Cause:** The HTML `<input type="date">` in `AddCheckModal` produces ISO format (`YYYY-MM-DD`). The `fetchChecksDueToday` query correctly uses `todayISO` for the primary match, but also adds `OR due_date LIKE '%${new Date().getDate()}%'` as a fallback. This fallback is now redundant since all new checks use ISO format, and it produces false positives (see H-09).
**Impact:** Redundant SQL clause. Minor query complexity with no benefit for new data.
**Fix:** Remove the `LIKE` fallback clause entirely:
```sql
WHERE status = 'غير مسدد' AND due_date = '${todayISO}'
```
