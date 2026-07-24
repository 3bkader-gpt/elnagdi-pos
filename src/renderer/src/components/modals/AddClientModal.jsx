import React from 'react'

const AddClientModal = ({
  showAddClientModal,
  setShowAddClientModal,
  newClientForm,
  setNewClientForm,
  handleAddClient
}) => {
  if (!showAddClientModal) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>إضافة عميل جديد</h2>
          <p>تسجيل عميل جديد وحساب مديونية ونقاط في النظام</p>
        </div>
        <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label>اسم العميل *</label>
            <input 
              type="text" 
              className="form-input" 
              value={newClientForm.name}
              onChange={(e) => setNewClientForm(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="مثال: محمد أحمد علي"
            />
          </div>
          <div className="form-group">
            <label>رقم الهاتف</label>
            <input 
              type="text" 
              className="form-input" 
              value={newClientForm.phone}
              onChange={(e) => setNewClientForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
              placeholder="مثال: 01012345678"
            />
          </div>
          <div className="form-group">
            <label>عنوان التوصيل</label>
            <input 
              type="text" 
              className="form-input" 
              value={newClientForm.address}
              onChange={(e) => setNewClientForm(prev => ({ ...prev, address: e.target.value }))}
              placeholder="مثال: الشروق، مجاورة 3"
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddClientModal(false)}>
              إلغاء
            </button>
            <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
              إضافة العميل
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddClientModal
