export function generateReceiptHtml({
  storeName = 'سوبر ماركت النجدي',
  branchName = 'الفرع الرئيسي',
  displaySaleId,
  datePart,
  timePart,
  currentUser,
  clientName,
  clientPhone,
  clientAddress,
  cart,
  cartTotal,
  finalDiscount,
  paidAmount,
  changeRemaining
}) {
  const isSystemUser = currentUser?.username?.toLowerCase() === 'admin' || currentUser?.username?.toLowerCase() === 'manager'
  return `
    <div class="text-center bold" style="font-size: 14px; margin-bottom: 2px;">${storeName}</div>
    <div class="text-center" style="font-size: 11px; margin-bottom: 1px;">${branchName}</div>
    <div class="divider"></div>
    <div style="font-size: 9px; margin-bottom: 4px;">
      <div><b>رقم العملية:</b> ${displaySaleId}</div>
      <div><b>التاريخ:</b> ${datePart}</div>
      <div><b>الوقت:</b> ${timePart}</div>
      ${!isSystemUser && currentUser ? `<div><b>الكاشير:</b> ${currentUser.username}</div>` : ''}
      ${clientName ? `<div><b>العميل:</b> ${clientName}</div>` : ''}
      ${clientPhone ? `<div><b>هاتف العميل:</b> ${clientPhone}</div>` : ''}
      ${clientAddress ? `<div><b>العنوان:</b> ${clientAddress}</div>` : ''}
    </div>
    <div class="divider"></div>
    <table>
      <thead>
        <tr>
          <th style="text-align: right;">الصنف</th>
          <th style="text-align: center; width: 28px;">ك</th>
          <th style="text-align: center; width: 38px;">سعر</th>
          <th style="text-align: left; width: 42px;">إجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${cart.map(item => `
          <tr>
            <td>${item.name}</td>
            <td style="text-align: center;">${item.qty}</td>
            <td style="text-align: center;">${item.price.toFixed(2)}</td>
            <td style="text-align: left;">${item.total.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="divider"></div>
    <div style="font-size: 10px; font-weight: bold; display: flex; justify-content: space-between;">
      <span>الإجمالي:</span>
      <span>${cartTotal.toFixed(2)} ج.م</span>
    </div>
    ${finalDiscount > 0 ? `
    <div style="font-size: 8px; display: flex; justify-content: space-between;">
      <span>خصم الفاتورة:</span>
      <span>-${finalDiscount.toFixed(2)} ج.م</span>
    </div>
    ` : ''}
    <div style="font-size: 8px; display: flex; justify-content: space-between;">
      <span>المدفوع:</span>
      <span>${parseFloat(paidAmount || cartTotal).toFixed(2)} ج.م</span>
    </div>
    <div style="font-size: 9px; font-weight: bold; color: #000; display: flex; justify-content: space-between;">
      <span>الباقي للعميل:</span>
      <span>${changeRemaining.toFixed(2)} ج.م</span>
    </div>
    <div class="divider"></div>
    <div class="text-center" style="font-size: 8px; margin-top: 4px; font-style: italic;">
      شكراً لتسوقكم معنا! - ${storeName}
    </div>
  `
}

export function generateReprintHtml({
  storeName = 'سوبر ماركت النجدي',
  branchName = 'الفرع الرئيسي',
  displaySaleId,
  datePart,
  timePart,
  s,
  clName,
  clPhone,
  clAddress,
  items
}) {
  const isSystemUser = s.username.toLowerCase() === 'admin' || s.username.toLowerCase() === 'manager'
  const isFullyReturned = s.total_amount === 0;

  return `
    <div class="text-center bold" style="font-size: 14px; margin-bottom: 2px;">${storeName}</div>
    <div class="text-center" style="font-size: 11px; margin-bottom: 1px;">${branchName}</div>
    <div class="divider"></div>
    <div style="font-size: 9px; margin-bottom: 4px;">
      <div class="text-center bold" style="font-size: 10px; margin-bottom: 2px; color: ${isFullyReturned ? '#ef4444' : '#000'}">
        ${isFullyReturned ? '*** فاتورة مرتجعة بالكامل ***' : '*** نسخة معاد طباعتها ***'}
      </div>
      <div><b>رقم العملية:</b> ${displaySaleId}</div>
      <div><b>التاريخ:</b> ${datePart}</div>
      <div><b>الوقت:</b> ${timePart}</div>
      ${!isSystemUser ? `<div><b>الكاشير:</b> ${s.username}</div>` : ''}
      ${clName ? `<div><b>العميل:</b> ${clName}</div>` : ''}
      ${clPhone ? `<div><b>هاتف العميل:</b> ${clPhone}</div>` : ''}
      ${clAddress ? `<div><b>العنوان:</b> ${clAddress}</div>` : ''}
    </div>
    <div class="divider"></div>
    <table>
      <thead>
        <tr>
          <th style="text-align: right;">الصنف</th>
          <th style="text-align: center; width: 28px;">ك</th>
          <th style="text-align: center; width: 38px;">سعر</th>
          <th style="text-align: left; width: 42px;">إجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => {
          const retQty = item.returned_qty || 0;
          const isItemReturned = retQty >= item.quantity;
          const isItemPartReturned = retQty > 0 && !isItemReturned;
          const displayQty = isItemReturned 
            ? `0` 
            : isItemPartReturned 
              ? `${item.quantity - retQty}` 
              : `${item.quantity}`;
          
          let nameLabel = item.name || `باركود ${item.product_barcode}`;
          if (isItemReturned) {
            nameLabel = `<span style="text-decoration: line-through;">${nameLabel}</span> (مرتجع)`;
          } else if (isItemPartReturned) {
            nameLabel = `${nameLabel} (مرتجع ${retQty})`;
          }

          return `
            <tr style="${isItemReturned ? 'color: #888;' : ''}">
              <td>${nameLabel}</td>
              <td style="text-align: center;">${displayQty}</td>
              <td style="text-align: center;">${item.unit_price.toFixed(2)}</td>
              <td style="text-align: left; ${isItemReturned ? 'text-decoration: line-through;' : ''}">${item.total_price.toFixed(2)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    <div class="divider"></div>
    <div style="font-size: 10px; font-weight: bold; display: flex; justify-content: space-between;">
      <span>الإجمالي:</span>
      <span>${s.total_amount.toFixed(2)} ج.م</span>
    </div>
    ${s.original_amount > 0 && s.total_amount === 0 ? `
    <div style="font-size: 8px; display: flex; justify-content: space-between; text-decoration: line-through; color: #888;">
      <span>الإجمالي الأصلي:</span>
      <span>${s.original_amount.toFixed(2)} ج.م</span>
    </div>
    ` : ''}
    ${s.discount > 0 ? `
    <div style="font-size: 8px; display: flex; justify-content: space-between;">
      <span>خصم الفاتورة:</span>
      <span>-${s.discount.toFixed(2)} ج.م</span>
    </div>
    ` : ''}
    <div style="font-size: 8px; display: flex; justify-content: space-between;">
      <span>طريقة الدفع:</span>
      <span>${s.payment_type}</span>
    </div>
    <div class="divider"></div>
    <div class="text-center" style="font-size: 8px; margin-top: 4px; font-style: italic;">
      شكراً لتسوقكم معنا! - ${storeName}
    </div>
  `
}
