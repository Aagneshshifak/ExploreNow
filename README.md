# ExploreNow - Travel Booking Platform

A modern travel booking platform built with React, TypeScript, Express, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your database credentials and API keys

# Push database schema
npm run db:push

# Seed the database (optional)
npm run seed

# Start development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Auth, Currency)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   └── lib/           # Utilities and GraphQL client
├── server/                # Express backend
│   ├── graphql/          # GraphQL schema and resolvers
│   ├── routes/           # REST API routes
│   └── services/         # Business logic services
├── shared/               # Shared types and schemas
├── documentation/        # Technical documentation
└── .kiro/specs/         # Feature specifications
```

## 🎯 Core Features

### User Features
- **Authentication**: JWT-based auth with session persistence
- **Trip Browsing**: Search and filter trips by location, price, duration
- **Hotel Booking**: Browse hotels with ratings and amenities
- **Booking Management**: Create and track bookings
- **AI Assistant**: Get travel recommendations using Groq AI
- **Currency Conversion**: View prices in 10+ currencies
- **User Preferences**: Persistent settings across devices
- **Bookmarks**: Save favorite trips and hotels

### Admin Features
- **Content Management**: Add/edit trips and hotels
- **Booking Dashboard**: View and manage all bookings
- **Analytics**: Track platform usage

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TanStack Query** for data fetching
- **React Router** for navigation
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **GraphQL** with Apollo Client

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **GraphQL Yoga** for GraphQL API
- **JWT** for authentication
- **Groq AI** for AI features

## 📚 Documentation

### Essential Documents
- **CHANGELOG.md**: Complete history of all changes and features (root level)
- **README.md**: This file - project overview and setup (root level)
- **QUICK_REFERENCE.md**: Common commands and troubleshooting (documentation/)

### Feature Specifications
Located in `.kiro/specs/`:
- **protected-routes-user-data**: Authentication and user data persistence
- **global-currency-conversion**: Multi-currency support system

### Technical Documentation
Located in `documentation/`:
- **FEATURES.md**: Complete feature list
- **FEATURE_STATUS.md**: Implementation status
- **AI_FEATURES_IMPLEMENTATION.md**: AI integration details
- **GRAPHQL_IMPLEMENTATION.md**: GraphQL API documentation
- **BOOK_NOW_FLOW.md**: Booking flow documentation
- **activity-log.md**: Development activity log
- **README.md**: Documentation index

## 🔑 Environment Variables

Required environment variables (see `env.example`):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/explorenow

# Authentication
JWT_SECRET=your-secret-key

# AI Services
GROQ_API_KEY=your-groq-api-key

# Email (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Database Management

```bash
# Push schema changes to database
npm run db:push

# Generate migrations
npm run db:generate

# Seed database with sample data
npm run seed

# Seed admin user
npm run seed:admin

# Seed bookings
npm run seed:bookings
```

## 🚢 Deployment

### Build for Production

```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Build the application
5. Start the server

## 🔐 Authentication Flow

1. User signs up or logs in
2. Server generates JWT token
3. Token stored in localStorage
4. Token sent with each API request
5. Protected routes verify token
6. Session persists across page reloads

## 💱 Currency System

The platform supports 10 currencies:
- USD, EUR, GBP, INR, JPY
- CAD, AUD, CHF, CNY, KRW

Currency preferences:
- Stored in user preferences (authenticated)
- Stored in localStorage (guest users)
- Real-time exchange rates from API
- Automatic conversion across all pages

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For issues or questions:
1. Check the documentation in `/documentation`
2. Review feature specs in `.kiro/specs`
3. Contact the development team

---

**Last Updated**: January 2026
