/**
 * Cloudflare Workers Serverless API & D1 Sync Engine
 * El-Nagdi Manager Mobile App Backend
 */

// Helper to handle CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-ID',
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Telegram Helper with non-blocking ctx.waitUntil
async function sendTelegramAlert(env, message) {
  try {
    const botToken = env.TELEGRAM_BOT_TOKEN
    const chatId = env.TELEGRAM_MANAGER_CHAT_ID
    if (!botToken || !chatId) return

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })
  } catch (err) {
    console.error('Telegram notification error:', err)
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const path = url.pathname

    // Handle OPTIONS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      // 1. MANAGER AUTHENTICATION (Login)
      if (path === '/api/auth/login' && request.method === 'POST') {
        const body = await request.json()
        const { pin, deviceId, deviceName } = body

        // Validate PIN against secret in env (or default '1234')
        const managerPin = env.MANAGER_PIN || '1234'
        if (pin !== managerPin) {
          return jsonResponse({ error: 'رمز الدخول غير صحيح' }, 401)
        }

        // Device Check
        const registeredDeviceId = env.REGISTERED_DEVICE_ID || deviceId
        if (deviceId && registeredDeviceId && deviceId !== registeredDeviceId) {
          // Send security alert via Telegram
          ctx.waitUntil(
            sendTelegramAlert(
              env,
              `⚠️ <b>تنبيه أمني: تسجيل دخول جديد!</b>\n` +
              `تم تسجل الدخول للتطبيق من جهاز جديد:\n` +
              `📱 الجهاز: <code>${deviceName || 'معرف غير معروف'}</code>\n` +
              `🆔 Device ID: <code>${deviceId}</code>\n` +
              `⏰ التوقيت: ${new Date().toLocaleString('ar-EG')}`
            )
          )
        }

        // Generate dummy Tokens (JWT structure)
        const accessToken = `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        return jsonResponse({
          success: true,
          accessToken,
          refreshToken,
          expiresIn: 1800, // 30 mins
          message: 'تم تسجيل الدخول بنجاح',
        })
      }

      // 2. POS DESKTOP SYNC PUSH (Upload sync_queue batch)
      if (path === '/api/sync/push' && request.method === 'POST') {
        const body = await request.json()
        const { items } = body // Array of sync_queue items

        if (!Array.isArray(items) || items.length === 0) {
          return jsonResponse({ success: true, syncedIds: [] })
        }

        const syncedIds = []
        for (const item of items) {
          try {
            const payload = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload

            if (item.table_name === 'sales') {
              // Upsert sales record
              await env.DB.prepare(`
                INSERT INTO sales (id, shift_id, timestamp, total_amount, original_amount, discount, payment_type, client_name, client_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  total_amount = excluded.total_amount,
                  discount = excluded.discount,
                  payment_type = excluded.payment_type;
              `).bind(
                payload.id,
                payload.shift_id,
                payload.timestamp,
                payload.total_amount,
                payload.original_amount || payload.total_amount,
                payload.discount || 0,
                payload.payment_type,
                payload.client_name || '',
                payload.client_id || null
              ).run()
            } else if (item.table_name === 'shifts') {
              // Upsert shifts record
              await env.DB.prepare(`
                INSERT INTO shifts (id, user_id, start_time, end_time, initial_cash, expected_end_cash, actual_end_cash, difference, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  end_time = excluded.end_time,
                  expected_end_cash = excluded.expected_end_cash,
                  actual_end_cash = excluded.actual_end_cash,
                  difference = excluded.difference,
                  status = excluded.status;
              `).bind(
                payload.id,
                payload.user_id,
                payload.start_time,
                payload.end_time,
                payload.initial_cash,
                payload.expected_end_cash,
                payload.actual_end_cash,
                payload.difference,
                payload.status
              ).run()

              // If shift closed, send Telegram notification in background
              if (payload.status === 'closed') {
                ctx.waitUntil(
                  sendTelegramAlert(
                    env,
                    `📊 <b>تقرير تقفيل وردية جديدة (#${payload.id})</b>\n` +
                    `⏰ النهاية: ${payload.end_time}\n` +
                    `💵 الكاش الفعلي: ${payload.actual_end_cash} ج.م\n` +
                    `🎯 العجز/الزيادة: <b>${payload.difference} ج.م</b>`
                  )
                )
              }
            } else if (item.table_name === 'products') {
              // Upsert products record
              await env.DB.prepare(`
                INSERT INTO products (barcode, name, retail_price, cost_price, stock_qty)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(barcode) DO UPDATE SET
                  name = excluded.name,
                  retail_price = excluded.retail_price,
                  cost_price = excluded.cost_price,
                  stock_qty = excluded.stock_qty;
              `).bind(
                payload.barcode,
                payload.name,
                payload.retail_price,
                payload.cost_price || 0,
                payload.stock_qty || 0
              ).run()
            }

            syncedIds.push(item.id)
          } catch (err) {
            console.error(`Sync error for item ${item.id}:`, err)
          }
        }

        return jsonResponse({ success: true, syncedIds })
      }

      // 3. LIVE DASHBOARD FEED FOR MOBILE APP
      if (path === '/api/dashboard/live' && request.method === 'GET') {
        // Query active shift
        const activeShift = await env.DB.prepare(`SELECT * FROM shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1;`).first()
        
        const shiftId = activeShift ? activeShift.id : 0

        // Query shift aggregates
        const salesStats = await env.DB.prepare(`
          SELECT 
            COALESCE(SUM(total_amount), 0) as total_sales,
            COALESCE(SUM(CASE WHEN payment_type = 'نقدي' THEN total_amount ELSE 0 END), 0) as cash_sales,
            COALESCE(SUM(CASE WHEN payment_type = 'آجل' THEN total_amount ELSE 0 END), 0) as debt_sales,
            COALESCE(SUM(CASE WHEN payment_type = 'فودافون كاش' OR payment_type = 'انستا باي' THEN total_amount ELSE 0 END), 0) as digital_sales,
            COUNT(id) as invoice_count
          FROM sales
          WHERE shift_id = ?;
        `).bind(shiftId).first()

        // Query latest 10 sales
        const latestSales = await env.DB.prepare(`
          SELECT id, timestamp, total_amount, payment_type, client_name
          FROM sales
          WHERE shift_id = ?
          ORDER BY id DESC LIMIT 10;
        `).bind(shiftId).all()

        return jsonResponse({
          success: true,
          activeShift: activeShift || null,
          stats: salesStats || { total_sales: 0, cash_sales: 0, debt_sales: 0, digital_sales: 0, invoice_count: 0 },
          latestSales: latestSales.results || [],
        })
      }

      // 4. PRICE & STOCK EDIT FROM MOBILE APP
      if (path === '/api/products/update-price' && request.method === 'POST') {
        const body = await request.json()
        const { barcode, newPrice, modifiedBy } = body

        if (!barcode || newPrice === undefined) {
          return jsonResponse({ error: 'يرجى تحديد الباركود والسعر الجديد' }, 400)
        }

        const product = await env.DB.prepare(`SELECT * FROM products WHERE barcode = ?;`).bind(barcode).first()
        if (!product) {
          return jsonResponse({ error: 'الصنف غير موجود' }, 404)
        }

        const oldPrice = product.retail_price

        // Update product price in D1
        await env.DB.prepare(`UPDATE products SET retail_price = ? WHERE barcode = ?;`).bind(newPrice, barcode).run()

        // Insert into price_change_log
        await env.DB.prepare(`
          INSERT INTO price_change_log (product_barcode, product_name, old_price, new_price, modified_by, source, timestamp)
          VALUES (?, ?, ?, ?, ?, 'mobile', datetime('now', 'localtime'));
        `).bind(barcode, product.name, oldPrice, newPrice, modifiedBy || 'المالك (موبايل)').run()

        // Non-blocking Telegram Alert
        ctx.waitUntil(
          sendTelegramAlert(
            env,
            `🏷️ <b>تعديل سعر صنف من الموبايل!</b>\n` +
            `📦 الصنف: <b>${product.name}</b> (${barcode})\n` +
            `💰 السعر القديم: ${oldPrice} ج.م ⬅️ <b>السعر الجديد: ${newPrice} ج.م</b>`
          )
        )

        return jsonResponse({
          success: true,
          message: `تم تعديل سعر "${product.name}" بنجاح إلى ${newPrice} ج.م`,
        })
      }

      return jsonResponse({ error: 'Endpoint Not Found' }, 404)
    } catch (err) {
      console.error('Worker error:', err)
      return jsonResponse({ error: 'Server Internal Error', details: err.message }, 500)
    }
  },
}
