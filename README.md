# 📈 Stock Advisor Pro

A professional stock trading advisor web application built with Next.js, featuring AI-powered insights, portfolio management, and beautiful animations - all in a pure black & white design.

![Stock Advisor Pro](https://img.shields.io/badge/Next.js-15.5.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-teal?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🔑 Core Functionality
- **User Authentication** - Secure login/signup with local storage
- **Portfolio Management** - Add, edit, and track stock holdings
- **AI-Powered Analysis** - Buy/Hold/Sell recommendations with confidence scores
- **Real-time Charts** - Interactive historical performance visualization
- **Stock Insights** - Detailed analysis with risk assessment
- **Smart Recommendations** - Curated stock picks with carousel interface
- **Comprehensive Reports** - Portfolio analytics with sector allocation

### 🎨 Design & UX
- **Monochrome Theme** - Pure black & white professional design
- **Smooth Animations** - Framer Motion powered transitions
- **Responsive Layout** - Mobile-first design approach
- **Interactive Cards** - Flip animations for stock insights
- **Glassmorphism UI** - Modern backdrop blur effects
- **Accessibility** - High contrast and readable fonts

### 🔔 Smart Features
- **Browser Notifications** - Trading alerts and recommendations
- **Local Data Storage** - IndexedDB for offline capability
- **Performance Tracking** - ROI calculations and progress bars
- **Risk Assessment** - Low/Medium/High risk indicators
- **Sector Analysis** - Portfolio diversification insights

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd stock-advisor-app

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Build optimized version
npm run build

# Start production server
npm start
```

## 🏗️ Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and animations
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main application entry
├── components/
│   ├── AuthForm.tsx         # Login/Signup form
│   ├── Dashboard.tsx        # Main dashboard container
│   ├── Header.tsx           # Navigation header
│   ├── PortfolioOverview.tsx # Portfolio metrics cards
│   ├── StockList.tsx        # Stock holdings with flip cards
│   ├── AddStockModal.tsx    # Add new stock modal
│   ├── StockInsights.tsx    # Detailed stock analysis
│   ├── Recommendations.tsx  # AI stock recommendations
│   └── Reports.tsx          # Analytics and reports
└── types/
    └── index.ts             # TypeScript type definitions
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Recharts** - Interactive charts and graphs
- **Lucide React** - Modern icon library

### Features
- **Local Storage** - User data persistence
- **Responsive Design** - Mobile and desktop optimized
- **Progressive Enhancement** - Works without JavaScript
- **SEO Optimized** - Meta tags and structured data

## 🎯 Usage Guide

### Getting Started
1. **Sign Up** - Create a new account with email/password
2. **Add Stocks** - Click "Add Stock" to input your holdings
3. **View Portfolio** - Monitor your investments on the dashboard
4. **Get Insights** - Click any stock card to flip and see AI recommendations
5. **Explore Reports** - Check the Reports tab for detailed analytics

### Navigation
- **Portfolio** - Overview of your holdings and performance
- **Insights** - Detailed analysis for individual stocks
- **Recommendations** - AI-curated stock picks
- **Reports** - Comprehensive portfolio analytics

### Stock Management
- **Add Holdings** - Ticker, purchase date, price, and quantity
- **Edit Positions** - Update existing stock information
- **View Analysis** - AI-powered Buy/Hold/Sell recommendations
- **Track Performance** - Real-time profit/loss calculations

## 🎨 Design System

### Colors
- **Primary**: Pure black (#000000)
- **Secondary**: Pure white (#FFFFFF)
- **Grays**: Various opacity levels for depth
- **Accents**: Green (gains), Red (losses), Yellow (warnings)

### Animations
- **Page Transitions** - Fade and slide effects
- **Card Interactions** - Hover and flip animations
- **Progress Bars** - Smooth fill animations
- **Loading States** - Rotating spinners

### Typography
- **Headings**: Bold system fonts
- **Body**: Regular weight for readability
- **Monospace**: For numerical data

## 📊 Features in Detail

### AI Analysis Engine
- **Sentiment Analysis** - Positive/Negative/Neutral market sentiment
- **Risk Assessment** - Low/Medium/High risk categorization
- **Confidence Scoring** - Percentage-based recommendation confidence
- **Price Targets** - AI-calculated target prices

### Portfolio Analytics
- **Performance Metrics** - Total return, ROI, and percentage gains
- **Sector Allocation** - Pie chart visualization of holdings
- **Historical Tracking** - Time-series performance data
- **Benchmark Comparison** - Relative performance analysis

### Notification System
- **Browser Alerts** - Native notification API integration
- **Trading Signals** - Buy/Hold/Sell action alerts
- **Performance Updates** - Significant gain/loss notifications
- **Market News** - Relevant stock-specific updates

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

### Environment Variables
Create a `.env.local` file for configuration:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=your_stock_api_key
```

### Extending the App
- **Add Stock APIs** - Integrate real-time stock data
- **Database Integration** - Replace localStorage with PostgreSQL/MongoDB
- **Authentication** - Add OAuth providers (Google, GitHub)
- **Real-time Updates** - WebSocket integration for live data
- **Mobile App** - React Native version using shared components

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Other Platforms
- **Netlify** - Static export compatible
- **Railway** - Full-stack deployment
- **Docker** - Containerized deployment

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions and support:
- 📧 Email: support@stockadvisorpro.com
- 💬 Discord: [Join our community](https://discord.gg/stockadvisor)
- 📖 Documentation: [docs.stockadvisorpro.com](https://docs.stockadvisorpro.com)

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
