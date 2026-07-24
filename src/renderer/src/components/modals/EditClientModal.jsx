import React from 'react'

const EditClientModal = ({
  showEditClientModal,
  setShowEditClientModal,
  editClientForm,
  setEditClientForm,
  handleEditClient
}) => {
  if (!showEditClientModal) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>تعديل بيانات العميل</h2>
          <p>تحديث بيانات العميل رقم #{editClientForm.id}</p>
        </div>
        <form onSubmit={handleEditClient} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label>اسم العميل *</label>
            <input 
              type="text" 
              className="form-input" 
              value={editClientForm.name}
              onChange={(e) => setEditClientForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>رقم الهاتف</label>
            <input 
              type="text" 
              className="form-input" 
              value={editClientForm.phone}
              onChange={(e) => setEditClientForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
            />
          </div>
          <div className="form-group">
            <label>عنوان التوصيل</label>
            <input 
              type="text" 
              className="form-input" 
              value={editClientForm.address}
              onChange={(e) => setEditClientForm(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditClientModal(false)}>
              إلغاء
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              تحديث البيانات
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditClientModal
