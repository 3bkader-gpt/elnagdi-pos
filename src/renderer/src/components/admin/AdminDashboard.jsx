import React from 'react'
import { ArrowRight } from 'lucide-react'
import StatsTab from './StatsTab'
import InventoryTab from './InventoryTab'
import ShiftsTab from './ShiftsTab'
import SalesTab from './SalesTab'
import ClientsTab from './ClientsTab'
import SuppliersTab from './SuppliersTab'
import ChecksTab from './ChecksTab'
import UsersTab from './UsersTab'
import ExpensesTab from './ExpensesTab'
import BestSellersTab from './BestSellersTab'
import BackupTab from './BackupTab'
import ReorderingTab from './ReorderingTab'
import DamagedGoodsTab from './DamagedGoodsTab'
import AdvancedStatsTab from './AdvancedStatsTab'
import CashierPerformanceTab from './CashierPerformanceTab'
import LogsTab from './LogsTab'
import TillsManagerTab from './TillsManagerTab'
import MonthlyReportsTab from './MonthlyReportsTab'

export default function AdminDashboard({
  currentUser,
  currentShift,
  triggerCustomAlert,
  triggerCustomConfirm,
  adminTab,
  setAdminTab,
  onOpenInterTillTransfer,
  
  // StatsTab props
  analytics,
  dbStats,
  statsPeriod,
  setStatsPeriod,
  periodicAnalytics,
  fetchAnalytics,

  // InventoryTab props
  adminSearch,
  adminSearchInputRef,
  adminProducts,
  adminTotalCount,
  adminPage,
  itemsPerPage,
  fetchInventoryPage,
  setAdminSearch,
  setShowAddModal,
  setEditProduct,
  setShowEditModal,
  handleDeleteProduct,
  productsSortField,
  productsSortAsc,

  // ShiftsTab props
  shiftsHistory,
  shiftAudits,
  fetchShiftsHistory,

  // SalesTab props
  salesSearch,
  setSalesSearch,
  salesHistory,
  selectedSale,
  selectSaleForDetail,
  selectedSaleItems,
  handleReturnEntireSale,
  handleReturnItem,
  fetchSalesHistory,
  salesSortField,
  salesSortAsc,
  salesPage,
  salesTotalCount,

  // SuppliersTab props
  setNewSupplierForm,
  setShowAddSupplierModal,
  suppliersSearch,
  setSuppliersSearch,
  fetchSuppliersList,
  suppliersList,
  fetchSupplierProfile,
  selectedSupplier,
  setNewPurchaseForm,
  setShowAddPurchaseModal,
  handleDeleteSupplier,
  handleSupplierRepay,
  supplierRepayAmount,
  setSupplierRepayAmount,
  supplierPurchases,
  supplierLedger,

  // ChecksTab props
  checksDueToday,
  setNewCheckForm,
  setShowAddCheckModal,
  checksList,
  handleMarkCheckPaid,
  handleDeleteCheck,
  fetchChecksList,
  fetchChecksDueToday,

  // UsersTab props
  setNewUser,
  setShowAddUserModal,
  usersList,
  setEditUser,
  setShowEditUserModal,
  handleDeleteUser,
  handleSystemReset,
  fetchUsersList,

  // ClientsTab props
  highestPointsCustomer,
  bestCustomerOfMonth,
  monthlyClientsReport,
  clientTopProducts,
  clientStats,
  selectedAdminClient,
  setSelectedAdminClient,
  handleRepayment,
  repaymentAmount,
  setRepaymentAmount,
  adminClientLedger,
  adminClientPurchases,
  handleReprintSale,
  setNewClientForm,
  setShowAddClientModal,
  clientsSearch,
  setClientsSearch,
  fetchClientsList,
  clientsList,
  selectAdminClientForProfile,
  setEditClientForm,
  setShowEditClientModal,
  handleDeleteClient,
  fetchClientStats,
  clientPeriodFilter,
  changeClientPeriodFilter,

  // ExpensesTab props
  expensesList,
  showAddExpenseModal,
  setShowAddExpenseModal,
  newExpenseForm,
  setNewExpenseForm,
  fetchExpensesList,
  handleAddExpense,
  handleDeleteExpense,

  // BestSellersTab props
  bsPeriod,
  setBsPeriod,
  bsTopSellers,
  bsSlowMovers,
  bsLoading,
  fetchBestSellers,

  // DamagedGoods props
  damagedGoodsList,
  showAddDamagedModal,
  setShowAddDamagedModal,
  newDamagedForm,
  setNewDamagedForm,
  fetchDamagedGoods,
  handleAddDamaged,
  handleDeleteDamaged
}) {
  const menuItems = [
    {
      id: 'stats',
      title: 'إحصائيات الأداء والربح',
      desc: 'عرض تقارير الإيرادات، الأرباح، والرسوم البيانية والملخص المالي.',
      icon: '📊',
      color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      action: () => {
        setAdminTab('stats')
        fetchAnalytics()
      }
    },
    {
      id: 'inventory',
      title: 'إدارة المخزن والسلع',
      desc: 'تعديل أسعار المنتجات، تتبع كميات المخزون والحد الأدنى للطلب.',
      icon: '📦',
      color: 'linear-gradient(135deg, #10b981, #047857)',
      action: () => {
        setAdminTab('inventory')
        setAdminSearch('')
        fetchInventoryPage(1, '')
      }
    },
    {
      id: 'shifts',
      title: 'سجل الورديات',
      desc: 'مراجعة الورديات المفتوحة والمغلقة، العجز والزيادة النقدية.',
      icon: '🕒',
      color: 'linear-gradient(135deg, #f59e0b, #b45309)',
      action: () => {
        setAdminTab('shifts')
        fetchShiftsHistory()
      }
    },
    {
      id: 'sales',
      title: 'سجل الفواتير والمرتجع',
      desc: 'البحث في فواتير البيع القديمة، وإجراء المرتجعات الكلية والجزئية.',
      icon: '🧾',
      color: 'linear-gradient(135deg, #ec4899, #be185d)',
      action: () => {
        setAdminTab('sales')
        fetchSalesHistory()
      }
    },
    {
      id: 'clients',
      title: 'الحسابات والعملاء',
      desc: 'إدارة حسابات الآجل للعملاء وسداد الديون ونقاط الولاء.',
      icon: '👥',
      color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      action: () => {
        setAdminTab('clients')
        fetchClientsList()
        fetchClientStats()
        setSelectedAdminClient(null)
      }
    },
    {
      id: 'suppliers',
      title: 'الموردون والمشتريات',
      desc: 'تسجيل فواتير الشراء، حسابات ديون الموردين، وإدارة المشتريات.',
      icon: '🏭',
      color: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      action: () => {
        setAdminTab('suppliers')
        fetchSuppliersList()
        setSelectedSupplier(null)
      }
    },
    {
      id: 'checks',
      title: 'سجل الشيكات',
      desc: 'متابعة الشيكات الصادرة والواردة وتواريخ استحقاقها.',
      icon: '🏦',
      color: 'linear-gradient(135deg, #14b8a6, #0f766e)',
      action: () => {
        setAdminTab('checks')
        fetchChecksList()
        fetchChecksDueToday()
      }
    },
    {
      id: 'expenses',
      title: 'المصاريف اليومية',
      desc: 'تسجيل المصروفات النثرية واليومية وتصنيف بنود الصرف.',
      icon: '💸',
      color: 'linear-gradient(135deg, #f43f5e, #e11d48)',
      action: () => {
        setAdminTab('expenses')
        fetchExpensesList()
      }
    },
    {
      id: 'damaged',
      title: 'إدارة التوالف والهوالك',
      desc: 'تسجيل البضائع التالفة مع خصمها تلقائياً من مخزون المحل.',
      icon: '⚠️',
      color: 'linear-gradient(135deg, #ef4444, #b91c1c)',
      action: () => {
        setAdminTab('damaged')
        fetchDamagedGoods()
      }
    },
    {
      id: 'bestsellers',
      title: 'تقرير المنتجات',
      desc: 'معرفة الأصناف الأكثر مبيعاً والأصناف الراكدة في المحل.',
      icon: '🏆',
      color: 'linear-gradient(135deg, #eab308, #a16207)',
      action: () => {
        setAdminTab('bestsellers')
        fetchBestSellers(bsPeriod)
      }
    },
    ...(currentUser && currentUser.role === 'admin' ? [{
      id: 'users',
      title: 'إدارة الكاشيرات',
      desc: 'إضافة وتعديل حسابات المستخدمين وصلاحيات الدخول للنظام.',
      icon: '👥',
      color: 'linear-gradient(135deg, #64748b, #475569)',
      action: () => {
        setAdminTab('users')
        fetchUsersList()
      }
    }] : []),
    {
      id: 'reordering',
      title: 'مساعد الطلبيات الذكي',
      desc: 'تنبيه ذكي بالبضائع التي قاربت على النفاد لإنشاء طلبيات شراء.',
      icon: '🤖',
      color: 'linear-gradient(135deg, #4f46e5, #3730a3)',
      action: () => {
        setAdminTab('reordering')
      }
    },
    {
      id: 'backup',
      title: 'النسخ الاحتياطي والأمان',
      desc: 'حفظ واستعادة قواعد البيانات بشكل آمن وإجراء فحوصات الأمان.',
      icon: '💾',
      color: 'linear-gradient(135deg, #059669, #065f46)',
      action: () => {
        setAdminTab('backup')
      }
    },
    {
      id: 'advanced-stats',
      title: 'التقارير والتحليلات المتقدمة',
      desc: 'تقارير مفصلة بفترة مخصصة: ذروة المبيعات، أداء الورديات، أفضل المنتجات، وملخص ذكي.',
      icon: '📈',
      color: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
      action: () => {
        setAdminTab('advanced-stats')
      }
    },
    {
      id: 'cashier-performance',
      title: 'تقييم أداء الكاشيرات',
      desc: 'لوحة ترتيب وتقييم شاملة لكل كاشير: درجة أداء، مقارنة بصرية، ملف تفصيلي، وتنبيهات ذكية.',
      icon: '⭐',
      color: 'linear-gradient(135deg, #f59e0b, #b45309)',
      action: () => {
        setAdminTab('cashier-performance')
      }
    },
    {
      id: 'monthly-reports',
      title: 'التقارير المالية الشهرية',
      desc: 'تقرير أداء شامل للشهر المالي المخصص (من يوم 6 إلى يوم 5) يشمل مبيعات الأدراج والخدمات وتصفية الكاشيرات.',
      icon: '📅',
      color: 'linear-gradient(135deg, #10b981, #059669)',
      action: () => {
        setAdminTab('monthly-reports')
      }
    },
    {
      id: 'logs',
      title: 'سجل العمليات (Event Log)',
      desc: 'عرض ومتابعة كافة العمليات الإدارية وأنشطة الكاشيرات والورديات والنسخ الاحتياطي بالتوقيت.',
      icon: '📋',
      color: 'linear-gradient(135deg, #4f46e5, #3730a3)',
      action: () => {
        setAdminTab('logs')
      }
    },
    ...(currentUser?.username !== 'سيف فايز' ? [{
      id: 'tills',
      title: 'الأدراج والتحويلات',
      desc: 'إدارة أجرية السوبر ماركت، مكنة ممكن، والمحافظ والتحويلات الرقمية للوردية.',
      icon: '💳',
      color: 'linear-gradient(135deg, #10b981, #3b82f6)',
      action: () => {
        setAdminTab('tills')
      }
    }] : [])
  ]

  return (
    <div className="admin-container">
      <div className="admin-header-row">
        {adminTab === 'menu' ? (
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>لوحة الإدارة والتحكم</h2>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="admin-back-btn" onClick={() => setAdminTab('menu')}>
              <ArrowRight size={18} />
              العودة إلى الأقسام الرئيسية
            </button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {adminTab === 'stats' && '📊 إحصائيات الأداء والربح'}
              {adminTab === 'inventory' && '📦 إدارة المخزن والسلع'}
              {adminTab === 'shifts' && '🕒 سجل الورديات'}
              {adminTab === 'sales' && '🧾 سجل الفواتير والمرتجع'}
              {adminTab === 'clients' && '👥 الحسابات والعملاء'}
              {adminTab === 'suppliers' && '🏭 الموردون والمشتريات'}
              {adminTab === 'checks' && '🏦 سجل الشيكات'}
              {adminTab === 'expenses' && '💸 المصاريف اليومية'}
              {adminTab === 'damaged' && '⚠️ إدارة التوالف والهوالك'}
              {adminTab === 'bestsellers' && '🏆 تقرير المنتجات'}
              {adminTab === 'users' && '👥 إدارة الكاشيرات'}
              {adminTab === 'reordering' && '🤖 مساعد الطلبيات الذكي'}
              {adminTab === 'backup' && '💾 النسخ الاحتياطي والأمان'}
              {adminTab === 'advanced-stats' && '📈 التقارير والتحليلات المتقدمة'}
              {adminTab === 'cashier-performance' && '⭐ تقييم أداء الكاشيرات'}
              {adminTab === 'monthly-reports' && '📅 التقارير المالية الشهرية'}
              {adminTab === 'logs' && '📋 سجل العمليات والأنشطة (Event Log)'}
              {adminTab === 'tills' && '💳 الأدراج والتحويلات الرقمية'}
            </h2>
          </div>
        )}
      </div>

      {adminTab === 'menu' && (
        <div className="admin-menu-grid">
          {menuItems.map(item => (
            <div key={item.id} className="admin-menu-card" onClick={item.action}>
              <div className="admin-menu-card-icon" style={{ background: item.color }}>
                {item.icon}
              </div>
              <div className="admin-menu-card-title">{item.title}</div>
              <div className="admin-menu-card-desc">{item.desc}</div>
              <div className="admin-menu-card-arrow">←</div>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'stats' && (
        <StatsTab
          analytics={analytics}
          dbStats={dbStats}
          statsPeriod={statsPeriod}
          setStatsPeriod={setStatsPeriod}
          periodicAnalytics={periodicAnalytics}
          fetchAnalytics={fetchAnalytics}
        />
      )}

      {adminTab === 'inventory' && (
        <InventoryTab
          adminSearch={adminSearch}
          adminSearchInputRef={adminSearchInputRef}
          adminProducts={adminProducts}
          adminTotalCount={adminTotalCount}
          adminPage={adminPage}
          itemsPerPage={itemsPerPage}
          fetchInventoryPage={fetchInventoryPage}
          setAdminSearch={setAdminSearch}
          setShowAddModal={setShowAddModal}
          setEditProduct={setEditProduct}
          setShowEditModal={setShowEditModal}
          handleDeleteProduct={handleDeleteProduct}
          productsSortField={productsSortField}
          productsSortAsc={productsSortAsc}
        />
      )}

      {adminTab === 'shifts' && (
        <ShiftsTab shiftsHistory={shiftsHistory} shiftAudits={shiftAudits} />
      )}

      {adminTab === 'sales' && (
        <SalesTab
          salesSearch={salesSearch}
          setSalesSearch={setSalesSearch}
          salesHistory={salesHistory}
          selectedSale={selectedSale}
          selectSaleForDetail={selectSaleForDetail}
          selectedSaleItems={selectedSaleItems}
          handleReturnEntireSale={handleReturnEntireSale}
          handleReturnItem={handleReturnItem}
          fetchSalesHistory={fetchSalesHistory}
          salesSortField={salesSortField}
          salesSortAsc={salesSortAsc}
          salesPage={salesPage}
          salesTotalCount={salesTotalCount}
          itemsPerPage={itemsPerPage}
          handleReprintSale={handleReprintSale}
        />
      )}

      {/* ===== SUPPLIERS TAB ===== */}
      {adminTab === 'suppliers' && (
        <SuppliersTab
          setNewSupplierForm={setNewSupplierForm}
          setShowAddSupplierModal={setShowAddSupplierModal}
          suppliersSearch={suppliersSearch}
          setSuppliersSearch={setSuppliersSearch}
          fetchSuppliersList={fetchSuppliersList}
          suppliersList={suppliersList}
          fetchSupplierProfile={fetchSupplierProfile}
          selectedSupplier={selectedSupplier}
          setNewPurchaseForm={setNewPurchaseForm}
          setShowAddPurchaseModal={setShowAddPurchaseModal}
          handleDeleteSupplier={handleDeleteSupplier}
          handleSupplierRepay={handleSupplierRepay}
          supplierRepayAmount={supplierRepayAmount}
          setSupplierRepayAmount={setSupplierRepayAmount}
          supplierPurchases={supplierPurchases}
          supplierLedger={supplierLedger}
        />
      )}

      {/* ===== CHECKS REGISTER TAB ===== */}
      {adminTab === 'checks' && (
        <ChecksTab
          checksDueToday={checksDueToday}
          setNewCheckForm={setNewCheckForm}
          setShowAddCheckModal={setShowAddCheckModal}
          checksList={checksList}
          handleMarkCheckPaid={handleMarkCheckPaid}
          handleDeleteCheck={handleDeleteCheck}
        />
      )}

      {/* ===== EXPENSES TAB ===== */}
      {adminTab === 'expenses' && (
        <ExpensesTab
          expensesList={expensesList}
          showAddExpenseModal={showAddExpenseModal}
          setShowAddExpenseModal={setShowAddExpenseModal}
          newExpenseForm={newExpenseForm}
          setNewExpenseForm={setNewExpenseForm}
          handleAddExpense={handleAddExpense}
          handleDeleteExpense={handleDeleteExpense}
          fetchExpensesList={fetchExpensesList}
        />
      )}

      {/* ===== BEST SELLERS / PRODUCT ANALYTICS TAB ===== */}
      {adminTab === 'bestsellers' && (
        <BestSellersTab
          bsPeriod={bsPeriod}
          setBsPeriod={setBsPeriod}
          bsTopSellers={bsTopSellers}
          bsSlowMovers={bsSlowMovers}
          bsLoading={bsLoading}
          fetchBestSellers={fetchBestSellers}
        />
      )}

      {adminTab === 'users' && currentUser && currentUser.role === 'admin' && (
        <UsersTab
          setNewUser={setNewUser}
          setShowAddUserModal={setShowAddUserModal}
          usersList={usersList}
          setEditUser={setEditUser}
          setShowEditUserModal={setShowEditUserModal}
          currentUser={currentUser}
          handleDeleteUser={handleDeleteUser}
          handleSystemReset={handleSystemReset}
        />
      )}

      {adminTab === 'clients' && (
        <ClientsTab
          highestPointsCustomer={highestPointsCustomer}
          bestCustomerOfMonth={bestCustomerOfMonth}
          monthlyClientsReport={monthlyClientsReport}
          clientTopProducts={clientTopProducts}
          clientStats={clientStats}
          clientPeriodFilter={clientPeriodFilter}
          changeClientPeriodFilter={changeClientPeriodFilter}
          selectedAdminClient={selectedAdminClient}
          handleRepayment={handleRepayment}
          repaymentAmount={repaymentAmount}
          setRepaymentAmount={setRepaymentAmount}
          adminClientLedger={adminClientLedger}
          adminClientPurchases={adminClientPurchases}
          handleReprintSale={handleReprintSale}
          setNewClientForm={setNewClientForm}
          setShowAddClientModal={setShowAddClientModal}
          clientsSearch={clientsSearch}
          setClientsSearch={setClientsSearch}
          fetchClientsList={fetchClientsList}
          clientsList={clientsList}
          selectAdminClientForProfile={selectAdminClientForProfile}
          setEditClientForm={setEditClientForm}
          setShowEditClientModal={setShowEditClientModal}
          handleDeleteClient={handleDeleteClient}
        />
      )}

      {adminTab === 'backup' && (
        <BackupTab />
      )}

      {adminTab === 'reordering' && (
        <ReorderingTab />
      )}

      {adminTab === 'advanced-stats' && (
        <AdvancedStatsTab />
      )}

      {adminTab === 'cashier-performance' && (
        <CashierPerformanceTab />
      )}

      {adminTab === 'monthly-reports' && (
        <MonthlyReportsTab />
      )}

      {adminTab === 'damaged' && (
        <DamagedGoodsTab
          damagedGoodsList={damagedGoodsList}
          showAddDamagedModal={showAddDamagedModal}
          setShowAddDamagedModal={setShowAddDamagedModal}
          newDamagedForm={newDamagedForm}
          setNewDamagedForm={setNewDamagedForm}
          fetchDamagedGoods={fetchDamagedGoods}
          handleAddDamaged={handleAddDamaged}
          handleDeleteDamaged={handleDeleteDamaged}
        />
      )}

      {adminTab === 'logs' && (
        <LogsTab />
      )}

      {adminTab === 'tills' && (
        <TillsManagerTab
          currentUser={currentUser}
          currentShift={currentShift}
          triggerCustomAlert={triggerCustomAlert}
          triggerCustomConfirm={triggerCustomConfirm}
          onOpenInterTillTransfer={onOpenInterTillTransfer}
        />
      )}
    </div>
  )
}
