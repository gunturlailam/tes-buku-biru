# Frontend Screenshots Checklist

Dokumentasi visual untuk ProfitAI Frontend. Ambil screenshots dari aplikasi yang sedang berjalan untuk dokumentasi dan demo.

## 📸 Authentication Flow

### 1. Login Page
- [ ] **Desktop view** (1920x1080)
  - Split layout dengan form & hero section
  - Demo credentials card visible
  - "Lupa Password?" link
  - "Belum punya akun?" link
  
- [ ] **Mobile view** (375x667)
  - Stacked layout (form di atas)
  - Responsive form fields
  - Touch-friendly buttons

**URL:** `http://localhost:3000/login`

---

### 2. Register Page
- [ ] **Desktop view**
  - Multi-section form (Informasi Bisnis)
  - Form validation visible
  - "Sudah punya akun?" link
  
- [ ] **Mobile view**
  - Scrollable form sections
  - Responsive inputs

**URL:** `http://localhost:3000/register`

---

### 3. Forgot Password
- [ ] **Email form state**
  - Email input with validation
  - "Kembali ke Login" link
  
- [ ] **Success state**
  - Success message with icon
  - Timer countdown (60s)
  - "Kirim ulang email" button

**URL:** `http://localhost:3000/forgot-password`

---

## 📊 Dashboard

### 4. Dashboard Overview
- [ ] **Desktop view - Full dashboard**
  - Sidebar navigation (expanded)
  - Top navbar with user profile
  - 3 KPI cards with sparklines
  - Health Score widget
  - Quick Actions grid
  
- [ ] **Desktop view - Collapsed sidebar**
  - Icon-only sidebar
  - More content space
  
- [ ] **Tablet view** (768px)
  - Responsive grid layout
  - Touch-friendly interactions
  
- [ ] **Mobile view** (375px)
  - Stacked KPI cards
  - Bottom navigation (if implemented)

**URL:** `http://localhost:3000/dashboard`

---

### 5. KPI Cards Detail
- [ ] **Revenue KPI Card**
  - Value: Rp 125,000,000
  - Trend: +15.5% (green)
  - Sparkline chart visible
  
- [ ] **Profit KPI Card**
  - Value: Rp 35,000,000
  - Trend: +8.2% (green)
  - Sparkline chart
  
- [ ] **Cash Flow KPI Card**
  - Value: Rp 42,500,000
  - Trend: +12.3% (green)
  - Sparkline chart

**Focus:** Close-up screenshots of individual cards

---

## 💰 Transactions

### 6. Transaction List
- [ ] **Desktop view - Table**
  - Full table with all columns
  - Search bar active
  - Filter dropdowns
  - Pagination visible
  - "Tambah Transaksi" button
  
- [ ] **Empty state**
  - Illustration visible
  - "Belum ada transaksi" message
  - "Tambah Transaksi Pertama" CTA
  
- [ ] **Mobile view**
  - Card-based layout (if implemented)
  - Simplified columns

**URL:** `http://localhost:3000/transactions`

---

### 7. Create Transaction
- [ ] **Desktop view - Form**
  - All form fields visible
  - Date picker
  - Category dropdown
  - Amount input with Rp formatting
  - Description textarea
  - "Simpan" & "Batal" buttons
  
- [ ] **Validation errors**
  - Required field errors
  - Invalid amount error
  - Form error summary

**URL:** `http://localhost:3000/transactions/new`

---

### 8. Edit Transaction
- [ ] **Desktop view - Prefilled form**
  - Form with existing data
  - All fields editable
  - Loading state (if applicable)
  
- [ ] **Success state**
  - Success alert/toast
  - Updated table

**URL:** `http://localhost:3000/transactions/[id]/edit`

---

## 🎨 UI Components Showcase

### 9. Component States
- [ ] **Buttons**
  - All variants (primary, secondary, outline, ghost)
  - All sizes (sm, default, lg)
  - Disabled state
  - Loading state
  
- [ ] **Alerts**
  - Info variant (blue)
  - Success variant (green)
  - Warning variant (yellow)
  - Error variant (red)
  
- [ ] **Badges**
  - Status badges (active, inactive, pending)
  - Data quality badges (high, medium, low)
  - Risk level badges
  
- [ ] **Loading States**
  - Spinner
  - Skeleton loaders
  - Loading cards

**Create:** `http://localhost:3000/components` (demo page - to be created)

---

## 🎯 Interaction States

### 10. Hover & Focus States
- [ ] **Navigation hover**
  - Sidebar menu items
  - Active page highlight
  
- [ ] **Button hover**
  - Color transitions
  - Scale effects
  
- [ ] **Input focus**
  - Border highlight (sage green)
  - Focus ring visible

---

### 11. Responsive Behavior
- [ ] **Breakpoint transitions**
  - Desktop → Tablet (1024px → 768px)
  - Tablet → Mobile (768px → 640px)
  - Mobile portrait → landscape

---

## 📐 Layout Tests

### 12. Sidebar Behavior
- [ ] **Expanded sidebar** (256px width)
  - Full menu labels
  - Logo visible
  - User section at bottom
  
- [ ] **Collapsed sidebar** (64px width)
  - Icon-only mode
  - Tooltip on hover
  - Compact logo

---

### 13. Navbar Components
- [ ] **User profile dropdown** (if implemented)
- [ ] **Notifications panel** (if implemented)
- [ ] **Search bar** (if implemented)

---

## 🎨 Design System

### 14. Color Palette
- [ ] **Primary colors**
  - Primary: #273420
  - Sand: #FAF7F2
  - Border: #EBE5DC
  - Sage: #8FA382
  - Blush: #EFAAA4
  
- [ ] **Typography**
  - Plus Jakarta Sans (headings, UI)
  - Cormorant Garamond (accents)

---

## 📋 Screenshot Naming Convention

Use this format for consistency:

```
[page]-[view]-[state].png

Examples:
- login-desktop-default.png
- login-mobile-validation-error.png
- dashboard-desktop-full.png
- dashboard-tablet-sidebar-collapsed.png
- transactions-list-desktop-empty.png
- transactions-create-desktop-form.png
- kpi-card-revenue-closeup.png
```

---

## 🛠️ Screenshot Tools

### Recommended Tools:
1. **Browser DevTools**
   - Chrome/Edge DevTools (F12)
   - Device toolbar (Ctrl+Shift+M)
   - Responsive mode
   
2. **Screenshot Extensions**
   - Full Page Screen Capture
   - Nimbus Screenshot
   - Awesome Screenshot

3. **Design Tools**
   - Figma (export frames)
   - Canva (add annotations)

---

## 📊 Progress Tracker

**Total Screenshots Needed:** 40+

- [ ] Authentication (8 screenshots)
- [ ] Dashboard (12 screenshots)
- [ ] Transactions (10 screenshots)
- [ ] Components (8 screenshots)
- [ ] Interactions (5 screenshots)

**Status:** 0/40 complete

---

## 📝 Notes

- Take screenshots in **incognito/private mode** for clean state
- Use **consistent browser** (Chrome recommended)
- **Disable browser extensions** that modify UI
- Use **demo data** consistently across screenshots
- **Hide personal information** if any
- Save in **PNG format** for quality
- Optimize size before committing (max 500KB per screenshot)

---

**Next Steps:**
1. ✅ Start development server (`npm run dev`)
2. ⬜ Open browser at `http://localhost:3000`
3. ⬜ Follow checklist and capture screenshots
4. ⬜ Save in `frontend/screenshots/` directory
5. ⬜ Update this checklist with ✅ as you complete each item

---

**Last Updated:** November 14, 2026
