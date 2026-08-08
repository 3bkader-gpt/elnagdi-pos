import React, { useState, useEffect } from 'react'
import { QrCode, Printer, X, Check, Copy, Receipt } from 'lucide-react'
import QRCode from 'qrcode'

export default function CustomerQRModal({ onClose, catalogUrl = 'https://elnagdi-pos.web.app/menu' }) {
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

  // Generate 100% offline QR code data URL
  useEffect(() => {
    QRCode.toDataURL(catalogUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }).then(url => {
      setQrDataUrl(url)
    }).catch(err => {
      console.error('QR Generation failed:', err)
    })
  }, [catalogUrl])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(catalogUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // 1. Print Thermal Receipt Ticket (on thermal printer)
  const handlePrintThermalReceipt = () => {
    if (!qrDataUrl) return

    const printHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كارت QR طابعة الفواتير</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@600;800;900&display=swap');
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Cairo', sans-serif;
            width: 72mm;
            margin: 0 auto;
            padding: 8px 0;
            text-align: center;
            color: #000;
            background: #fff;
          }
          .store-name {
            font-size: 16px;
            font-weight: 900;
            margin: 0;
          }
          .tagline {
            font-size: 11px;
            font-weight: 700;
            margin: 3px 0 6px 0;
          }
          .divider {
            border-top: 1.5px dashed #000;
            margin: 6px 0;
          }
          .qr-img {
            width: 52mm;
            height: 52mm;
            margin: 6px auto;
            display: block;
          }
          .msg {
            font-size: 11px;
            font-weight: 800;
            margin: 4px 0;
            line-height: 1.3;
          }
          .phone {
            font-size: 13px;
            font-weight: 900;
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="store-name">🏪 سوبر ماركت النجدي</div>
        <div class="tagline">📱 المنيو الرقمي وقائمة الأسعار</div>
        <div class="divider"></div>
        
        <img class="qr-img" src="${qrDataUrl}" alt="QR Code" />
        
        <div class="divider"></div>
        <div class="msg">📸 امسح الكود بموبايلك وشوف الأسعار واطلب دليفري فوراً!</div>
        <div class="phone">📞 دليفري: 01023100767</div>
        <div class="divider"></div>
      </body>
      </html>
    `

    const printWin = window.open('', '_blank')
    printWin.document.write(printHtml)
    printWin.document.close()
    setTimeout(() => {
      printWin.print()
    }, 400)
  }

  // 2. Print Counter Poster (A4)
  const handlePrintPoster = () => {
    if (!qrDataUrl) return

    const printHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>بوستر QR Code - سوبرماركت النجدي</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
          body {
            font-family: 'Cairo', sans-serif;
            margin: 0;
            padding: 40px 20px;
            background: #ffffff;
            color: #0f172a;
            text-align: center;
          }
          .poster-card {
            border: 8px solid #2563eb;
            border-radius: 24px;
            padding: 40px 30px;
            max-width: 480px;
            margin: 0 auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          }
          .logo-badge {
            font-size: 32px;
            margin-bottom: 5px;
          }
          h1 {
            font-size: 32px;
            margin: 0;
            color: #1e3a8a;
            font-weight: 900;
          }
          .slogan {
            font-size: 18px;
            color: #2563eb;
            font-weight: 700;
            margin: 10px 0 25px 0;
          }
          .qr-box {
            background: #f8fafc;
            border: 3px dashed #cbd5e1;
            padding: 20px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 25px;
          }
          .qr-box img {
            width: 220px;
            height: 220px;
            display: block;
          }
          .instructions {
            font-size: 16px;
            font-weight: 700;
            color: #334155;
            background: #eff6ff;
            padding: 12px 20px;
            border-radius: 12px;
            margin-bottom: 20px;
          }
          .delivery-info {
            font-size: 18px;
            font-weight: 800;
            color: #059669;
          }
        </style>
      </head>
      <body>
        <div class="poster-card">
          <div class="logo-badge">🏪</div>
          <h1>سوبر ماركت النجدي</h1>
          <div class="slogan">📱 قائمة الأسعار الرقمية التفاعلية</div>
          
          <div class="qr-box">
            <img src="${qrDataUrl}" alt="QR Code" />
          </div>

          <div class="instructions">
            📸 امسح الكود بموبايلك وشوف الأسعار واطلب دليفري فوراً!
          </div>

          <div class="delivery-info">
            📞 للطلبات والتوصيل السريع: 01023100767
          </div>
        </div>
      </body>
      </html>
    `

    const printWin = window.open('', '_blank')
    printWin.document.write(printHtml)
    printWin.document.close()
    setTimeout(() => {
      printWin.print()
    }, 400)
  }

  // 3. Print Small Delivery Bag Sticker Cards
  const handlePrintBagStickers = () => {
    if (!qrDataUrl) return

    const printHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>استيكرات الدليفري - سوبرماركت النجدي</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@600;800;900&display=swap');
          body {
            font-family: 'Cairo', sans-serif;
            margin: 0;
            padding: 15px;
            background: #fff;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .sticker {
            border: 2px solid #2563eb;
            border-radius: 12px;
            padding: 12px;
            text-align: center;
            display: flex;
            align-items: center;
            gap: 12px;
            page-break-inside: avoid;
          }
          .sticker img {
            width: 90px;
            height: 90px;
          }
          .sticker-info {
            text-align: right;
            flex: 1;
          }
          .sticker-info h3 {
            margin: 0;
            font-size: 14px;
            color: #1e3a8a;
          }
          .sticker-info p {
            margin: 3px 0;
            font-size: 11px;
            color: #2563eb;
            font-weight: 800;
          }
          .sticker-info .phone {
            font-size: 12px;
            color: #059669;
            font-weight: 900;
          }
        </style>
      </head>
      <body>
        <div class="grid">
          ${Array(8).fill(0).map(() => `
            <div class="sticker">
              <img src="${qrDataUrl}" alt="QR" />
              <div class="sticker-info">
                <h3>🏪 سوبرماركت النجدي</h3>
                <p>📸 امسح الكود وشوف الأسعار واطلب دليفري!</p>
                <div class="phone">📞 01023100767</div>
              </div>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `

    const printWin = window.open('', '_blank')
    printWin.document.write(printHtml)
    printWin.document.close()
    setTimeout(() => {
      printWin.print()
    }, 400)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px'
    }}>
      <div className="admin-card" style={{
        width: '100%',
        maxWidth: '480px',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <QrCode size={24} style={{ color: 'var(--accent-blue)' }} />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>📲 QR Code المنيو الرقمي للزباين</h3>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* QR Code Graphic Box */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(37, 99, 235, 0.1) 100%)',
          border: '2px dashed var(--accent-blue)',
          borderRadius: '16px',
          padding: '16px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt="Customer QR Code" 
              style={{ 
                width: '180px', 
                height: '180px', 
                borderRadius: '12px', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                background: '#fff',
                padding: '8px'
              }} 
            />
          ) : (
            <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '12px' }}>
              جاري إنشاء الكود...
            </div>
          )}
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-main)' }}>🏪 سوبر ماركت النجدي</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', marginTop: '2px' }}>📸 امسح الكود بالموبايل لعرض قائمة الأسعار والطلب</div>
          </div>
        </div>

        {/* Catalog Link Bar */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>الرابط:</span>
          <span style={{ flex: 1, fontSize: '0.8rem', fontFamily: 'monospace', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--accent-blue)' }}>
            {catalogUrl}
          </span>
          <button 
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleCopyLink}
            style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {copied ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
            {copied ? 'تم النسخ' : 'نسخ'}
          </button>
        </div>

        {/* Action Buttons for Printing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Thermal Receipt Printer Button */}
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handlePrintThermalReceipt}
            style={{ 
              padding: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              fontSize: '0.95rem',
              fontWeight: 'bold',
              backgroundColor: 'var(--accent-emerald)',
              borderColor: 'var(--accent-emerald)'
            }}
          >
            <Receipt size={20} />
            🧾 طباعة كارت QR على طابعة الفواتير (ورق الكاشير)
          </button>

          {/* Counter Poster A4 */}
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={handlePrintPoster}
            style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem' }}
          >
            <Printer size={16} />
            🖨️ طباعة بوستر الكاونتر والباب (A4)
          </button>

          {/* Bag Stickers 8 cards */}
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={handlePrintBagStickers}
            style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem' }}
          >
            <Printer size={16} />
            🏷️ طباعة استيكرات كروت لشنط الدليفري (8 كروت)
          </button>

        </div>

      </div>
    </div>
  )
}
