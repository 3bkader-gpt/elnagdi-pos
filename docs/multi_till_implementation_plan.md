# خطة تطوير: نظام الأدراج الثلاثة (Multi-Till Management)

## الهدف
إضافة نظام لإدارة ثلاثة أدراج مستقلة تمامًا داخل كل وردية للفصل التام بين "الكاش الورقي" و"الرصيد الديجيتال"، مع تمكين الكاشير من إضافة العمليات أولاً بأول، وتفويض الأدمن حصرياً بالتعديل والحذف والطباعة لتقارير نهاية اليوم.

---

## Open Questions (موجّهة ومحسومة محاسبياً)

> [!IMPORTANT]
> **1. ربط العمليات بالوردية (Shift):**  
> جميع العمليات مرتبطة وجوباً بالوردية المفتوحة (`shift_id`). في حال عدم وجود وردية مفتوحة، يمنع النظام تماماً تسجيل أي عملية ويظهر رسالة تحذيرية تمنع الإجراء حتى فتح وردية جديدة.

> [!NOTE]
> **2. عمليات الاسترداد وشحن ماكينات الدفع (Refunds & Recharges):**  
> العمليات تدعم الحركة الثنائية للرصيد والكاش (زيادة/نقصان):
> *   **بيع/شحن للعميل (Payment):** يقل الرصيد الديجيتال للماكينة/المحفظة، ويزيد الكاش في الدرج.
> *   **استرجاع عملية (Refund):** يزيد الرصيد الديجيتال، ويقل الكاش من الدرج.
> *   **شحن المكنة كاش (Recharge):** يقل كاش الدرج (مدفوع للمندوب)، ويزيد الرصيد الديجيتال على المكنة.

---

## الجداول الجديدة وتعديلات قاعدة البيانات

### 1. تعديل جدول الـ `shifts` الأساسي
لإضافة أرصدة البداية الافتتاحية عند استلام الوردية:
```sql
ALTER TABLE shifts ADD COLUMN momkn_start_balance REAL DEFAULT 0.0;
ALTER TABLE shifts ADD COLUMN vfcash_start_balance REAL DEFAULT 0.0;
```

### 2. جدول `momkn_transactions` (عمليات مكنة ممكن)
تتبع تأثير الأرصدة الديجيتال والكاش بشكل مباشر:
```sql
CREATE TABLE IF NOT EXISTS momkn_transactions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_id        INTEGER NOT NULL,
  timestamp       TEXT NOT NULL,
  operation_type  TEXT NOT NULL, -- 'payment' (بيع) | 'refund' (استرجاع) | 'recharge' (شحن المكنة)
  description     TEXT,
  digital_impact  REAL NOT NULL, -- تأثير العملية على رصيد المكنة (- لو بيع، + لو شحن/استرداد)
  cash_impact     REAL NOT NULL, -- تأثير العملية على الدرج (+ لو بيع، - لو شحن/استرداد)
  commission      REAL DEFAULT 0.0, -- عمولة المحل
  notes           TEXT,
  FOREIGN KEY (shift_id) REFERENCES shifts(id)
);
```

### 3. جدول `mobile_money_transactions` (المحافظ الإلكترونية وفودافون كاش/انستاباي)
```sql
CREATE TABLE IF NOT EXISTS mobile_money_transactions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_id         INTEGER NOT NULL,
  timestamp        TEXT NOT NULL,
  platform         TEXT NOT NULL, -- 'vodafone_cash' | 'instapay' | 'bank_transfer'
  operation_type   TEXT NOT NULL, -- 'deposit_to_client' (إيداع للزبون) | 'withdraw_from_client' (سحب من الزبون)
  digital_impact   REAL NOT NULL, -- تأثير العملية على المحفظة (- لو إيداع للزبون، + لو سحب من الزبون)
  cash_impact      REAL NOT NULL, -- تأثير العملية على الدرج (+ لو إيداع للزبون، - لو سحب من الزبون)
  commission       REAL DEFAULT 0.0, -- عمولة المحل
  recipient_name   TEXT,
  phone_or_account TEXT,
  notes            TEXT,
  FOREIGN KEY (shift_id) REFERENCES shifts(id)
);
```

---

## التغييرات المطلوبة في الكود

### 1. قاعدة البيانات و Migrations

#### [MODIFY] main.js / db.js
*   تنفيذ جمل إنشاء الجداول الجديدة `momkn_transactions` و `mobile_money_transactions`.
*   تنفيذ جمل `ALTER TABLE` لإضافة الأعمدة الجديدة لجدول `shifts` مع معالجة الاستثناءات في حال كانت موجودة مسبقاً.

---

### 2. طبقة الـ DAOs

#### [NEW] momkn.dao.js
*   `addMomknTransaction({ shiftId, operationType, description, digitalImpact, cashImpact, commission, notes })`
*   `getMomknTransactionsByShift(shiftId)`
*   `getMomknShiftSummary(shiftId)` - يحسب صافي الكاش والعمولات وإجمالي الحركة الرقمية.

#### [NEW] mobile_money.dao.js
*   `addMobileMoneyTransaction({ shiftId, platform, operationType, digitalImpact, cashImpact, commission, recipientName, phoneOrAccount, notes })`
*   `getMobileMoneyByShift(shiftId)`
*   `getMobileMoneyShiftSummary(shiftId)`

---

### 3. طبقة الـ Hooks

#### [NEW] useMomknTill.js
*   State: `transactions`, `loading`, `modalOpen`, `startBalance`
*   متابعة الرصيد اللحظي المتوقع: `الرصيد الفعلي المفروض = رصيد البداية + إجمالي digital_impact`.
*   إضافة العمليات وتحديث الإجماليات.

#### [NEW] useMobileMoneyTill.js
*   State: `transactions`, `loading`, `modalOpen`, `startBalance`
*   متابعة الرصيد اللحظي: `الرصيد المتوقع = رصيد البداية + إجمالي digital_impact`.

---

### 4. صلاحيات واجهة المستخدم (Permissions Flow)
*   **الكاشير العادي:**
    *   يستطيع رؤية التاب وإضافة حركات جديدة فقط (لتشجيع التسجيل الفوري وتفادي نسيان العمليات).
    *   زر الحذف والتعديل يكون معطلاً أو مخفياً بالنسبة له.
*   **المدير (Admin):**
    *   يملك الصلاحيات الكاملة: إضافة، تعديل، حذف العمليات المسجلة بالخطأ.
    *   طباعة تقارير الجرد النهائية وتصفير الأدراج.
*   **⚠️ استثناء تجريبي مؤقت (سيف فايز):**
    *   يتم إخفاء التاب الجديد (الأدراج والتحويلات) تماماً عن المستخدم **سيف فايز** (`currentUser.username === 'سيف فايز'`) خلال الفترة التجريبية الحالية، لحين انتهاء الأدمن الرئيسي من تجربة واختبار النظام بشكل كافٍ.


---

### 5. واجهات المستخدم الجديدة (UI Mockups)

#### [NEW] MomknTill.jsx
```text
┌─────────────────────────────────────────┐
│ 📊 ملخص درج ممكن — وردية #XX           │
├─────────────────────────────────────────┤
│ رصيد الماكينة الافتتاحي: 1,500 ج.م       │
│ رصيد الماكينة المتوقع حالياً: 1,900 ج.م  │
│ ─────────────────────────────────────── │
│ إجمالي الكاش في الدرج: +400 ج.م         │
│ صافي عمولات الشفت: 50 ج.م               │
├─────────────────────────────────────────┤
│ [+ عملية جديدة]  [🖨️ طباعة التقرير (أدمن)]│
└─────────────────────────────────────────┘
```

#### [NEW] MobileMoneyTill.jsx
```text
┌─────────────────────────────────────────┐
│ 💰 درج فودافون كاش / انستاباي           │
├─────────────────────────────────────────┤
│ رصيد المحفظة الافتتاحي: 2,690 ج.م       │
│ رصيد المحفظة المتوقع حالياً: 3,690 ج.م  │
│ ─────────────────────────────────────── │
│ إجمالي الكاش اللي دخل: +500 ج.م         │
│ إجمالي الكاش اللي خرج: -200 ج.م         │
│ صافي عمولات الشفت: 35 ج.م               │
├─────────────────────────────────────────┤
│ [+ عملية جديدة]  [🖨️ طباعة التقرير (أدمن)]│
└─────────────────────────────────────────┘
```

---

### 6. قوالب الطباعة

#### [MODIFY] printTemplates.js
*   دالة `generateMomknReportHtml` لتقرير ماكينة ممكن.
*   دالة `generateMobileMoneyReportHtml` لتقرير المحافظ الإلكترونية.

---

## خطة التنفيذ المقترحة

| الخطوة | الملف | الوصف |
|---|---|---|
| 1 | Migrations في db.js | إضافة الجداول والأعمدة الجديدة لجدول الورديات |
| 2 | DAOs | بناء `momkn.dao.js` و `mobile_money.dao.js` بالتأثيرات الثنائية |
| 3 | Controller Hooks | بناء الهوكس الخاصة بالحسابات والأرصدة اللحظية |
| 4 | Modals & Till Tabs | بناء شاشات الإدخال ومودالات العمليات وتفعيل الصلاحيات |
| 5 | Print Templates | إضافة قوالب تقارير الجرد الحرارية |
| 6 | Integration | دمج التاب الجديد في لوحة التحكم وتحديث شاشة فتح الوردية لإدخال أرصدة البداية |

---

## ملاحظات الأمان والتدقيق
*   ✅ ربط إجباري بالـ `shift_id` لضمان عدم تداخل التواريخ.
*   ✅ عزل تام محاسبياً بين الأرصدة الرقمية والنقدية السائلة.
*   ✅ صلاحيات مقيدة للكاشير لمنع التلاعب في السجلات القديمة مع الحفاظ على سرعة الإدخال.
*   ✅ التقارير تدعم مراجعة عجز وزيادة الأرصدة الرقمية كما تدعم مراجعة عجز وزيادة الكاش.
