import { ipcMain, app } from 'electron'
import { exec } from 'child_process'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { executeSql } from './db'

// ─────────────────────────────────────────────────────────────
// Thermal Printer Bridge
// Writes UTF-8 text file → PowerShell PrintDocument (GDI)
// GDI handles Arabic Unicode natively, minimal margins
// CT-S300: 80mm paper, ~42 chars/line
// ─────────────────────────────────────────────────────────────

const W = 48

const center = (s) => {
  const str = String(s).trim()
  const pad = Math.max(0, Math.floor((W - str.length) / 2))
  return ' '.repeat(pad) + str
}
const lrPad = (l, r) => {
  const left = String(l || ''), right = String(r || '')
  return left + ' '.repeat(Math.max(1, W - left.length - right.length)) + right
}
const divider = (c = '-') => c.repeat(W)

function parseItems(html) {
  const items = []
  const trRx = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let m, skip = true
  while ((m = trRx.exec(html)) !== null) {
    if (skip && m[1].includes('<th')) { skip = false; continue }
    const cells = []
    const tdRx = /<td[^>]*>([\s\S]*?)<\/td>/gi
    let td
    while ((td = tdRx.exec(m[1])) !== null)
      cells.push(td[1].replace(/<[^>]+>/g, '').trim())
    // Support 3-col (name, qty, total) and 4-col (name, qty, price, total)
    if (cells.length === 4) items.push({ name: cells[0], qty: cells[1], price: cells[2], total: cells[3] })
    else if (cells.length === 3) items.push({ name: cells[0], qty: cells[1], price: '', total: cells[2] })
  }
  return items
}

function get(html, pat) {
  const m = html.match(pat)
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : ''
}

function buildReceiptText(html, storeName = 'سوبر ماركت النجدي', branchName = 'الفرع الرئيسي') {
  const saleId  = get(html, /رقم العملية:[\s\S]*?([\d?]+)/) || get(html, /فاتورة رقم:[\s\S]*?([\d?]+)/)
  const date    = get(html, /التاريخ:[\s\S]*?<\/b>\s*([\s\S]*?)(?:<\/div>|<br)/)
  const time    = get(html, /الوقت:[\s\S]*?<\/b>\s*([\s\S]*?)(?:<\/div>|<br)/)
  const cashier = get(html, /الكاشير:[\s\S]*?<\/b>\s*([\s\S]*?)(?:<\/div>|<br)/)
  const client  = get(html, /العميل:[\s\S]*?<\/b>\s*([\s\S]*?)(?:<\/div>|<br)/)
  const phone   = get(html, /هاتف العميل:[\s\S]*?<\/b>\s*([\s\S]*?)(?:<\/div>|<br)/)
  const address = get(html, /العنوان:[\s\S]*?<\/b>\s*([\s\S]*?)(?:<\/div>|<br)/)

  console.log('[PRINTER DEBUG] Parsed saleId:', saleId)
  console.log('[PRINTER DEBUG] Parsed date:', date)
  console.log('[PRINTER DEBUG] Parsed time:', time)
  console.log('[PRINTER DEBUG] Parsed cashier:', cashier)
  const total   = get(html, /الإجمالي:<\/span>\s*<span>([^<]+)/)
  const disc    = get(html, /خصم الفاتورة:<\/span>\s*<span>([^<]+)/)
  const paid    = get(html, /المدفوع:<\/span>\s*<span>([^<]+)/)
  const change  = get(html, /الباقي للعميل:<\/span>\s*<span>([^<]+)/)
  const items   = parseItems(html)

  // Format date and time on a single line
  let dateTimeLine = ''
  if (date && time) {
    dateTimeLine = lrPad(`الوقت: ${time}`, `التاريخ: ${date}`)
  } else if (date) {
    dateTimeLine = `[R]التاريخ: ${date}`
  }

  const lines = [
    `[C]${storeName}`,
    `[C]${branchName}`,
    `[C]فاتورة بيع`,
    `[C]رقم العملية : ${saleId}`,
    `------------------------------------------------`,
    ...(dateTimeLine ? [dateTimeLine] : []),
    ...(cashier ? [`[R]الكاشير: ${cashier}`] : []),
    ...(client ? [
      `[BOX]العميل: ${client}` + 
      (phone ? ` ~ الهاتف: ${phone}` : '') + 
      (address ? ` ~ العنوان: ${address}` : '')
    ] : (address ? [`[BOX]العنوان: ${address}`] : [])),
    `------------------------------------------------`,
    `الصنف|ك|سعر|إجمالي`,
    `------------------------------------------------`,
    ...items.map(item => `${item.name}|${item.qty}|${item.price || ''}|${item.total}`),
    `------------------------------------------------`,
    ...(total  ? [`الإجمالي|${total}`] : []),
    ...(disc   ? [`خصم الفاتورة|- ${disc}`] : []),
    ...(paid   ? [`المدفوع|${paid}`] : []),
    ...(change ? [`الباقي للعميل|${change}`] : []),
    `------------------------------------------------`,
    `[C]شكراً لتسوقكم معنا!`,
    `[C]- ${storeName} -`,
    '',
    ''
  ]

  return lines.join('\r\n')
}

function getScriptPath() {
  return app.isPackaged
    ? join(process.resourcesPath, 'print_receipt.ps1')
    : join(__dirname, '../../resources/print_receipt.ps1')
}

export function initializePrinter() {
  ipcMain.handle('print-receipt', async (event, htmlContent) => {
    let storeName = 'سوبر ماركت النجدي'
    let branchName = 'الفرع الرئيسي'
    let printerName = 'CITIZEN CT-S300'
    try {
      const dbSettings = await executeSql("SELECT key, value FROM settings WHERE key IN ('store_name', 'branch_name', 'printer_name');")
      if (Array.isArray(dbSettings)) {
        const storeSetting = dbSettings.find(s => s.key === 'store_name')
        const branchSetting = dbSettings.find(s => s.key === 'branch_name')
        const printerSetting = dbSettings.find(s => s.key === 'printer_name')
        if (storeSetting) storeName = storeSetting.value
        if (branchSetting) branchName = branchSetting.value
        if (printerSetting) printerName = printerSetting.value
      }
    } catch (err) {
      console.error('[PRINTER] Failed to fetch settings from DB:', err)
    }

    return new Promise((resolve, reject) => {
      const ts  = Date.now()
      const txt = join(tmpdir(), `receipt_${ts}.txt`)

      try {
        const text = buildReceiptText(htmlContent, storeName, branchName)
        writeFileSync(txt, text, { encoding: 'utf8' })
        console.log('[PRINTER] Text file written:', txt)

        const script = getScriptPath()
        const cmd = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${script}" -TextFile "${txt}" -PrinterName "${printerName}"`
        console.log('[PRINTER] Running:', cmd)

        exec(cmd, { timeout: 20000 }, (err, stdout, stderr) => {
          try { if (existsSync(txt)) unlinkSync(txt) } catch (_) {}

          if (err) {
            console.error('[PRINTER] Error:', err.message)
            return reject(new Error(`Print failed: ${err.message}`))
          }
          console.log('[PRINTER]', stdout.trim())
          if (stderr) console.warn('[PRINTER] stderr:', stderr.trim())

          stdout.includes('PRINT_DONE')
            ? resolve(true)
            : reject(new Error('Not confirmed: ' + stdout))
        })

      } catch (err) {
        try { if (existsSync(txt)) unlinkSync(txt) } catch (_) {}
        reject(err)
      }
    })
  })
}
