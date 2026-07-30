import { useState, useRef } from 'react'
import { escapeSql, normalizeDigits, playSound, getNowStr, getFriendlyErrorMessage} from '../lib/utils'
import { executeQuery } from '../lib/db'
import { generateReceiptHtml, generateReprintHtml } from '../lib/printTemplates'
import { logEvent } from '../lib/dao/logs.dao'

/**
 * Custom hook to encapsulate the POS checkout/terminal workflow control logic,
 * including shifts logging, barcode parsing, search suggestions, printing,
 * manager authorization, and SQLite checkout transaction execution.
 */
export function usePOSController({
  currentUser,
  setCurrentUser,
  currentShift,
  setCurrentShift,
  isLocked,
  setIsLocked,
  openShiftModal,
  setOpenShiftModal,
  startingCash,
  setStartingCash,
  closeShiftModal,
  setCloseShiftModal,
  actualEndCash,
  setActualEndCash,
  managerApprovalModal,
  setManagerApprovalModal,
  managerPin,
  setManagerPin,
  pendingAction,
  setPendingAction,
  rawHandleLock,

  cart,
  setCart,
  discount,
  setDiscount,
  paidAmount,
  setPaidAmount,
  paymentType,
  setPaymentType,
  clientName,
  setClientName,
  clientPhone,
  setClientPhone,
  isDelivery,
  setIsDelivery,
  cartTotal,
  cartSubtotal,
  addToCart,
  triggerClearCart,
  updateQty,

  barcodeInputRef,
  searchInputRef,
  qtyInputRefs,

  depositChange,
  setDepositChange,
  appliedCredit,
  setAppliedCredit,
  printSilent,
  noPrint,
  setToastMessage,
  fetchStats,
  fetchClientsList,
  fetchClientStats,
  fetchAdminData,
  triggerCustomAlert,
  triggerCustomConfirm,
  parseScaleBarcode,
  setCurrentView
}) {
  const [pin, setPin] = useState('')
  const searchDebounceRef = useRef(null)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1)

  const [clientAddress, setClientAddress] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientSearchResults, setClientSearchResults] = useState([])

  const handleLock = () => {
    rawHandleLock()
    setCart([])
    setPin('')
    setBarcodeInput('')
    setSearchInput('')
    setSearchResults([])
    setClientName('')
    setClientPhone('')
    setIsDelivery(false)
    setClientAddress('')
    setSelectedClient(null)
    setClientSearchResults([])
    setCurrentView('pos')
  }

  // Pin Authenticator
  const handlePinSubmit = async (customPin = null) => {
    if (customPin && typeof customPin.preventDefault === 'function') {
      customPin.preventDefault()
      customPin = null
    }
    const cleanPin = normalizeDigits(customPin !== null ? customPin : pin)
    try {
      if (!cleanPin) {
        return
      }
      const escapedPin = escapeSql(cleanPin)
      let users = await executeQuery(`SELECT * FROM users WHERE password_hash = '${escapedPin}' LIMIT 1;`)

      if (users.length > 0) {
        const user = users[0]
        setCurrentUser(user)
        setPin('')

        console.log('[AUTH FLOW] Checking for active open shift...')
        const openShifts = await executeQuery(`
          SELECT * FROM shifts WHERE status = 'open' LIMIT 1;
        `)

        console.log(`[AUTH FLOW] Open shifts query complete. Found: ${openShifts.length}`)
        setIsLocked(false) // Unlock the screen layout
        if (user.role === 'cashier') {
          setCurrentView('pos')
        }
        if (openShifts.length > 0) {
          console.log(`[AUTH FLOW] Resuming open shift: ${JSON.stringify(openShifts[0])}`)
          setCurrentShift(openShifts[0])
          playSound('success')
        } else {
          if (user.role === 'cashier') {
            console.log('[AUTH FLOW] Cashier logging in without shift. Prompting to open shift with prefilled handoff cash.')
            try {
              // نظام التوريد الجديد: العهدة دايمًا 200 ج.م
              setStartingCash('200')
            } catch (e) {
              setStartingCash('200')
            }
            setOpenShiftModal(true)
          } else {
            console.log('[AUTH FLOW] Admin/Manager logging in without shift. Bypassing shift prompt.')
            playSound('success')
          }
        }
      } else {
        console.warn(`[AUTH FLOW] Authentication failed. No user found with password_hash = '${escapedPin}'`)
        playSound('error')
        triggerCustomAlert('رمز الدخول خاطئ، يرجى المحاولة مرة أخرى.')
        setPin('')
      }
    } catch (err) {
      console.error('[AUTH FLOW] Critical exception caught during login:', err)
      triggerCustomAlert('خطأ في قاعدة البيانات: ' + getFriendlyErrorMessage(err))
      playSound('error')
    }
  }

  // Open Shift
  const handleStartShift = async () => {
    const startingCashNum = parseFloat(startingCash) || 0
    if (startingCashNum < 0) return

    try {
      const nowStr = getNowStr()
      await executeQuery(`
        INSERT INTO shifts (user_id, start_time, initial_cash, expected_end_cash, actual_end_cash, status)
        VALUES (${currentUser.id}, '${nowStr}', ${startingCashNum}, ${startingCashNum}, 0, 'open');
      `)

      const latestShift = await executeQuery(`
        SELECT * FROM shifts WHERE user_id = ${currentUser.id} AND status = 'open' ORDER BY id DESC LIMIT 1;
      `)

      if (latestShift.length > 0) {
        await logEvent({
          userId: currentUser.id,
          username: currentUser.username,
          actionType: 'shift_open',
          description: `فتح وردية جديدة بمبلغ بداية ${startingCashNum.toFixed(2)} ج.م`
        })
        setCurrentShift(latestShift[0])
        setOpenShiftModal(false)
        setIsLocked(false)
        playSound('chime')
      }
    } catch (e) {
      console.error('Failed to open shift:', e)
      playSound('error')
    }
  }

  // Close Active Shift
  const handleConfirmCloseShift = async () => {
    const actual = parseFloat(actualEndCash) || 0
    if (isNaN(actual) || actual < 0) {
      triggerCustomAlert('الرجاء إدخال مبلغ صحيح.')
      return
    }

    try {
      const combinedRes = await executeQuery(`
        SELECT 
          (SELECT IFNULL(SUM(COALESCE(NULLIF(original_amount, 0), total_amount)), 0) FROM sales WHERE shift_id = ${currentShift.id} AND payment_type = 'نقدي') as salesTotal,
          (SELECT IFNULL(SUM(amount), 0) FROM safe_ledger WHERE shift_id = ${currentShift.id} AND type = 'inflow') as repayTotal,
          (SELECT IFNULL(SUM(amount), 0) FROM safe_ledger WHERE shift_id = ${currentShift.id} AND type = 'outflow') as refundTotal;
      `)

      const salesTotal   = parseFloat(combinedRes[0]?.salesTotal)  || 0
      const repayTotal   = parseFloat(combinedRes[0]?.repayTotal)  || 0
      const refundTotal  = parseFloat(combinedRes[0]?.refundTotal) || 0
      const expected = currentShift.initial_cash + salesTotal + repayTotal - refundTotal
      const difference = actual - expected
      const nowStr = getNowStr()

      const finalizeShiftClose = async () => {
        try {
          await executeQuery(`
            UPDATE shifts 
            SET end_time = '${nowStr}', expected_end_cash = ${expected}, actual_end_cash = ${actual}, difference = ${difference}, status = 'closed'
            WHERE id = ${currentShift.id};
          `)
          await logEvent({
            userId: currentUser?.id,
            username: currentUser?.username,
            actionType: 'shift_close',
            description: `إغلاق الوردية رقم #${currentShift.id} (الفعلي: ${actual.toFixed(2)} ج.م، المتوقع: ${expected.toFixed(2)} ج.م، الفرق: ${difference.toFixed(2)} ج.م)`
          })
          playSound('chime')
          handleLock()
          setCloseShiftModal(false)
        } catch (e) {
          console.error('Failed to close shift in DB:', e)
          playSound('error')
        }
      }

      // Prompt for database backup
      triggerCustomConfirm(
        'هل تريد أخذ نسخة احتياطية من قاعدة البيانات الآن قبل إغلاق الوردية؟',
        async () => {
          if (window.api && window.api.db && window.api.db.backup) {
            const backupRes = await window.api.db.backup()
            if (backupRes && backupRes.success) {
              await logEvent({
                userId: currentUser?.id,
                username: currentUser?.username,
                actionType: 'database_backup',
                description: `أخذ نسخة احتياطية من قاعدة البيانات بنجاح في: ${backupRes.filePath}`
              })
              triggerCustomAlert(`تم حفظ النسخة الاحتياطية بنجاح في:\n${backupRes.filePath}`, 'نجاح النسخ الاحتياطي', async () => {
                await finalizeShiftClose()
              })
            } else if (backupRes && backupRes.error && backupRes.error !== 'User cancelled') {
              triggerCustomAlert(`فشل حفظ النسخة الاحتياطية: ${backupRes.error}`, 'فشل النسخ الاحتياطي', async () => {
                await finalizeShiftClose()
              })
            } else {
              await finalizeShiftClose()
            }
          } else {
            triggerCustomAlert('خاصية النسخ الاحتياطي غير متوفرة في هذه البيئة.', 'تنبيه', async () => {
              await finalizeShiftClose()
            })
          }
        },
        async () => {
          await finalizeShiftClose()
        }
      )
    } catch (e) {
      console.error('Failed to close shift:', e)
      playSound('error')
    }
  }

  // Handle Barcode Scanner Form Submit
  const handleBarcodeSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!barcodeInput) return

    let rawInput = barcodeInput.trim()
    let parsed = parseScaleBarcode(rawInput)
    try {
      let product = null

      const lookupProduct = async (p) => {
        if (p.isWeighted) {
          const code = p.barcode
          const products = await executeQuery(`
            SELECT * FROM products 
            WHERE barcode = '${code}' OR barcode = '${code.replace(/^0+/, '')}' 
            LIMIT 1;
          `)
          return products.length > 0 ? { ...products[0], forcedQty: p.qty } : null
        } else {
          const products = await executeQuery(`
            SELECT * FROM products WHERE barcode = '${escapeSql(p.barcode)}' LIMIT 1;
          `)
          return products.length > 0 ? products[0] : null
        }
      }

      product = await lookupProduct(parsed)

      if (!product && !parsed.isWeighted && rawInput.length >= 6 && rawInput.length <= 12) {
        const escaped = escapeSql(rawInput)
        const candidates = await executeQuery(`
          SELECT * FROM products
          WHERE barcode LIKE '%${escaped}'
          LIMIT 5;
        `)
        if (candidates.length === 1) {
          product = candidates[0]
        } else if (candidates.length > 1) {
          setSearchResults(candidates)
          setBarcodeInput('')
          return
        }
      }

      if (product) {
        addToCart(product, product.forcedQty)
        setBarcodeInput('')
      } else {
        const missingBarcode = rawInput
        setBarcodeInput('')
        playSound('error')
        setToastMessage({
          text: `رمز الباركود (${missingBarcode}) غير مسجل في قاعدة البيانات!`,
          type: 'error'
        })
        setTimeout(() => setToastMessage(null), 4000)
      }
    } catch (err) {
      console.error('Barcode lookup error:', err)
      playSound('error')
    }
  }

  // Manager Authentication
  const handleManagerAuthSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!managerPin) return

    try {
      const escapedPin = escapeSql(managerPin)
      let managers = await executeQuery(`
        SELECT * FROM users
        WHERE password_hash = '${escapedPin}' AND role = 'admin'
        LIMIT 1;
      `)

      if (managers.length > 0) {
        playSound('success')
        if (pendingAction.type === 'DELETE_ITEM') {
          setCart(prev => prev.filter(item => item.barcode !== pendingAction.payload))
        } else if (pendingAction.type === 'QTY_REDUCTION') {
          updateQty(pendingAction.payload.barcode, pendingAction.payload.qty)
        } else if (pendingAction.type === 'CLEAR_CART') {
          setCart([])
          setDiscount(0)
          setPaidAmount('')
        }
        setManagerApprovalModal(false)
        setPendingAction(null)
      } else {
        playSound('error')
        triggerCustomAlert('رمز التحقق للمشرف غير صحيح! العملية مرفوضة.')
        setManagerPin('')
      }
    } catch (err) {
      console.error('Manager auth error:', err)
      playSound('error')
    }
  }

  // Instant catalog search
  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchInput(val)
    setSelectedSearchIndex(-1)

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    if (!val.trim()) {
      setSearchResults([])
      return
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const escaped = escapeSql(val)
        const results = await executeQuery(`
          SELECT * FROM products 
          WHERE name LIKE '%${escaped}%' OR barcode LIKE '%${escaped}%'
          LIMIT 8;
        `)
        setSearchResults(results)
      } catch (err) {
        console.error('Search query error:', err)
      }
    }, 150)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setSearchInput('')
      setSearchResults([])
      setSelectedSearchIndex(-1)
      barcodeInputRef.current?.focus()
      return
    }

    if (searchResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSearchIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSearchIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const targetItem = (selectedSearchIndex >= 0 && selectedSearchIndex < searchResults.length)
        ? searchResults[selectedSearchIndex]
        : searchResults[0]
      if (targetItem) {
        addToCart(targetItem)
        setSearchInput('')
        setSearchResults([])
        setSelectedSearchIndex(-1)
        barcodeInputRef.current?.focus()
      }
    }
  }

  // Checkout Receipt generator & DB commit
  const handleCheckout = async () => {
    if (cart.length === 0) {
      playSound('error')
      triggerCustomAlert('السلة فارغة! يرجى إضافة سلع أولاً.', 'تنبيه الفاتورة')
      return
    }

    if (!currentShift) {
      playSound('error')
      triggerCustomAlert('لا توجد وردية كاشير مفتوحة!', 'تنبيه الوردية')
      return
    }

    try {
      const nowStr = getNowStr()
      const finalDiscount = parseFloat(discount) || 0

      let clientId = null
      if (clientName) {
        if (selectedClient) {
          clientId = selectedClient.id
        } else {
          const searchQ = clientPhone 
            ? `SELECT * FROM clients WHERE name = '${escapeSql(clientName)}' OR phone = '${escapeSql(clientPhone)}' LIMIT 1;`
            : `SELECT * FROM clients WHERE name = '${escapeSql(clientName)}' LIMIT 1;`
          const existing = await executeQuery(searchQ)
          if (existing && existing.length > 0) {
            clientId = existing[0].id
          } else {
            const phoneForInsert = clientPhone && clientPhone.trim() ? `'${escapeSql(clientPhone.trim())}'` : 'NULL'
            await executeQuery(`
              INSERT INTO clients (name, phone, address, debt_balance, points, created_at)
              VALUES ('${escapeSql(clientName)}', ${phoneForInsert}, '${escapeSql(clientAddress)}', 0.0, 0, '${nowStr}');
            `)
            const newClientRes = await executeQuery(`SELECT MAX(id) as id FROM clients;`)
            clientId = newClientRes?.[0]?.id || null
          }
        }
      }

      const pointsEarned = clientId ? Math.floor(cartTotal / 100) : 0

      let clientDbValue = clientName
      if (clientName) {
        if (clientPhone) clientDbValue += ` (${clientPhone})`
        if (isDelivery && clientAddress) clientDbValue += ` - ${clientAddress}`
      }

      let sqlQuery = 'BEGIN TRANSACTION;\n'
      sqlQuery += `INSERT INTO sales (shift_id, timestamp, total_amount, original_amount, discount, payment_type, client_name, client_id) VALUES (${currentShift.id}, '${nowStr}', ${cartTotal}, ${cartSubtotal || cartTotal}, ${finalDiscount}, '${paymentType}', '${escapeSql(clientDbValue)}', ${clientId || 'NULL'});\n`
      
      cart.forEach((item) => {
        sqlQuery += `INSERT INTO sale_items (sale_id, product_barcode, quantity, unit_price, total_price, cost_price) VALUES ((SELECT MAX(id) FROM sales), '${escapeSql(item.barcode)}', ${item.qty}, ${item.price}, ${item.total}, ${item.cost_price || 0.0});\n`
        sqlQuery += `UPDATE products SET stock_qty = stock_qty - ${item.qty} WHERE barcode = '${escapeSql(item.barcode)}';\n`
      })

      if (clientId) {
        sqlQuery += `UPDATE clients SET points = points + ${pointsEarned} WHERE id = ${clientId};\n`
        if (paymentType === 'آجل') {
          sqlQuery += `UPDATE clients SET debt_balance = debt_balance + ${cartTotal} WHERE id = ${clientId};\n`
          sqlQuery += `INSERT INTO client_ledger (client_id, type, amount, description, timestamp) VALUES (${clientId}, 'sale', ${cartTotal}, 'شراء آجل فاتورة رقم #' || (SELECT MAX(id) FROM sales), '${nowStr}');\n`
        }
        
        // استهلاك الرصيد كخصم (إذا تم استخدامه)
        if (parseFloat(appliedCredit) > 0) {
          sqlQuery += `UPDATE clients SET debt_balance = debt_balance + ${parseFloat(appliedCredit)} WHERE id = ${clientId};\n`
          sqlQuery += `INSERT INTO client_ledger (client_id, type, amount, description, timestamp) VALUES (${clientId}, 'sale', ${parseFloat(appliedCredit)}, 'استهلاك رصيد كخصم في فاتورة رقم #' || (SELECT MAX(id) FROM sales), '${nowStr}');\n`
        }

        // حفظ الباقي في رصيد العميل (إذا تم تحديده والـ paidAmount أكبر من الصافي)
        const changeVal = paidAmount ? Math.max(0, (parseFloat(paidAmount) || 0) - cartTotal) : 0
        const depositVal = Math.min(parseFloat(depositChange) || 0, changeVal)
        if (depositVal > 0) {
          sqlQuery += `UPDATE clients SET debt_balance = debt_balance - ${depositVal} WHERE id = ${clientId};\n`
          sqlQuery += `INSERT INTO client_ledger (client_id, type, amount, description, timestamp) VALUES (${clientId}, 'payment', ${depositVal}, 'حفظ الباقي نقدي رصيد في فاتورة رقم #' || (SELECT MAX(id) FROM sales), '${nowStr}');\n`
        }
      }

      sqlQuery += 'COMMIT;\n'
      await executeQuery(sqlQuery)

      await logEvent({
        userId: currentUser?.id,
        username: currentUser?.username,
        actionType: 'checkout_sale',
        description: `إتمام عملية بيع فاتورة بقيمة ${cartTotal.toFixed(2)} ج.م (طريقة الدفع: ${paymentType})`
      })

      const saleResult = await executeQuery(`SELECT id FROM sales ORDER BY id DESC LIMIT 1;`)
      const rawSaleId = (saleResult && saleResult.length > 0 && saleResult[0]) ? (saleResult[0].id || 0) : 0
      const displaySaleId = parseInt(rawSaleId) > 0 ? (((parseInt(rawSaleId) - 1) % 10000) + 1) : '?'

      playSound('chime')

      const datePart = new Date().toLocaleDateString('ar-EG')
      const timePart = new Date().toLocaleTimeString('ar-EG')

      const receiptHtml = generateReceiptHtml({
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
        changeRemaining: paidAmount ? Math.max(0, (parseFloat(paidAmount) || 0) - cartTotal) : 0
      })

      if (!noPrint && window.api && window.api.printer && window.api.printer.print) {
        console.log('[PRINT FLOW] Invoking printer.print with HTML content length:', receiptHtml.length, 'mode silent:', printSilent)
        window.api.printer.print(receiptHtml, { silent: printSilent })
          .then(() => console.log('[PRINT FLOW] Receipt printed successfully on Citizen CT-S300.'))
          .catch((e) => {
            console.error('[PRINT FLOW] Printing failed:', e)
            triggerCustomAlert(`تنبيه: فشلت عملية الطباعة المباشرة!\nالسبب: ${getFriendlyErrorMessage(e)}\nيرجى التحقق من اتصال الطابعة والتعريف.`)
          })
      }

      setToastMessage('تم إنهاء الفاتورة بنجاح!')
      setTimeout(() => setToastMessage(null), 3000)
      setCart([])
      setDiscount(0)
      setAppliedCredit(0)
      setDepositChange('')
      setPaidAmount('')
      setClientName('')
      setClientPhone('')
      setClientAddress('')
      setIsDelivery(false)
      setSelectedClient(null)
      setClientSearchResults([])
      setPaymentType('نقدي')
      fetchStats()
      fetchClientsList()
      fetchClientStats()
      if (fetchAdminData) {
        fetchAdminData().catch(e => console.error('Real-time admin sync failed:', e))
      }
      setTimeout(() => barcodeInputRef.current?.focus(), 100)
    } catch (e) {
      console.error('Checkout failed:', e)
      playSound('error')
      const msg = e.message || ''
      if (msg.includes('نفاد الكمية') || msg.includes('stock')) {
        triggerCustomAlert('فشل البيع: رصيد المخزون لا يكفي لأحد الأصناف في السلة.\nيرجى مراجعة الكميات المطلوبة أو تحديث المخزون.')
      } else if (msg.includes('وردية مغلقة') || msg.includes('closed')) {
        triggerCustomAlert('فشل البيع: الوردية مغلقة. يرجى فتح وردية جديدة.')
      } else {
        triggerCustomAlert('فشلت المعاملة، يرجى المحاولة مرة أخرى.')
      }
    }
  }

  // Reprint Sale
  const handleReprintSale = async (saleId) => {
    try {
      const sale = await executeQuery(`
        SELECT s.*, u.username 
        FROM sales s
        JOIN shifts sh ON s.shift_id = sh.id
        JOIN users u ON sh.user_id = u.id
        WHERE s.id = ${saleId} LIMIT 1;
      `)
      if (!sale || sale.length === 0) {
        triggerCustomAlert('لم يتم العثور على الفاتورة!')
        return
      }
      const s = sale[0]
      const items = await executeQuery(`
        SELECT si.*, p.name 
        FROM sale_items si
        LEFT JOIN products p ON si.product_barcode = p.barcode
        WHERE si.sale_id = ${saleId};
      `)

      const displaySaleId = parseInt(s.id) > 0 ? (((parseInt(s.id) - 1) % 10000) + 1) : '?'
      let clName = s.client_name || ''
      let clPhone = ''
      let clAddress = ''
      
      const phoneMatch = clName.match(/\((.*?)\)/)
      if (phoneMatch) {
        clPhone = phoneMatch[1]
        clName = clName.replace(/\(.*?\)/, '').trim()
      }
      const addressParts = clName.split(' - ')
      if (addressParts.length > 1) {
        clAddress = addressParts.slice(1).join(' - ').trim()
        clName = addressParts[0].trim()
      }

      let datePart = s.timestamp || ''
      let timePart = ''
      if (s.timestamp && s.timestamp.includes(' ')) {
        const parts = s.timestamp.split(' ')
        datePart = parts[0]
        timePart = parts.slice(1).join(' ')
      }

      const receiptHtml = generateReprintHtml({
        displaySaleId,
        datePart,
        timePart,
        s,
        clName,
        clPhone,
        clAddress,
        items
      })

      if (!noPrint && window.api && window.api.printer && window.api.printer.print) {
        window.api.printer.print(receiptHtml, { silent: printSilent })
          .then(() => console.log('Historical receipt printed successfully.'))
          .catch((e) => triggerCustomAlert(`فشلت الطباعة: ${getFriendlyErrorMessage(e)}`))
      } else {
        console.log(receiptHtml)
      }
    } catch (e) {
      triggerCustomAlert('حدث خطأ أثناء محاولة إعادة طباعة الفاتورة: ' + getFriendlyErrorMessage(e))
    }
  }

  // Client Autocomplete triggers
  const handleClientNameChange = async (val) => {
    setClientName(val)
    setSelectedClient(null)
    if (!val.trim()) {
      setClientSearchResults([])
      return
    }
    try {
      const results = await executeQuery(`
        SELECT * FROM clients 
        WHERE name LIKE '%${escapeSql(val)}%' OR phone LIKE '%${escapeSql(val)}%' 
        LIMIT 5;
      `)
      setClientSearchResults(results)
    } catch (e) {
      console.error(e)
    }
  }

  const handleClientPhoneChange = async (val) => {
    setClientPhone(val)
    setSelectedClient(null)
    if (!val.trim()) {
      setClientSearchResults([])
      return
    }
    try {
      const results = await executeQuery(`
        SELECT * FROM clients 
        WHERE phone LIKE '%${escapeSql(val)}%' OR name LIKE '%${escapeSql(val)}%' 
        LIMIT 5;
      `)
      setClientSearchResults(results)
    } catch (e) {
      console.error(e)
    }
  }

  const selectClient = (client) => {
    setSelectedClient(client)
    setClientName(client.name)
    setClientPhone(client.phone || '')
    setClientAddress(client.address || '')
    setClientSearchResults([])
  }

  return {
    pin,
    setPin,
    handlePinSubmit,
    handleStartShift,
    handleConfirmCloseShift,
    handleLock,
    barcodeInput,
    setBarcodeInput,
    handleBarcodeSubmit,
    searchInput,
    setSearchInput,
    handleSearchChange,
    handleSearchKeyDown,
    searchResults,
    setSearchResults,
    selectedSearchIndex,
    setSelectedSearchIndex,
    clientAddress,
    setClientAddress,
    selectedClient,
    setSelectedClient,
    clientSearchResults,
    setClientSearchResults,
    handleClientNameChange,
    handleClientPhoneChange,
    selectClient,
    handleManagerAuthSubmit,
    handleCheckout,
    handleReprintSale
  }
}
