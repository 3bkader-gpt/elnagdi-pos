<div align="center">

# 🛒 Elnagdi POS: Retail Point of Sale Desktop System

### Production-Ready Supermarket POS & Inventory Management Desktop Application

[![Electron](https://img.shields.io/badge/Electron-30+-47848F.svg?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-Offline%20First-003B57.svg?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Typst](https://img.shields.io/badge/Engine-Typst%20Receipts-239DAD.svg)](https://typst.app/)
[![TailwindCSS](https://img.shields.io/badge/UI-Tailwind%20%26%20RTL-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Offline-First SQLite Architecture • Hardware Barcode Scanner Bridge • Typst Thermal Receipts • Native RTL Arabic UI**

[System Architecture](#-system-architecture) • [Key Capabilities](#-key-capabilities) • [Local Development](#-development--build) • [Production Packaging](#-production-packaging)

</div>

---

## 🎯 Overview

**Elnagdi POS** is a high-reliability desktop Point of Sale (POS) and store management system built for high-throughput commercial retail and grocery environments.

Engineered with an offline-first **Electron + Vite + React** architecture and local **SQLite** database storage, the system ensures zero downtime during internet outages. It features sub-millisecond barcode lookups, granular cashier shift accounting, low-stock threshold monitoring, and automated thermal receipt generation powered by the high-speed **Typst** document compiler.

---

## 🏗 System Architecture

```mermaid
flowchart TD
    Hardware["⚡ Hardware Peripherals<br/>(USB Barcode Scanner, Cash Drawer, ESC/POS Thermal Printer)"]
    
    subgraph Electron Native Main Process
        IPCMain["🔌 IPC Dispatcher & Security Bridge"]
        DBEngine["💾 SQLite 3 Native Engine (market_unified.db)"]
        TypstEngine["📄 Typst Document Compiler (Thermal Receipts & Shortage Reports)"]
        PrinterDriver["🖨️ ESC/POS Thermal Print Manager"]
    end
    
    subgraph React Renderer Process
        CashierUI["🖥️ Cashier Checkout & Item Grid (RTL Arabic)"]
        InventoryUI["📦 Inventory & Price Margin Manager"]
        ShiftUI["💵 Cashier Shift Auditing & Drawer Balances"]
        LockScreen["🔒 PIN Authentication & Role Controls"]
    end

    Hardware --> CashierUI
    CashierUI <-->|ContextBridge IPC| IPCMain
    InventoryUI <-->|ContextBridge IPC| IPCMain
    ShiftUI <-->|ContextBridge IPC| IPCMain
    LockScreen <-->|ContextBridge IPC| IPCMain
    
    IPCMain <--> DBEngine
    IPCMain --> TypstEngine
    TypstEngine --> PrinterDriver
    PrinterDriver --> Hardware
```

---

## 🌟 Key Capabilities

- ⚡ **High-Speed Checkout Engine:** Instant product lookup via USB/Bluetooth barcode scanners with automatic item aggregation and quantity calculation.
- 📴 **100% Offline-First Reliability:** Operates entirely locally using an embedded SQLite database engine; transactions and receipts continue uninterrupted during internet cuts.
- 📄 **Typst-Powered Thermal Receipts:** Generates pixel-perfect 80mm/58mm thermal receipts in milliseconds using the high-performance Typst typesetting engine.
- 💵 **Cashier Shift Reconciliation:** Strict cash drawer balance enforcement, beginning-of-shift floats, mid-shift withdrawals, and automated end-of-day X/Z audit reports.
- 📊 **Dynamic Inventory & Shortages:** Automatic inventory deduction upon checkout, custom cost-price tracking, and automatic shortage reports when items hit minimum thresholds.
- 🌍 **Native RTL Arabic User Experience:** Custom Arabic design tokens, ergonomic keyboard shortcuts (F1-F12), and touch-friendly interface layouts.
- 🔐 **Role-Based Security:** PIN-protected authorization for sensitive operations (cashier refunds, item deletions, manager discounts, and inventory edits).

---

## 💻 Development & Build

### Prerequisites
- **Node.js 18+** & **npm**
- Windows OS (for running pre-bundled `sqlite3.exe` and `typst.exe` binaries)

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/3bkader-gpt/elnagdi-pos.git
cd elnagdi-pos

# Install dependencies
npm install
```

### 2. Running in Development Mode
```bash
# Start Vite development server with Electron hot reload
npm run dev
```

---

## 📦 Production Packaging

Compile and build standalone installer packages:

```bash
# Package for Windows (.exe / NSIS Installer)
npm run build:win

# Build portable unpacked directory
npm run build:unpack
```

The output installers and portable binaries will be generated inside the `dist/` directory.

---

## 📄 License

This software is licensed under the [MIT License](LICENSE).
