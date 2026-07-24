import React from 'react'

const AddSupplierModal = ({
  showAddSupplierModal,
  setShowAddSupplierModal,
  newSupplierForm,
  setNewSupplierForm,
  handleAddSupplier
}) => {
  if (!showAddSupplierModal) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <div className="modal-header"><h2>🏭 إضافة مورد جديد</h2></div>
        <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label>اسم المورد *</label>
            <input 
              className="form-input" 
              required 
              value={newSupplierForm.name} 
              onChange={e => setNewSupplierForm(p => ({ ...p, name: e.target.value }))} 
              placeholder="اسم المورد" 
            />
          </div>
          <div className="form-group">
            <label>رقم الهاتف</label>
            <input 
              className="form-input" 
              value={newSupplierForm.phone} 
              onChange={e => setNewSupplierForm(p => ({ ...p, phone: e.target.value }))} 
              placeholder="01xxxxxxxxx" 
            />
          </div>
          <div className="form-group">
            <label>العنوان</label>
            <input 
              className="form-input" 
              value={newSupplierForm.address} 
              onChange={e => setNewSupplierForm(p => ({ ...p, address: e.target.value }))} 
              placeholder="عنوان المورد" 
            />
          </div>
          <div className="form-group">
            <label>اسم المندوب</label>
            <input 
              className="form-input" 
              value={newSupplierForm.contact_person} 
              onChange={e => setNewSupplierForm(p => ({ ...p, contact_person: e.target.value }))} 
              placeholder="اسم المسؤول" 
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddSupplierModal(false)}>إلغاء</button>
            <button type="submit" className="btn btn-success" style={{ flex: 1 }}>إضافة المورد</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSupplierModal
