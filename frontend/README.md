# ProfitAI Frontend

Financial intelligence platform built with Next.js 14, TypeScript, and TailwindCSS.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **TanStack Query** - Server state management
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Zod** - Schema validation

## Project Structure

```
app/             Next.js pages and layouts
components/      Reusable UI components
features/        Feature-based modules
lib/             Core utilities and configurations
types/           TypeScript type definitions
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # Run ESLint
```
