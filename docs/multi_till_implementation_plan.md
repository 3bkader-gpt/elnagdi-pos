# خطة تطوير: نظام الأدراج الثلاثة (Multi-Till Management)

## الهدف
إضافة شاشة للمديرين (Admin Only) تتيح إدارة ثلاثة أدراج مستقلة تمامًا داخل كل وردية، مع طباعة تقارير مفصّلة في نهاية اليوم.

---

## Open Questions

> [!IMPORTANT]
> **سؤال:** هل عمليات درج ممكن والمحافظ مرتبطة بالوردية المفتوحة؟  
> أم تُسجَّل بالتاريخ فقط (حتى لو مفيش وردية مفتوحة)؟  
> *الافتراضي في الخطة: مرتبطة بالوردية المفتوحة — لو مفيش وردية، بيظهر تحذير.*

> [!NOTE]
> **ملاحظة:** عمليات ممكن — هل فيه "استرداد" (refund) من المكنة يعود للدرج؟ أم العمليات كلها في اتجاه واحد (من المكنة → للدرج)؟

---

## الجداول الجديدة في قاعدة البيانات

### جدول `momkn_transactions` (درج مكنة ممكن)
```sql
CREATE TABLE IF NOT EXISTS momkn_transactions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_id        INTEGER,
  timestamp       TEXT NOT NULL,
  description     TEXT,                  -- وصف العملية
  operation_type  TEXT DEFAULT 'payment',-- payment | refund
  machine_amount  REAL NOT NULL,         -- المخصوم من المكنة
  commission      REAL DEFAULT 0,        -- عمولة ممكن (لو أُخذت كاش)
  cash_in         REAL DEFAULT 0,        -- اللي دخل درج ممكن
  notes           TEXT,
  FOREIGN KEY (shift_id) REFERENCES shifts(id)
);
```

### جدول `mobile_money_transactions` (درج فودافون كاش / انستاباي)
```sql
CREATE TABLE IF NOT EXISTS mobile_money_transactions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_id         INTEGER,
  timestamp        TEXT NOT NULL,
  platform         TEXT NOT NULL,  -- vodafone_cash | instapay | bank_transfer
  operation_type   TEXT NOT NULL,  -- deposit | withdrawal | transfer
  transfer_amount  REAL NOT NULL,  -- مبلغ التحويل / السحب
  commission       REAL DEFAULT 0, -- العمولة
  cash_in          REAL DEFAULT 0, -- اللي وصل الدرج كاش
  recipient_name   TEXT,           -- اسم المستلم/المودع
  phone_or_account TEXT,           -- رقم التليفون أو الحساب
  notes            TEXT,
  FOREIGN KEY (shift_id) REFERENCES shifts(id)
);
```

---

## التغييرات المطلوبة

---

### قاعدة البيانات

#### [MODIFY] main.js (إضافة migration)
- إنشاء الجدولين عند أول تشغيل

---

### DAOs

#### [NEW] momkn.dao.js
- `addMomknTransaction({ shiftId, description, operationType, machineAmount, commission, cashIn, notes })`
- `getMomknTransactionsByShift(shiftId)`
- `getMomknShiftSummary(shiftId)`

#### [NEW] mobile_money.dao.js
- `addMobileMoneyTransaction({ shiftId, platform, operationType, transferAmount, commission, cashIn, recipientName, phoneOrAccount, notes })`
- `getMobileMoneyByShift(shiftId)`
- `getMobileMoneyShiftSummary(shiftId)`

---

### Hooks

#### [NEW] useMomknTill.js
- State: `transactions`, `loading`, `modalOpen`
- فتح/إغلاق مودال العملية
- إضافة عملية جديدة
- حساب الملخص (إجمالي المكنة، إجمالي الكاش، إجمالي العمولات)

#### [NEW] useMobileMoneyTill.js
- State: `transactions`, `loading`, `modalOpen`
- فتح/إغلاق مودال العملية
- تصفية حسب المنصة
- حساب الملخص

---

### Components

#### [NEW] TillsManagerTab.jsx
الشاشة الرئيسية بـ 3 sub-tabs:
- **درج السوبر ماركت** — ملخص الوردية الحالية (readonly، مأخوذ من بيانات الوردية الموجودة)
- **درج ممكن** — إدارة عمليات ماكينة ممكن
- **درج المحافظ والتحويلات** — فودافون كاش / انستاباي

#### [NEW] MomknTill.jsx
```
┌─────────────────────────────────────────┐
│ 📊 ملخص درج ممكن — وردية #XX           │
│ إجمالي المكنة: 3,200 ج.م               │
│ إجمالي الكاش الداخل: 3,050 ج.م        │
│ عمولات: 150 ج.م                        │
├─────────────────────────────────────────┤
│ [+ عملية جديدة]  [🖨️ طباعة التقرير]  │
├─────────────────────────────────────────┤
│ جدول العمليات:                          │
│ الوقت | الوصف | المكنة | الكاش | نوع  │
│ ───────────────────────────────────── │
│ 10:30 | دفع فاتورة كهرباء | 500 | 470 │
│ 11:15 | شحن رصيد | 100  | 97  | payment│
└─────────────────────────────────────────┘
```

#### [NEW] MomknOperationModal.jsx
```
مودال: عملية ممكن جديدة
─────────────────────────────
نوع العملية: [دفع ▾] [استرداد ▾]
وصف العملية: [_______________]
المبلغ المخصوم من المكنة: [   ]
العمولة المحصّلة كاش:    [   ]  ← اختياري
المبلغ الداخل للدرج:      [   ]  ← (يُحسب تلقائياً = المكنة - العمولة)
ملاحظات:                  [   ]
─────────────────────────────
[إلغاء]  [تأكيد العملية]
```

#### [NEW] MobileMoneyTill.jsx
```
┌─────────────────────────────────────────┐
│ 💰 درج فودافون كاش / انستاباي          │
│ [فودافون كاش] [انستاباي] [تحويلات] ← فلتر│
├─────────────────────────────────────────┤
│ إجمالي التحويلات: 5,000 ج.م           │
│ إجمالي الكاش الداخل: 4,750 ج.م       │
│ إجمالي العمولات: 250 ج.م              │
├─────────────────────────────────────────┤
│ [+ عملية جديدة]  [🖨️ طباعة التقرير]  │
├─────────────────────────────────────────┤
│ جدول العمليات مع تفاصيل كاملة          │
└─────────────────────────────────────────┘
```

#### [NEW] MobileMoneyOperationModal.jsx
```
مودال: عملية محافظ/تحويل جديدة
─────────────────────────────────
المنصة:          [● فودافون كاش] [○ انستاباي] [○ تحويل بنكي]
نوع العملية:    [● سحب] [○ إيداع] [○ تحويل لشخص تاني]
مبلغ العملية:   [_______] ج.م
العمولة:         [_______] ج.م  ← (0 افتراضي)
الداخل للدرج:   [_______] ج.م  ← (يُحسب = المبلغ - العمولة)
اسم المستلم/المودع: [________]  ← اختياري
رقم التليفون أو الحساب: [_____]  ← اختياري
ملاحظات:        [_______________]
─────────────────────────────────
[إلغاء]  [تأكيد العملية]
```

---

### قوالب الطباعة

#### [MODIFY] printTemplates.js
إضافة دالتين جديدتين:
- `generateMomknReportHtml({ shift, transactions, summary })` — تقرير ممكن
- `generateMobileMoneyReportHtml({ shift, transactions, summary })` — تقرير المحافظ

**هيكل تقرير ممكن:**
```
╔════════════════════════════════╗
║     النجدي - تقرير درج ممكن   ║
║  الوردية #XX | الكاشير: فلان   ║
║  2026-07-28 | 08:00 → 20:00   ║
╠════════════════════════════════╣
║  الوقت  | الوصف | المكنة | الكاش║
║─────────────────────────────── ║
║  10:30  | دفع فاتورة | 500 |470║
║  ...                          ║
╠════════════════════════════════╣
║  الملخص:                       ║
║  عدد العمليات:    12           ║
║  إجمالي المكنة:   3,200 ج.م   ║
║  إجمالي الكاش:    3,050 ج.م   ║
║  إجمالي العمولة:   150 ج.م    ║
╚════════════════════════════════╝
```

---

### التكامل مع AdminDashboard

#### [MODIFY] AdminDashboard.jsx
- إضافة Tab جديد: **💳 الأدراج والتحويلات**
- يظهر للأدمن فقط (`currentUser.role === 'admin'`)

---

## تدفق العمل (User Flow)

```
أدمن يفتح تاب "الأدراج والتحويلات"
        │
        ├── درج السوبر ماركت → ملخص الوردية (موجود من قبل)
        │
        ├── درج ممكن
        │     ├── يضغط "+ عملية جديدة"
        │     ├── يكمّل المودال (نوع، مبلغ المكنة، الكاش الداخل)
        │     ├── يضغط "تأكيد" → يتسجّل في DB
        │     └── يضغط "طباعة" آخر الشيفت → PDF/ورقة حرارية
        │
        └── درج فودافون/انستاباي
              ├── يضغط "+ عملية جديدة"
              ├── يختار المنصة ونوع العملية
              ├── يكمّل التفاصيل
              ├── يضغط "تأكيد" → يتسجّل في DB
              └── يضغط "طباعة" آخر الشيفت
```

---

## خطة التنفيذ

| الخطوة | الملف | الوقت المتوقع |
|---|---|---|
| 1 | Migration في main.js (جدولين جدد) | سريع |
| 2 | momkn.dao.js + mobile_money.dao.js | سريع |
| 3 | useMomknTill.js + useMobileMoneyTill.js | متوسط |
| 4 | MomknTill.jsx + MomknOperationModal.jsx | متوسط |
| 5 | MobileMoneyTill.jsx + MobileMoneyOperationModal.jsx | متوسط |
| 6 | قوالب الطباعة | متوسط |
| 7 | TillsManagerTab.jsx + ربط AdminDashboard | سريع |

---

## ملاحظات الأمان

- ✅ كل درج **مستقل تمامًا** — لا يوجد تحويل تلقائي بين الأدراج
- ✅ Admin Only — الكاشير العادي لا يرى هذه الشاشة
- ✅ كل عملية مرتبطة بالوردية المفتوحة
- ✅ الطباعة في آخر الشيفت تكون موثّقة بالتوقيت والكاشير
