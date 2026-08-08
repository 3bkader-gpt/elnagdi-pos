import http from 'http'
import { executeSql } from './db.js'

let server = null

export function startLocalSyncServer(port = 5000) {
  if (server) return

  server = http.createServer(async (req, res) => {
    // Enable CORS for mobile app requests
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const url = new URL(req.url, `http://${req.headers.host}`)

    try {
      if (url.pathname === '/api/dashboard/live' || url.pathname === '/api/dashboard') {
        const shifts = await executeSql("SELECT * FROM shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1;")
        const activeShift = shifts && shifts.length > 0 ? shifts[0] : null

        let stats = {
          total_sales: 0,
          invoice_count: 0,
          cash_sales: 0,
          debt_sales: 0,
          digital_sales: 0
        }
        let latestSales = []

        if (activeShift) {
          const shiftId = activeShift.id
          const totalSalesRes = await executeSql(`SELECT IFNULL(SUM(total_amount), 0) as total, COUNT(*) as count FROM sales WHERE shift_id = ${shiftId};`)
          const cashSalesRes = await executeSql(`SELECT IFNULL(SUM(total_amount), 0) as total FROM sales WHERE shift_id = ${shiftId} AND payment_type = 'نقدي';`)
          const debtSalesRes = await executeSql(`SELECT IFNULL(SUM(total_amount), 0) as total FROM sales WHERE shift_id = ${shiftId} AND payment_type = 'آجل';`)
          const digitalSalesRes = await executeSql(`SELECT IFNULL(SUM(total_amount), 0) as total FROM sales WHERE shift_id = ${shiftId} AND payment_type NOT IN ('نقدي', 'آجل');`)

          stats = {
            total_sales: parseFloat(totalSalesRes[0]?.total) || 0,
            invoice_count: parseInt(totalSalesRes[0]?.count) || 0,
            cash_sales: parseFloat(cashSalesRes[0]?.total) || 0,
            debt_sales: parseFloat(debtSalesRes[0]?.total) || 0,
            digital_sales: parseFloat(digitalSalesRes[0]?.total) || 0
          }

          latestSales = await executeSql(`SELECT id, timestamp, total_amount, payment_type, client_name FROM sales WHERE shift_id = ${shiftId} ORDER BY id DESC LIMIT 10;`)
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({
          success: true,
          activeShift,
          stats,
          latestSales
        }))
        return
      }

      if (url.pathname === '/api/debts') {
        const debts = await executeSql("SELECT id, name, phone, debt_balance as balance FROM clients WHERE debt_balance > 0 ORDER BY debt_balance DESC;")
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ success: true, debts }))
        return
      }

      if (url.pathname === '/api/products/lookup') {
        const barcode = url.searchParams.get('barcode')
        const prods = await executeSql(`SELECT barcode, name, retail_price FROM products WHERE barcode = '${barcode}';`)
        if (prods && prods.length > 0) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: true, product: prods[0] }))
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: false, message: 'المنتج غير موجود' }))
        }
        return
      }

      if (url.pathname === '/api/products/update-price' && req.method === 'POST') {
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const data = JSON.parse(body)
            const { barcode, new_price, updated_by } = data
            await executeSql(`UPDATE products SET retail_price = ${parseFloat(new_price)} WHERE barcode = '${barcode}';`)
            await executeSql(`INSERT INTO system_logs (username, action_type, description, timestamp) VALUES ('${updated_by || 'المالك'}', 'price_change', 'تحديث سعر الصنف ${barcode} إلى ${new_price} ج.م من الموبايل', datetime('now', 'localtime'));`)
            
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ success: true, message: 'تم تحديث السعر بنجاح' }))
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ success: false, message: err.message }))
          }
        })
        return
      }

      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, message: 'Endpoint not found' }))
    } catch (err) {
      console.error('[LocalSyncServer Error]', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, message: err.message }))
    }
  })

  server.listen(port, '0.0.0.0', () => {
    console.log(`[LocalSyncServer] Running and listening on http://0.0.0.0:${port}`)
  })
}

export function stopLocalSyncServer() {
  if (server) {
    server.close()
    server = null
  }
}
