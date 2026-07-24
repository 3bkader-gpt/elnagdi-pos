import { useState, useEffect } from 'react'
import { executeQuery } from '../lib/db'
import { escapeSql } from '../lib/utils'

export function useSalesManager({ currentShift, fetchAdminData, triggerCustomAlert, triggerCustomConfirm }) {
  const [salesHistory, setSalesHistory] = useState([])
  const [salesSearch, setSalesSearch] = useState('')
  const [selectedSale, setSelectedSale] = useState(null)
  const [selectedSaleItems, setSelectedSaleItems] = useState([])
  const [salesSortField, setSalesSortField] = useState('id')
  const [salesSortAsc, setSalesSortAsc] = useState(false)

  // Database Migrations for Returns
  useEffect(() => {
    const runMigrations = async () => {
      console.log('[MIGRATION] Checking/Applying sales return migration...');
      try {
        await executeQuery('ALTER TABLE sale_items ADD COLUMN returned_qty REAL DEFAULT 0;')
        console.log('[MIGRATION] Column returned_qty added to sale_items');
      } catch (e) {
        console.log('[MIGRATION] Column returned_qty checked or already exists:', e.message);
      }
      try {
        await executeQuery('ALTER TABLE sales ADD COLUMN original_amount REAL DEFAULT 0;')
        console.log('[MIGRATION] Column original_amount added to sales');
        await executeQuery('UPDATE sales SET original_amount = total_amount WHERE original_amount = 0 OR original_amount IS NULL;')
        console.log('[MIGRATION] original_amount records updated');
      } catch (e) {
        console.log('[MIGRATION] Column original_amount checked or already exists:', e.message);
      }
    }
    runMigrations()
  }, [])

  const fetchSalesHistory = async (search = '', sortField = null, sortAsc = null) => {
    try {
      const activeSortField = sortField !== null ? sortField : salesSortField
      const activeSortAsc = sortAsc !== null ? sortAsc : salesSortAsc
      if (sortField !== null) setSalesSortField(sortField)
      if (sortAsc !== null) setSalesSortAsc(sortAsc)

      const escaped = escapeSql(search)
      let query = `
        SELECT s.*, u.username, 
               (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count 
        FROM sales s
        JOIN shifts sh ON s.shift_id = sh.id
        JOIN users u ON sh.user_id = u.id
      `
      if (escaped) {
        const cleanEsc = escaped.replace('#', '').trim()
        const isNumeric = /^\d+$/.test(cleanEsc)
        if (isNumeric) {
          query += ` WHERE s.id = ${cleanEsc} OR ((s.id - 1) % 10000 + 1) = ${cleanEsc} OR s.client_name LIKE '%${escaped}%' OR s.timestamp LIKE '%${escaped}%'`
        } else {
          query += ` WHERE s.client_name LIKE '%${escaped}%' OR s.timestamp LIKE '%${escaped}%'`
        }
      }

      let orderField = 's.id'
      if (activeSortField === 'invoice_number') orderField = 's.id'
      else if (activeSortField === 'timestamp') orderField = 's.timestamp'
      else if (activeSortField === 'client_name') orderField = 's.client_name'
      else if (activeSortField === 'total_amount') orderField = 's.total_amount'
      else if (activeSortField === 'items_count') orderField = 'items_count'
      else if (activeSortField === 'payment_type') orderField = 's.payment_type'

      query += ` ORDER BY ${orderField} ${activeSortAsc ? 'ASC' : 'DESC'} LIMIT 100;`
      const res = await executeQuery(query)
      setSalesHistory(res || [])
    } catch (e) {
      console.error('Failed to fetch sales history:', e)
    }
  }

  const selectSaleForDetail = async (sale) => {
    try {
      const items = await executeQuery(`
        SELECT si.*, p.name 
        FROM sale_items si
        LEFT JOIN products p ON si.product_barcode = p.barcode
        WHERE si.sale_id = ${sale.id};
      `)
      setSelectedSale(sale)
      setSelectedSaleItems(items || [])
    } catch (e) {
      console.error('Failed to load sale details:', e)
    }
  }

  const handleReturnItem = async (saleItem, returnQty) => {
    const qtyToReturn = parseFloat(returnQty) || 0
    const alreadyReturned = saleItem.returned_qty || 0
    const maxReturnable = saleItem.quantity - alreadyReturned

    if (qtyToReturn <= 0 || qtyToReturn > maxReturnable) {
      triggerCustomAlert(`الرجاء إدخال كمية مرتجع صحيحة (أكبر من 0 ولا تزيد عن المتبقي: ${maxReturnable}).`)
      return
    }

    triggerCustomConfirm(`هل أنت متأكد من رغبتك في إرجاع كمية ${qtyToReturn} من الصنف "${saleItem.name || saleItem.product_barcode}"؟`, async () => {
      try {
        let sql = 'BEGIN TRANSACTION;\n'
        sql += `UPDATE products SET stock_qty = stock_qty + ${qtyToReturn} WHERE barcode = '${escapeSql(saleItem.product_barcode)}';\n`
        
        // Update returned quantity and recalculate total_price for this item
        const newReturnedQty = alreadyReturned + qtyToReturn
        const newTotalPrice = (saleItem.quantity - newReturnedQty) * saleItem.unit_price
        sql += `UPDATE sale_items SET returned_qty = ${newReturnedQty}, total_price = ${newTotalPrice} WHERE id = ${saleItem.id};\n`
        
        // Update sales total_amount
        sql += `UPDATE sales SET total_amount = (SELECT IFNULL(SUM(total_price), 0) FROM sale_items WHERE sale_id = ${saleItem.sale_id}) - discount WHERE id = ${saleItem.sale_id};\n`
        
        const shiftId = currentShift ? currentShift.id : 'NULL'
        const refundAmount = qtyToReturn * saleItem.unit_price
        const nowStr = new Date().toLocaleString('ar-EG')
        
        if (selectedSale && selectedSale.payment_type === 'آجل' && selectedSale.client_id) {
          sql += `UPDATE clients SET debt_balance = debt_balance - ${refundAmount} WHERE id = ${selectedSale.client_id};\n`
          sql += `INSERT INTO client_ledger (client_id, type, amount, description, timestamp) VALUES (${selectedSale.client_id}, 'payment', ${refundAmount}, 'إرجاع صنف من فاتورة آجل #${selectedSale.id}', '${nowStr}');\n`
        } else {
          sql += `INSERT INTO safe_ledger (shift_id, type, amount, description, timestamp) VALUES (${shiftId}, 'outflow', ${refundAmount}, 'مرتجع صنف ${escapeSql(saleItem.name || saleItem.product_barcode)} (${qtyToReturn}) للفاتورة #${saleItem.sale_id}', '${nowStr}');\n`
        }
        
        sql += 'COMMIT;\n'

        await executeQuery(sql)
        triggerCustomAlert('تم إرجاع الصنف وتحديث المخزن بنجاح!')
        
        if (fetchAdminData) await fetchAdminData()
        
        // Reload details to show updated item returned status
        const details = await executeQuery(`
          SELECT s.*, u.username 
          FROM sales s
          JOIN shifts sh ON s.shift_id = sh.id
          JOIN users u ON sh.user_id = u.id
          WHERE s.id = ${saleItem.sale_id} LIMIT 1;
        `)
        if (details.length > 0) {
          await selectSaleForDetail(details[0])
        }
      } catch (e) {
        triggerCustomAlert('فشلت عملية الإرجاع: ' + e.message)
      }
    })
  }

  const handleReturnEntireSale = async (saleId) => {
    triggerCustomConfirm('هل أنت متأكد من رغبتك في إلغاء وإرجاع الفاتورة بالكامل؟ سيتم إعادة جميع الكميات إلى المخزن وتصفير قيمتها المتبقية.', async () => {
      try {
        const items = await executeQuery(`SELECT * FROM sale_items WHERE sale_id = ${saleId};`)
        
        let sql = 'BEGIN TRANSACTION;\n'
        items.forEach(item => {
          const remainingQty = item.quantity - (item.returned_qty || 0)
          if (remainingQty > 0) {
            sql += `UPDATE products SET stock_qty = stock_qty + ${remainingQty} WHERE barcode = '${escapeSql(item.product_barcode)}';\n`
          }
        })
        
        // Mark all items as fully returned and set their total price to 0
        sql += `UPDATE sale_items SET returned_qty = quantity, total_price = 0 WHERE sale_id = ${saleId};\n`
        sql += `UPDATE sales SET total_amount = 0 WHERE id = ${saleId};\n`
        
        const shiftId = currentShift ? currentShift.id : 'NULL'
        const refundAmount = selectedSale ? selectedSale.total_amount : 0
        const nowStr = new Date().toLocaleString('ar-EG')
        
        if (selectedSale && selectedSale.payment_type === 'آجل' && selectedSale.client_id) {
          sql += `UPDATE clients SET debt_balance = debt_balance - ${refundAmount} WHERE id = ${selectedSale.client_id};\n`
          sql += `INSERT INTO client_ledger (client_id, type, amount, description, timestamp) VALUES (${selectedSale.client_id}, 'payment', ${refundAmount}, 'إرجاع كامل فاتورة آجل #${selectedSale.id}', '${nowStr}');\n`
        } else {
          sql += `INSERT INTO safe_ledger (shift_id, type, amount, description, timestamp) VALUES (${shiftId}, 'outflow', ${refundAmount}, 'مرتجع كامل الفاتورة #${saleId}', '${nowStr}');\n`
        }
        
        sql += 'COMMIT;\n'

        await executeQuery(sql)
        triggerCustomAlert('تم إلغاء الفاتورة بالكامل وإرجاع كافة الأصناف للمخزن!')
        
        if (fetchAdminData) await fetchAdminData()
        
        // Reload details to show fully returned status
        const details = await executeQuery(`
          SELECT s.*, u.username 
          FROM sales s
          JOIN shifts sh ON s.shift_id = sh.id
          JOIN users u ON sh.user_id = u.id
          WHERE s.id = ${saleId} LIMIT 1;
        `)
        if (details.length > 0) {
          await selectSaleForDetail(details[0])
        }
      } catch (e) {
        triggerCustomAlert('فشل إرجاع الفاتورة بالكامل: ' + e.message)
      }
    })
  }

  return {
    salesHistory,
    setSalesHistory,
    salesSearch,
    setSalesSearch,
    selectedSale,
    setSelectedSale,
    selectedSaleItems,
    setSelectedSaleItems,
    salesSortField,
    salesSortAsc,
    fetchSalesHistory,
    selectSaleForDetail,
    handleReturnItem,
    handleReturnEntireSale
  }
}
