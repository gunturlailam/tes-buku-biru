# ProfitAI Frontend

Modern financial intelligence dashboard for Indonesian SMEs built with Next.js 16, TypeScript, and TailwindCSS.

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** TailwindCSS 4.3.3
- **State Management:** React Query 5
- **Form Management:** React Hook Form + Zod
- **Charts:** Recharts 3
- **Icons:** Lucide React
- **HTTP Client:** Axios

## 🎨 Design System

### Color Palette

- **Primary:** `#273420` (Deep Forest Green)
- **Sand:** `#FAF7F2` (Warm Background)
- **Border:** `#EBE5DC` (Subtle Separation)
- **Sage:** `#8FA382` (Accent Green)
- **Blush:** `#EFAAA4` (Soft Alert)

### Typography

- **Sans:** Plus Jakarta Sans (Primary UI)
- **Serif:** Cormorant Garamond (Headings & Accents)

## 📁 Project Structure

```
frontend/
├── app/
│   ├── (auth)/          # Authentication routes
│   │   └── layout.tsx
│   ├── (dashboard)/     # Protected dashboard routes
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── reports/
│   │   ├── insights/
│   │   ├── recommendations/
│   │   └── settings/
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Entry redirect
├── components/
│   ├── ui/              # Reusable UI components (13+)
│   ├── layout/          # Sidebar, Navbar
│   ├── dashboard/       # Dashboard-specific
│   └── shared/          # Shared business components
├── lib/
│   └── utils.ts         # Utility functions
├── types/
│   └── financial.ts     # TypeScript definitions
└── public/
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

```
Email: demo@profitai.id
Password: demo123
```

## 🧪 Testing

```bash
# Run tests in watch mode
npm test

# Run tests once (CI)
npm run test:ci
```

## 🏗️ Build

```bash
npm run build
npm start
```

## 📦 Components

### UI Components (13+)

- **Button** - 4 variants (primary, secondary, outline, ghost), 3 sizes
- **Input** - With label, error states, and validation
- **Select** - Dropdown with custom styling
- **Textarea** - Multi-line input with auto-resize
- **Table** - Sortable with pagination support
- **Modal** - Accessible dialog with backdrop
- **Card** - Flexible container with header/body/footer
- **Badge** - Status indicators with color variants
- **Alert** - 4 variants (info, success, warning, error)
- **LoadingSpinner** - Animated loading indicator
- **Skeleton** - Content placeholders
- **EmptyState** - No data illustrations

### Layout Components

- **Sidebar** - Collapsible navigation with active states
- **Navbar** - User profile, notifications, search

### Dashboard Components

- **KPICard** - Metric cards with sparkline charts
- **DataQualityBadge** - Data quality indicators
- **RiskLevelBadge** - Risk level visualization

## 🎯 Features Implemented

### ✅ Phase 0: Foundation

- Design system with tokens
- Typography setup (Plus Jakarta Sans + Cormorant Garamond)
- Color palette (luxury fintech aesthetic)
- Responsive utilities

### ✅ Phase 1: Core UI

- App shell with sidebar & navbar
- 13+ reusable UI components
- Transaction CRUD (List, Create, Edit)
- Form validation with React Hook Form + Zod
- Loading, empty, error states
- Responsive design (mobile-first)

### ✅ Phase 2: Dashboard

- KPI cards with trend indicators
- Sparkline charts (revenue, profit, cash flow)
- Health score widget (data quality)
- Quick actions menu
- Period selector (MTD, QTD, YTD)

### ✅ Authentication

- Login page with split layout
- Registration with multi-step form
- Forgot password flow with email verification
- Demo credentials for testing

## 🔄 API Integration

Currently using mock data for development. To integrate with real backend:

1. **Update API client** in `lib/api.ts`
2. **Replace mock data** in page components
3. **Configure environment variables**:

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Example API integration:

```typescript
// Before (mock)
const transactions = mockTransactions;

// After (real API)
const { data: transactions } = useQuery({
  queryKey: ["transactions"],
  queryFn: () => api.get("/transactions"),
});
```

## 🎨 Styling Conventions

- **Utility-first:** Use Tailwind classes
- **Mobile-first:** Responsive breakpoints
- **Consistent spacing:** 4, 8, 12, 16, 24, 32, 48, 64px scale
- **Custom CSS:** Only in `globals.css` for global styles
- **Dark mode:** Ready (use `dark:` prefix)

## 🚦 State Management

- **Server State:** React Query for API data
- **Form State:** React Hook Form
- **UI State:** React hooks (useState, useReducer)
- **Global State:** Context API (if needed)

## 📱 Responsive Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

## 🔐 Authentication Flow

1. User visits `/` → Checks auth status
2. If not authenticated → Redirect to `/login`
3. Login successful → Redirect to `/dashboard`
4. Protected routes use `(dashboard)` route group
5. Token management (localStorage/cookies)

## 🤝 Coordination Points

### With Hanif (Frontend Partner)

Before modifying these shared files, coordinate:

- `app/layout.tsx` - Root layout
- `app/globals.css` - Global styles
- `lib/utils.ts` - Shared utilities
- Component boundaries (features vs shared)

### With Guntur (Backend Lead)

- API contract and endpoint structure
- Request/response schemas
- Error handling patterns
- Authentication flow

### With Risfiatul (Data Science)

- Metric definitions and terminology
- Data quality indicators
- Risk level calculations
- Chart data formats

## 📚 Scripts

```bash
npm run dev         # Start development server (port 3000)
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
npm test            # Run tests in watch mode
npm run test:ci     # Run tests once (CI/CD)
```

## 🐛 Known Issues

- Testing dependencies installation can be slow
- Mock data needs to be replaced with real API calls
- Token management not yet implemented (use demo credentials)

## 📚 Additional Documentation

- [Architecture](../docs/ARCHITECTURE.md)
- [API Contract](../docs/API_CONTRACT.md)
- [UI/UX Guidelines](../docs/UI_UX_GUIDELINES.md)
- [Team Workflow](../docs/TEAM_WORKFLOW.md)
- [Testing & QA](../docs/TESTING_QA.md)

---

**Owner:** Ronal (UI/UX Frontend Lead)  
**Status:** 95% Complete (MVP Ready)  
**Last Updated:** November 14, 2026
