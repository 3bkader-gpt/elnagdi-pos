import { formatMoney } from './utils'

export function generateInvoiceHtml({
  sale,
  items,
  storeName = 'سوبر ماركت النجدي',
  branchName = 'الفرع الرئيسي',
  footerText = 'شكراً لزيارتكم! نتمنى لكم يوماً سعيداً'
}) {
  const dateStr = sale ? sale.timestamp.split(' ')[0] : ''
  const timeStr = sale ? sale.timestamp.split(' ')[1] : ''
  const cashier = sale ? sale.username || 'كاشير' : 'كاشير'

  return `
    <div style="font-family: 'Courier New', monospace; width: 80mm; padding: 5px; direction: rtl; font-size: 12px;">
      <div style="text-align: center; margin-bottom: 10px;">
        <h2 style="margin: 0; font-size: 16px;">${storeName}</h2>
        <p style="margin: 2px 0; font-size: 11px;">${branchName}</p>
        <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
        <p style="margin: 2px 0;">فاتورة مبيعات #${sale.id}</p>
        <p style="margin: 2px 0; font-size: 10px;">التاريخ: ${dateStr} - ${timeStr}</p>
        <p style="margin: 2px 0; font-size: 10px;">الكاشير: ${cashier}</p>
        ${sale.client_name ? `<p style="margin: 2px 0; font-size: 10px;">العميل: ${sale.client_name}</p>` : ''}
      </div>

      <div style="border-bottom: 1px solid #000; margin: 5px 0;"></div>

      <table style="width: 100%; text-align: right; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="border-bottom: 1px solid #000;">
            <th style="text-align: right;">الصنف</th>
            <th style="text-align: center;">الكمية</th>
            <th style="text-align: left;">السعر</th>
            <th style="text-align: left;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td style="text-align: right; padding: 3px 0;">${item.product_name || item.name}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: left;">${item.unit_price?.toFixed(2)}</td>
              <td style="text-align: left;">${(item.quantity * item.unit_price)?.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="border-bottom: 1px solid #000; margin: 5px 0;"></div>

      <div style="display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0;">
        <span>المجموع الأصلي:</span>
        <span>${(sale.original_amount || sale.total_amount)?.toFixed(2)} ج.م</span>
      </div>

      ${sale.discount > 0 ? `
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; color: #000;">
          <span>الخصم:</span>
          <span>-${sale.discount?.toFixed(2)} ج.م</span>
        </div>
      ` : ''}

      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin: 5px 0;">
        <span>الصافي المطلوب:</span>
        <span>${sale.total_amount?.toFixed(2)} ج.م</span>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0;">
        <span>طريقة الدفع:</span>
        <span>${sale.payment_type || 'نقدي'}</span>
      </div>

      <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>

      <div style="text-align: center; font-size: 10px; margin-top: 5px;">
        <p style="margin: 2px 0;">${footerText}</p>
        <p style="margin: 2px 0;">نظام إداري متكامل - الشروق POS</p>
      </div>
    </div>
  `
}

export const generateReceiptHtml = generateInvoiceHtml
export const generateReprintHtml = generateInvoiceHtml

export function generateMomknReportHtml({ shift, transactions = [], summary = {} }) {
  return `
    <div style="font-family: 'Courier New', monospace; width: 80mm; padding: 5px; direction: rtl; font-size: 11px;">
      <div style="text-align: center; margin-bottom: 8px;">
        <h3 style="margin:0;">تقرير ماكينة ممكن</h3>
        <p style="margin:2px 0;">الوردية #${shift?.id || '—'}</p>
      </div>
      <div style="border-bottom: 1px solid #000; margin: 4px 0;"></div>
      <div style="display:flex; justify-content:space-between;">
        <span>رصيد الماكينة الافتتاحي:</span>
        <span>${(summary.startBalance || 0).toFixed(2)} ج.م</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-weight:bold;">
        <span>رصيد الماكينة المتوقع:</span>
        <span>${(summary.expectedDigitalBalance || 0).toFixed(2)} ج.م</span>
      </div>
      <div style="display:flex; justify-content:space-between;">
        <span>تأثير الكاش بالدرج:</span>
        <span>${(summary.totalCashImpact || 0) >= 0 ? '+' : ''}${(summary.totalCashImpact || 0).toFixed(2)} ج.م</span>
      </div>
    </div>
  `
}

export function generateMobileMoneyReportHtml({ shift, transactions = [], summary = {} }) {
  return `
    <div style="font-family: 'Courier New', monospace; width: 80mm; padding: 5px; direction: rtl; font-size: 11px;">
      <div style="text-align: center; margin-bottom: 8px;">
        <h3 style="margin:0;">تقرير المحافظ والتحويلات</h3>
        <p style="margin:2px 0;">الوردية #${shift?.id || '—'}</p>
      </div>
      <div style="border-bottom: 1px solid #000; margin: 4px 0;"></div>
      <div style="display:flex; justify-content:space-between;">
        <span>رصيد فودافون الافتتاحي:</span>
        <span>${(summary.vfcashStartBalance || 0).toFixed(2)} ج.م</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-weight:bold;">
        <span>رصيد فودافون المتوقع:</span>
        <span>${(summary.expectedVfcashDigitalBalance || 0).toFixed(2)} ج.م</span>
      </div>
      <div style="display:flex; justify-content:space-between;">
        <span>تأثير الكاش بالدرج:</span>
        <span>${(summary.totalCashImpact || 0) >= 0 ? '+' : ''}${(summary.totalCashImpact || 0).toFixed(2)} ج.م</span>
      </div>
    </div>
  `
}

export function generateShiftReportHtml({
  shift,
  salesTotal,
  repayTotal,
  refundTotal,
  expectedCash,
  actualCash,
  difference,
  storeName = 'سوبر ماركت النجدي',
  branchName = 'الفرع الرئيسي'
}) {
  const dateStr = shift ? shift.start_time.split(' ')[0] : ''
  const cashier = shift ? shift.username : 'كاشير'

  return `
    <div style="font-family: 'Courier New', monospace; width: 80mm; padding: 5px; direction: rtl; font-size: 12px;">
      <div style="text-align: center; margin-bottom: 10px;">
        <h2 style="margin: 0; font-size: 16px;">${storeName}</h2>
        <p style="margin: 2px 0; font-size: 11px;">تقرير تقفيل الوردية #${shift?.id}</p>
        <p style="margin: 2px 0; font-size: 10px;">التاريخ: ${dateStr}</p>
        <p style="margin: 2px 0; font-size: 10px;">الكاشير: ${cashier}</p>
      </div>

      <div style="border-bottom: 1px solid #000; margin: 5px 0;"></div>

      <div style="display: flex; justify-content: space-between; margin: 3px 0;">
        <span>الكاش الافتتاحي:</span>
        <span>${(shift?.initial_cash || 0).toFixed(2)} ج.م</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 3px 0;">
        <span>مبيعات الكاش:</span>
        <span>+${salesTotal?.toFixed(2)} ج.م</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 3px 0;">
        <span>تحصيل ديون عملاء:</span>
        <span>+${repayTotal?.toFixed(2)} ج.م</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 3px 0;">
        <span>مصروفات وخرج:</span>
        <span>-${refundTotal?.toFixed(2)} ج.م</span>
      </div>

      <div style="border-bottom: 1px solid #000; margin: 5px 0;"></div>

      <div style="display: flex; justify-content: space-between; font-weight: bold; margin: 4px 0;">
        <span>الكاش المتوقع بالدرج:</span>
        <span>${expectedCash?.toFixed(2)} ج.م</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin: 4px 0;">
        <span>الكاش الفعلي المسلم:</span>
        <span>${actualCash?.toFixed(2)} ج.م</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin: 4px 0; color: ${difference >= 0 ? 'green' : 'red'};">
        <span>الفارق (عجز / زيادة):</span>
        <span>${difference >= 0 ? '+' : ''}${difference?.toFixed(2)} ج.م</span>
      </div>

      <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>

      <div style="text-align: center; font-size: 10px;">
        <p>مطبوع من نظام النجدي POS</p>
      </div>
    </div>
  `
}

export function generateGrandShiftReportHtml({
  shift,
  salesTotal = 0,
  repayTotal = 0,
  returnsOutflow = 0,
  supplierOutflow = 0,
  generalOutflow = 0,
  momknSummary = {},
  mobileMoneySummary = {},
  actualCash = 0,
  expectedCash = 0,
  difference = 0,
  storeName = 'سوبر ماركت النجدي',
  branchName = 'الفرع الرئيسي'
}) {
  const dateStr = shift ? shift.start_time.split(' ')[0] : ''
  const timeStr = shift ? shift.start_time.split(' ')[1] : ''
  const cashier = shift ? shift.username : 'كاشير'

  const initialCash = shift?.initial_cash || 0
  const expectedMainCash = initialCash + salesTotal + repayTotal - (returnsOutflow + supplierOutflow + generalOutflow)

  const momknStartDigital = shift?.momkn_start_balance || 0
  const momknStartCash = shift?.momkn_start_cash || 0
  const momknExpectedDigital = momknStartDigital + (momknSummary.totalDigitalImpact || 0)
  const momknExpectedCash = momknStartCash + (momknSummary.totalCashImpact || 0)

  const vfcashStartDigital = shift?.vfcash_start_balance || 0
  const vfcashStartCash = shift?.vfcash_start_cash || 0
  const vfcashExpectedDigital = vfcashStartDigital + (mobileMoneySummary.totalDigitalImpact || 0)
  const mmExpectedCash = vfcashStartCash + (mobileMoneySummary.totalCashImpact || 0)

  const grandDigitalScreens = momknExpectedDigital + vfcashExpectedDigital + (mobileMoneySummary.expectedInstapayDigitalBalance || 0)
  const grandTotalExpectedPaperCash = expectedMainCash + momknExpectedCash + mmExpectedCash

  return `
    <div style="font-family: 'Courier New', monospace; width: 80mm; padding: 5px; direction: rtl; font-size: 11px; color: #000;">
      <div style="text-align: center; margin-bottom: 8px;">
        <h2 style="margin: 0; font-size: 15px; font-weight: bold;">${storeName}</h2>
        <p style="margin: 2px 0; font-size: 10px;">${branchName}</p>
        <div style="border-bottom: 1px solid #000; margin: 4px 0;"></div>
        <p style="margin: 2px 0; font-weight: bold; font-size: 12px;">تقرير تقفيل الوردية الشامل #${shift?.id || '—'}</p>
        <p style="margin: 2px 0; font-size: 10px;">التاريخ والوقت: ${dateStr} ${timeStr}</p>
        <p style="margin: 2px 0; font-size: 10px;">الكاشير المسؤول: ${cashier}</p>
      </div>

      <div style="border-bottom: 1px solid #000; margin: 5px 0;"></div>

      <!-- Section 1: Digital Screen Balances -->
      <div style="margin-bottom: 6px;">
        <div style="font-weight: bold; font-size: 11px; margin-bottom: 3px;">📱 أرصدة الشاشات الديجيتال:</div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>رصيد مكنة ممكن المتوقع بالشاشة:</span>
          <span>${momknExpectedDigital?.toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>رصيد محفظة فودافون بالشاشة:</span>
          <span>${vfcashExpectedDigital?.toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px; border-top: 1px dashed #000; padding-top: 2px; margin-top: 2px;">
          <span>إجمالي أرصدة الشاشات الديجيتال:</span>
          <span>${grandDigitalScreens?.toFixed(2)} ج.م</span>
        </div>
      </div>

      <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>

      <!-- Section 2: Supermarket Till Paper Cash -->
      <div style="margin-bottom: 6px;">
        <div style="font-weight: bold; font-size: 11px; margin-bottom: 3px;">🛒 1. درج السوبر ماركت (كاش):</div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>كاش افتتاحي بالدرج:</span>
          <span>${initialCash?.toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>مبيعات المحل الكاش:</span>
          <span>+${salesTotal?.toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>تحصيل ديون عملاء آجل:</span>
          <span>+${repayTotal?.toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>مرتجع مبيعات (كاش خرج):</span>
          <span>-${returnsOutflow?.toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>مدفوعات موردين (كاش خرج):</span>
          <span>-${supplierOutflow?.toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>مصروفات ونثريات (كاش خرج):</span>
          <span>-${generalOutflow?.toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px; border-top: 1px dashed #000; padding-top: 2px; margin-top: 2px;">
          <span>صافي كاش السوبرماركت المتوقع:</span>
          <span>${expectedMainCash?.toFixed(2)} ج.م</span>
        </div>
      </div>

      <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>

      <!-- Section 3: Momkn Till Paper Cash -->
      <div style="margin-bottom: 6px;">
        <div style="font-weight: bold; font-size: 11px; margin-bottom: 3px;">📱 2. درج ماكينة ممكن (كاش ورق):</div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>كاش درج ممكن الافتتاحي (بايت):</span>
          <span>${momknStartCash?.toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>تأثير الكاش للوردية:</span>
          <span>${(momknSummary.totalCashImpact || 0) >= 0 ? '+' : ''}${(momknSummary.totalCashImpact || 0).toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px; border-top: 1px dashed #000; padding-top: 2px; margin-top: 2px;">
          <span>الكاش الورق المتوقع بآدراج ممكن:</span>
          <span>${momknExpectedCash?.toFixed(2)} ج.م</span>
        </div>
      </div>

      <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>

      <!-- Section 4: Mobile Money Till Paper Cash -->
      <div style="margin-bottom: 6px;">
        <div style="font-weight: bold; font-size: 11px; margin-bottom: 3px;">💰 3. درج المحافظ والتحويلات (كاش ورق):</div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>كاش درج المحافظ الافتتاحي (بايت):</span>
          <span>${vfcashStartCash?.toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>تأثير الكاش للوردية:</span>
          <span>${(mobileMoneySummary.totalCashImpact || 0) >= 0 ? '+' : ''}${(mobileMoneySummary.totalCashImpact || 0).toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px; border-top: 1px dashed #000; padding-top: 2px; margin-top: 2px;">
          <span>الكاش الورق المتوقع بآدراج المحافظ:</span>
          <span>${mmExpectedCash?.toFixed(2)} ج.م</span>
        </div>
      </div>

      <div style="border-bottom: 2px solid #000; margin: 8px 0;"></div>

      <!-- Section 5: Grand Totals & Audit -->
      <div style="margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-bottom: 4px;">
          <span>إجمالي الكاش الورق الشامل بالدرج:</span>
          <span>${grandTotalExpectedPaperCash?.toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; margin-bottom: 4px;">
          <span>الكاش الفعلي المسلم (الجرد):</span>
          <span>${actualCash?.toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; color: ${difference >= 0 ? '#000' : '#000'};">
          <span>فرق العجز / الزيادة الكاش:</span>
          <span>${difference >= 0 ? '+' : ''}${difference?.toFixed(2)} ج.م</span>
        </div>
      </div>

      <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>

      <div style="text-align: center; font-size: 10px;">
        <p style="margin: 2px 0;">توقيع الكاشير: ........................</p>
        <p style="margin: 2px 0;">توقيع المشرف / المالك: ........................</p>
        <p style="margin: 5px 0 0 0; font-size: 9px;">نظام الإدارة الشامل - سوبر ماركت النجدي</p>
      </div>
    </div>
  `
}
