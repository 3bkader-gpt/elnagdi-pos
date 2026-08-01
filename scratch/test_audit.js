const sqlite3 = require('E:/new_sys/alshorouk-pos/node_modules/better-sqlite3');
const db = new sqlite3('E:/new_sys/alshorouk-pos/AppData/Roaming/elnagdi-pos/market_unified.db');

try {
    const shift = db.prepare(`SELECT * FROM shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1`).get();
    console.log('Active Shift:', shift);
    
    if (shift) {
        console.log('Testing Audit Queries...');
        const grossRes = db.prepare(`SELECT IFNULL(SUM(total_amount), 0) as total FROM sales WHERE shift_id = ${shift.id};`).get();
        console.log('Gross Sales:', grossRes);
        
        const debtRes = db.prepare(`SELECT IFNULL(SUM(total_amount), 0) as total FROM sales WHERE shift_id = ${shift.id} AND payment_type = 'آجل';`).get();
        console.log('Debt Sales:', debtRes);
        
        const repayRes = db.prepare(`SELECT IFNULL(SUM(amount), 0) as total FROM safe_ledger WHERE shift_id = ${shift.id} AND type = 'inflow';`).get();
        console.log('Repay Inflows:', repayRes);
        
        const refundRes = db.prepare(`SELECT IFNULL(SUM(amount), 0) as total FROM safe_ledger WHERE shift_id = ${shift.id} AND type = 'outflow';`).get();
        console.log('Refund Outflows:', refundRes);
    }
} catch (e) {
    console.error('SQL Error:', e);
}
