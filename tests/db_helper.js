const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.join(__dirname, '..');
const sqlitePath = path.join(rootDir, 'sqlite3.exe');
const prodDbPath = path.join(process.env.APPDATA, 'elnagdi-pos', 'market_unified.db');
const testDbPath = path.join(__dirname, 'temp_test.db');

// Execute SQL queries on the test database
function executeSql(q) {
  return new Promise((resolve, reject) => {
    const child = spawn(sqlitePath, [testDbPath, '-json']);
    let out = '';
    let err = '';
    child.stdout.on('data', d => out += d.toString('utf8'));
    child.stderr.on('data', d => err += d.toString('utf8'));
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(err || `Exit code ${code}`));
      else resolve(out.trim() ? JSON.parse(out.trim()) : []);
    });
    // Prepend PRAGMA foreign_keys = ON; to enforce constraints during tests
    child.stdin.write(`PRAGMA foreign_keys = ON;\n${q}`);
    child.stdin.end();
  });
}

// Function to copy production db to test db
async function setupTestDb() {
  if (!fs.existsSync(prodDbPath)) {
    throw new Error(`Production database not found at ${prodDbPath}`);
  }
  fs.copyFileSync(prodDbPath, testDbPath);
  console.log(`[TEST DB] Copied production database to ${testDbPath}`);
  
  // Migrate sale_items table to ensure it has cost_price column in tests
  try {
    await executeSql(`ALTER TABLE sale_items ADD COLUMN cost_price REAL DEFAULT 0.0;`);
  } catch (e) { /* Ignore if already exists */ }
  
  // Register the new triggers on the test DB in a single SQL execution to prevent lockups
  await executeSql(`
    CREATE TRIGGER IF NOT EXISTS prevent_negative_stock
    BEFORE UPDATE OF stock_qty ON products
    FOR EACH ROW
    WHEN NEW.stock_qty < 0
    BEGIN
      SELECT RAISE(ROLLBACK, 'خطأ: لا يمكن أن تقل كمية المخزون عن صفر (نفاد الكمية).');
    END;

    CREATE TRIGGER IF NOT EXISTS prevent_sale_on_closed_shift
    BEFORE INSERT ON sales
    FOR EACH ROW
    WHEN (SELECT status FROM shifts WHERE id = NEW.shift_id) = 'closed'
    BEGIN
      SELECT RAISE(ROLLBACK, 'خطأ: لا يمكن تسجيل عملية بيع على وردية مغلقة.');
    END;

    CREATE TRIGGER IF NOT EXISTS prevent_multiple_open_shifts
    BEFORE INSERT ON shifts
    FOR EACH ROW
    WHEN NEW.status = 'open' AND (SELECT COUNT(*) FROM shifts WHERE user_id = NEW.user_id AND status = 'open') > 0
    BEGIN
      SELECT RAISE(ROLLBACK, 'خطأ: يوجد وردية مفتوحة بالفعل لهذا المستخدم.');
    END;
  `);
  console.log(`[TEST DB] Registered triggers (prevent_negative_stock, prevent_sale_on_closed_shift, prevent_multiple_open_shifts) on test DB.`);
}

// Function to clean up test db
function cleanupTestDb() {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
    console.log(`[TEST DB] Cleaned up temporary test database.`);
  }
}

module.exports = {
  setupTestDb,
  cleanupTestDb,
  executeSql,
  testDbPath
};
