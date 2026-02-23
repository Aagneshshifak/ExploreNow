# Quick Reference Guide

## 📂 Documentation Structure

### Root Level
- **README.md**: Main project documentation with setup instructions
- **CHANGELOG.md**: Complete history of all changes and features
- **env.example**: Template for environment variables

### Documentation Folder (`/documentation`)
- **FEATURES.md**: Complete list of platform features
- **FEATURE_STATUS.md**: Current implementation status
- **AI_FEATURES_IMPLEMENTATION.md**: AI integration details
- **GRAPHQL_IMPLEMENTATION.md**: GraphQL API documentation
- **BOOK_NOW_FLOW.md**: Booking system flow
- **activity-log.md**: Development activity history
- **QUICK_REFERENCE.md**: This file

### Specs Folder (`/.kiro/specs`)
- **protected-routes-user-data/**: Authentication and user data spec
- **global-currency-conversion/**: Currency system spec

## 🚀 Common Commands

### Development
```bash
npm run dev              # Start dev server (frontend + backend)
npm run build           # Build for production
npm start               # Start production server
```

### Database
```bash
npm run db:push         # Push schema to database
npm run db:generate     # Generate migrations
npm run seed            # Seed sample data
npm run seed:admin      # Create admin user
```

### Testing
```bash
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
```

## 🔗 Important URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **GraphQL Playground**: http://localhost:5000/graphql

## 📋 Key Features Status

### ✅ Completed
- User authentication (JWT)
- Trip and hotel browsing
- Booking system
- AI assistant (Groq)
- Currency conversion
- User preferences
- Bookmarks
- Protected routes
- Admin dashboard

### 🚧 In Progress
- Global currency conversion (spec created)

## 🗂️ Project Organization

### Frontend (`/client`)
```
client/src/
├── components/     # Reusable UI components
├── contexts/       # React contexts (Auth, Currency)
├── hooks/          # Custom hooks (useAuth, useBookmarks, etc.)
├── pages/          # Page components
├── lib/            # Utilities and GraphQL client
└── assets/         # Images and static files
```

### Backend (`/server`)
```
server/
├── graphql/        # GraphQL schema and resolvers
├── routes/         # REST API endpoints
├── services/       # Business logic (email, AI)
├── controllers/    # Request handlers
└── middleware.ts   # Auth and other middleware
```

### Shared (`/shared`)
```
shared/
└── schema.ts       # Database schema (Drizzle ORM)
```

## 🔐 Authentication

### User Roles
- **user**: Regular users (can book trips/hotels)
- **admin**: Administrators (can manage content)

### Protected Routes
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/book/:id` - Booking flow
- `/admin/*` - Admin pages

### Soft-Protected Routes (Blur Overlay)
- `/ai-assistant` - AI travel assistant
- `/book-now` - Quick booking page

## 💱 Currency System

### Supported Currencies
USD, EUR, GBP, INR, JPY, CAD, AUD, CHF, CNY, KRW

### Components
- **CurrencyContext**: Global currency state
- **CurrencySelector**: Currency picker UI
- **PriceDisplay**: Formatted price component

### Usage
```tsx
import { PriceDisplay } from '@/components/ui/price-display';

<PriceDisplay price={100} originalCurrency="USD" />
```

## 🤖 AI Features

### Groq Integration
- Travel recommendations
- Destination suggestions
- Trip planning assistance

### API Endpoint
```
POST /api/ai/chat
Body: { message: string }
```

## 📊 Database Schema

### Main Tables
- **users**: User accounts
- **trips**: Available trips
- **hotels**: Available hotels
- **bookings**: User bookings
- **user_preferences**: User settings
- **bookmarks**: Saved items

### Relationships
- User → Bookings (one-to-many)
- User → Preferences (one-to-one)
- User → Bookmarks (one-to-many)

## 🛠️ Tech Stack Summary

**Frontend**: React 18, TypeScript, Vite, TanStack Query, Tailwind CSS
**Backend**: Express, TypeScript, GraphQL Yoga, Drizzle ORM
**Database**: PostgreSQL
**AI**: Groq API
**Auth**: JWT

## 📝 Development Workflow

1. **Feature Planning**: Create spec in `.kiro/specs/`
2. **Implementation**: Follow tasks in `tasks.md`
3. **Testing**: Write unit and integration tests
4. **Documentation**: Update relevant docs
5. **Review**: Check against requirements
6. **Deploy**: Build and deploy to production

## 🔍 Troubleshooting

### Common Issues

**Database Connection Error**
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Run `npm run db:push`

**Authentication Not Working**
- Verify JWT_SECRET is set
- Check token in localStorage
- Clear browser cache

**AI Features Not Working**
- Verify GROQ_API_KEY is set
- Check API quota/limits
- Review server logs

**Currency Not Converting**
- Check exchange rate API
- Verify CurrencyContext is wrapping app
- Check browser console for errors

## 📞 Getting Help

1. Check this quick reference
2. Review feature specs in `.kiro/specs/`
3. Check detailed docs in `/documentation`
4. Review README.md for setup
5. Contact development team

---

**Last Updated**: January 2026
