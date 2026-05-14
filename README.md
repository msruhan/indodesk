# Dreelio - Freelance Business Management Platform

A modern, beautiful SaaS platform for managing freelance businesses, inspired by the Dreelio Framer template.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **UI Components**: Custom components inspired by shadcn/ui

## ✨ Features

### Landing Page
- Animated hero section with floating elements
- Features showcase with icons and descriptions
- Benefits section with statistics
- Pricing plans (Free, Professional, Business)
- Customer testimonials
- Call-to-action sections
- Responsive navigation

### Dashboard
- Statistics cards with trends
- Revenue overview chart (Area chart)
- Service distribution chart (Pie chart)
- Active projects list with progress
- Activity feed
- Upcoming deadlines
- Collapsible sidebar navigation
- Search functionality

## 🏃 Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) to view the landing page

4. Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the dashboard

## 📁 Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── dashboard/
│   │   ├── activity-feed.tsx
│   │   ├── clients-chart.tsx
│   │   ├── header.tsx
│   │   ├── projects-list.tsx
│   │   ├── revenue-chart.tsx
│   │   ├── sidebar.tsx
│   │   ├── stats-cards.tsx
│   │   ├── upcoming-deadlines.tsx
│   │   └── index.ts
│   ├── landing/
│   │   ├── benefits.tsx
│   │   ├── cta.tsx
│   │   ├── features.tsx
│   │   ├── footer.tsx
│   │   ├── hero.tsx
│   │   ├── navbar.tsx
│   │   ├── pricing.tsx
│   │   ├── testimonials.tsx
│   │   └── index.ts
│   └── ui/
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
└── lib/
    └── utils.ts
```

## 🎨 Design Features

- Clean, enterprise-friendly aesthetic
- Gradient accents and mesh backgrounds
- Smooth animations and micro-interactions
- Responsive design for all screen sizes
- Dark sidebar option
- Custom color palette (Primary: Purple/Blue, Accent: Teal)

## 📝 License

MIT

