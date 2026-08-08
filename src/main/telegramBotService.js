import { executeSql } from './db'

const BOT_TOKEN = '8673600416:AAGU-2vthBUWsuHSqdM4tPohO6kbdr6HO3E'
const OWNER_CHAT_ID = '6788399763'
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`

let lastUpdateId = 0
let isPolling = false

/**
 * Send HTTP POST request to Telegram API.
 */
async function sendTelegramRequest(method, payload = {}) {
  try {
    const res = await fetch(`${TELEGRAM_API_URL}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return await res.json()
  } catch (err) {
    console.error(`Telegram API Error (${method}):`, err.message)
    return null
  }
}

/**
 * Send main persistent keyboard menu to Telegram chat.
 */
export async function sendMainMenu(textMessage = '👋 <b>لوحة تحكم سوبر ماركت النجدي 🏪</b>\nاختر الأيقونة المطلوبة:') {
  await sendTelegramRequest('sendMessage', {
    chat_id: OWNER_CHAT_ID,
    text: textMessage,
    parse_mode: 'HTML',
    reply_markup: {
      keyboard: [
        [{ text: '📊 مبيعات اليوم' }, { text: '💳 رصيدي الكريديت' }],
        [{ text: '💵 كاش الوردية الحالية' }, { text: '📖 كشف الديون' }],
        [{ text: '📦 نواقص المخزن' }, { text: '🔄 تحديث القائمة' }]
      ],
      resize_keyboard: true,
      is_persistent: true
    }
  })
}

/**
 * Handle incoming Telegram command or text message.
 */
async function handleTelegramMessage(msg) {
  if (!msg || !msg.text) return
  const chatId = String(msg.chat.id)
  const text = msg.text.trim()

  // Security check: Only respond to owner chat ID
  if (chatId !== OWNER_CHAT_ID) {
    console.log('Ignored message from unauthorized chat ID:', chatId)
    return
  }

  console.log('[TelegramBot] Processing owner command:', text)

  // 1. Start or Menu Reset Command
  if (text.includes('/start') || text.includes('تحديث القائمة')) {
    await sendMainMenu('👋 <b>أهلاً بك يا باشا في لوحة تحكم المحل 🏪</b>\nالتحكم التفاعلي بالكامل مفعّل الآن بين يديك:')
    return
  }

  // 2. Owner Real Credit Balance
  if (text.includes('رصيدي الكريديت') || text.includes('/credit')) {
    try {
      const ownerCostRes = executeSql(`
        SELECT IFNULL(SUM(si.quantity * COALESCE(NULLIF(si.cost_price, 0), p.cost_price, si.unit_price)), 0) as total_cost
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        LEFT JOIN products p ON si.product_barcode = p.barcode
        WHERE (s.client_id = 35 OR s.client_name LIKE '%قطبي%') AND s.payment_type = 'آجل';
      `)
      const accumulatedCost = ownerCostRes?.[0]?.total_cost || 0
      const initialCredit = 1000.0
      const realCreditRemaining = initialCredit - accumulatedCost

      const msgText = `💳 <b>كشف رصيد الكريديت الشخصي 🏪</b>
━━━━━━━━━━━━━━━━━━
💰 <b>الرصيد الابتدائي:</b> 1,000.00 ج.م
💸 <b>مجموع مسحوبات التكلفة:</b> ${accumulatedCost.toFixed(2)} ج.م
💳 <b>رصيدك الكريديت الحقيقي المتبقي:</b>
• <code>${realCreditRemaining.toFixed(2)} ج.م</code>
━━━━━━━━━━━━━━━━━━
🟢 <i>بيانات سريّة خاصة بالمالك | الدرج الورقي غير متأثر 0.00 ج.م</i>`

      await sendTelegramRequest('sendMessage', {
        chat_id: OWNER_CHAT_ID,
        text: msgText,
        parse_mode: 'HTML'
      })
    } catch (err) {
      await sendTelegramRequest('sendMessage', { chat_id: OWNER_CHAT_ID, text: '❌ حدث خطأ أثناء استعلام رصيد الكريديت.' })
    }
    return
  }

  // 3. Today's Sales Summary
  if (text.includes('مبيعات اليوم') || text.includes('/stats')) {
    try {
      const todaySales = executeSql(`
        SELECT 
          IFNULL(SUM(total_amount), 0) as total,
          COUNT(*) as count,
          IFNULL(SUM(CASE WHEN payment_type = 'نقدي' THEN total_amount ELSE 0 END), 0) as cash,
          IFNULL(SUM(CASE WHEN payment_type = 'آجل' THEN total_amount ELSE 0 END), 0) as debt,
          IFNULL(SUM(CASE WHEN payment_type NOT IN ('نقدي', 'آجل') THEN total_amount ELSE 0 END), 0) as digital
        FROM sales
        WHERE timestamp LIKE strftime('%Y-%m-%d', 'now', 'localtime') || '%';
      `)[0]

      const msgText = `📊 <b>تقرير مبيعات اليوم اللحظي 🏪</b>
━━━━━━━━━━━━━━━━━━
💰 <b>إجمالي المبيعات:</b> <b>${todaySales.total.toFixed(2)} ج.م</b>
🧾 <b>عدد الفواتير:</b> ${todaySales.count} فاتورة

💵 <b>كاش نقدي:</b> ${todaySales.cash.toFixed(2)} ج.م
📝 <b>مبيعات آجل (شكك):</b> ${todaySales.debt.toFixed(2)} ج.م
💳 <b>محافظ انستا/فودافون:</b> ${todaySales.digital.toFixed(2)} ج.م
━━━━━━━━━━━━━━━━━━
🟢 <i>بيانات محدثة تلقائياً من محطة POS الرئيسية</i>`

      await sendTelegramRequest('sendMessage', {
        chat_id: OWNER_CHAT_ID,
        text: msgText,
        parse_mode: 'HTML'
      })
    } catch (err) {
      await sendTelegramRequest('sendMessage', { chat_id: OWNER_CHAT_ID, text: '❌ حدث خطأ أثناء جلب تقرير مبيعات اليوم.' })
    }
    return
  }

  // 4. Active Shift Status & Cash in Drawer
  if (text.includes('كاش الوردية') || text.includes('/shift')) {
    try {
      const activeShift = executeSql("SELECT * FROM shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1;")[0]

      if (!activeShift) {
        await sendTelegramRequest('sendMessage', { chat_id: OWNER_CHAT_ID, text: '⚠️ لا توجد وردية مفتوحة حالياً بالبرنامج.' })
        return
      }

      const shiftId = activeShift.id
      const totalSalesRes = executeSql(`SELECT IFNULL(SUM(total_amount), 0) as total, COUNT(*) as count FROM sales WHERE shift_id = ${shiftId};`)[0]
      const debtSalesRes = executeSql(`SELECT IFNULL(SUM(total_amount), 0) as total FROM sales WHERE shift_id = ${shiftId} AND payment_type = 'آجل';`)[0]
      const digitalSalesRes = executeSql(`SELECT IFNULL(SUM(total_amount), 0) as total FROM sales WHERE shift_id = ${shiftId} AND payment_type NOT IN ('نقدي', 'آجل');`)[0]

      const totalSales = totalSalesRes.total || 0
      const debtSales = debtSalesRes.total || 0
      const digitalSales = digitalSalesRes.total || 0
      const expectedCash = totalSales - debtSales - digitalSales

      const msgText = `💵 <b>تقرير الوردية الحالية (#${shiftId}) 🏪</b>
━━━━━━━━━━━━━━━━━━
⏰ <b>بداية الوردية:</b> ${activeShift.start_time}
🧾 <b>عدد الفواتير:</b> ${totalSalesRes.count} فاتورة
💰 <b>إجمالي المبيعات:</b> <b>${totalSales.toFixed(2)} ج.م</b>

📝 <b>مبيعات آجل (لم تدخل الدرج):</b> -${debtSales.toFixed(2)} ج.م
💳 <b>تحويلات رقمية (محافظ):</b> -${digitalSales.toFixed(2)} ج.م

💵 <b>صافي الكاش الورقي المتوقع بالدرج:</b>
• <code>${expectedCash.toFixed(2)} ج.م</code>
━━━━━━━━━━━━━━━━━━`

      await sendTelegramRequest('sendMessage', {
        chat_id: OWNER_CHAT_ID,
        text: msgText,
        parse_mode: 'HTML'
      })
    } catch (err) {
      await sendTelegramRequest('sendMessage', { chat_id: OWNER_CHAT_ID, text: '❌ حدث خطأ أثناء تقرير الوردية.' })
    }
    return
  }

  // 5. Customer Debts List
  if (text.includes('كشف الديون') || text.includes('/debts')) {
    try {
      const debts = executeSql("SELECT name, phone, debt_balance FROM clients WHERE debt_balance > 0 ORDER BY debt_balance DESC LIMIT 8;")
      const totalDebtRes = executeSql("SELECT IFNULL(SUM(debt_balance), 0) as total FROM clients WHERE debt_balance > 0;")[0]

      if (!debts || debts.length === 0) {
        await sendTelegramRequest('sendMessage', { chat_id: OWNER_CHAT_ID, text: '🎉 لا توجد أي ديون أو شكك مستحقة على العملاء حالياً!' })
        return
      }

      const debtLines = debts.map((d, i) => `${i + 1}. <b>${d.name}</b> ${d.phone ? `(${d.phone})` : ''}\n   المديونية: <b>${d.debt_balance.toFixed(2)} ج.م</b>`).join('\n\n')

      const msgText = `📖 <b>أعلى العملاء مديونية (الشكك) 🏪</b>
━━━━━━━━━━━━━━━━━━
${debtLines}

━━━━━━━━━━━━━━━━━━
💰 <b>إجمالي ديون السوق المتراكمة:</b>
• <code>${(totalDebtRes.total || 0).toFixed(2)} ج.م</code>`

      await sendTelegramRequest('sendMessage', {
        chat_id: OWNER_CHAT_ID,
        text: msgText,
        parse_mode: 'HTML'
      })
    } catch (err) {
      await sendTelegramRequest('sendMessage', { chat_id: OWNER_CHAT_ID, text: '❌ حدث خطأ أثناء جلب كشف الديون.' })
    }
    return
  }

  // 6. Low Stock Shortages Report
  if (text.includes('نواقص المخزن') || text.includes('/shortages')) {
    try {
      const shortages = executeSql("SELECT name, stock_qty, reorder_limit, unit FROM products WHERE stock_qty <= reorder_limit AND reorder_limit > 0 ORDER BY stock_qty ASC LIMIT 10;")

      if (!shortages || shortages.length === 0) {
        await sendTelegramRequest('sendMessage', { chat_id: OWNER_CHAT_ID, text: '✅ جميع أصناف المخزن بكميات آمنة وفوق حد الطلب!' })
        return
      }

      const shortageLines = shortages.map((s, i) => `${i + 1}. <b>${s.name}</b>\n   المتبقي: <code style="color:red">${s.stock_qty} ${s.unit || 'وحدة'}</code> (حد التنبيه: ${s.reorder_limit})`).join('\n\n')

      const msgText = `📦 <b>أصناف وصلت تحت حد الطلب (النواقص) 🏪</b>
━━━━━━━━━━━━━━━━━━
${shortageLines}
━━━━━━━━━━━━━━━━━━
💡 <i>يرجى التوجيه بعمل طلبية لتوفير النواقص للمحل</i>`

      await sendTelegramRequest('sendMessage', {
        chat_id: OWNER_CHAT_ID,
        text: msgText,
        parse_mode: 'HTML'
      })
    } catch (err) {
      await sendTelegramRequest('sendMessage', { chat_id: OWNER_CHAT_ID, text: '❌ حدث خطأ أثناء جلب نواقص المخزن.' })
    }
    return
  }

  // 7. Product Barcode Direct Lookup (if numbers only)
  if (/^\d{4,15}$/.test(text)) {
    try {
      const prods = executeSql(`SELECT * FROM products WHERE barcode = '${text}' OR barcode LIKE '%${text}' LIMIT 1;`)

      if (prods && prods.length > 0) {
        const p = prods[0]
        const msgText = `🔍 <b>بيانات المنتج الاستعلامي 🏷️</b>
━━━━━━━━━━━━━━━━━━
📦 <b>اسم الصنف:</b> ${p.name}
🔢 <b>الباركود:</b> <code>${p.barcode}</code>
💰 <b>سعر البيع للجمهور:</b> <b>${parseFloat(p.retail_price).toFixed(2)} ج.م</b>
🏭 <b>سعر التكلفة للجملة:</b> <b>${parseFloat(p.cost_price).toFixed(2)} ج.م</b>
📦 <b>الرصيد المتاح بالمخزن:</b> <b>${p.stock_qty} ${p.unit || 'وحدة'}</b>
━━━━━━━━━━━━━━━━━━`

        await sendTelegramRequest('sendMessage', {
          chat_id: OWNER_CHAT_ID,
          text: msgText,
          parse_mode: 'HTML'
        })
      } else {
        await sendTelegramRequest('sendMessage', { chat_id: OWNER_CHAT_ID, text: `⚠️ المنتج برقم باركود (${text}) غير مسجل بقاعدة البيانات.` })
      }
    } catch (err) {
      await sendTelegramRequest('sendMessage', { chat_id: OWNER_CHAT_ID, text: '❌ حدث خطأ أثناء البحث عن الباركود.' })
    }
    return
  }

  // Default fallback for unknown text
  await sendMainMenu(`❓ <b>أمر غير معروف: (${text})</b>\nيرجى استخدام الأزرار التفاعلية بالأسفل أو إرسال باركود منتج للاستعلام عنه:`)
}

/**
 * Poll updates continuously from Telegram.
 */
async function pollTelegramUpdates() {
  if (isPolling) return
  isPolling = true

  try {
    const data = await sendTelegramRequest('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 5
    })

    if (data && data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        lastUpdateId = update.update_id
        if (update.message) {
          await handleTelegramMessage(update.message)
        }
      }
    }
  } catch (err) {
    console.error('Telegram Poll Loop Error:', err.message)
  } finally {
    isPolling = false
  }
}

/**
 * Start Telegram bot service.
 */
export async function startTelegramBotService() {
  console.log('Starting Telegram Bot Listener Service...')
  
  // Ensure Webhook is deleted first to enable long polling
  await sendTelegramRequest('deleteWebhook', { drop_pending_updates: false })

  // Set bot commands menu
  await sendTelegramRequest('setMyCommands', {
    commands: [
      { command: 'start', description: '🚀 فتح القائمة الرئيسية للبوت' },
      { command: 'credit', description: '💳 رصيد الكريديت الحقيقي للمالك' },
      { command: 'shift', description: '📊 تقرير الوردية الحالية والدرج' },
      { command: 'stats', description: '📈 مبيعات اليوم والأرباح' },
      { command: 'debts', description: '📖 كشف ديون العملاء' },
      { command: 'shortages', description: '📦 نواقص البضاعة والمخزن' }
    ]
  }).catch(() => {})

  // Send initial welcome keyboard menu
  sendMainMenu('👋 <b>تم تفعيل التحكم التفاعلي لبوت سوبرماركت النجدي 🏪</b>\nاستخدم الأزرار بالأسفل للاستعلام والتحكم اللحظي بالمحل:').catch(() => {})

  // Start continuous polling timer (every 2.5s)
  setInterval(pollTelegramUpdates, 2500)
}
