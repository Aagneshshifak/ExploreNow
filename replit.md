# replit.md

## Overview

This is a full-stack tourism platform called "ExploreNow" built with React frontend and Express backend. The application provides comprehensive travel planning tools, hotel booking capabilities, and community features for travelers exploring India and international destinations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: React Router for client-side navigation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL sessions with connect-pg-simple
- **Development**: Hot module replacement with Vite middleware

### Design System
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Theme**: Apple-inspired design with travel-focused color palette
- **Responsive**: Mobile-first design with breakpoint-based layouts
- **Accessibility**: WCAG compliant components from Radix UI

## Key Components

### Core Pages
- **Landing Page**: Hero section with destination showcases
- **Trip Planner**: Interactive trip planning with budget and interest filters
- **Hotels**: Hotel search and booking with advanced filtering
- **Tools**: Comprehensive travel planning toolkit
- **Community**: User-generated content and trip sharing
- **Authentication**: Login/signup with user type differentiation

### Travel Tools Suite
- **Expenses Tracker**: Budget calculation and cost estimation
- **Expenses Differentiator**: Travel mode and route comparison
- **Visa Wizard**: Visa requirements checker
- **Travel DNA Quiz**: Personalized travel recommendations
- **Live Crowd Heatmaps**: Real-time crowd density information
- **Trip Compass**: Tinder-like destination discovery
- **Smart Trip Composer**: AI-powered itinerary generation
- **ExploreNow Pass**: Subscription-based premium features
- **Mood-Based Planner**: Emotion-driven travel suggestions

### Database Schema
- **Users Table**: Basic user authentication and profile data
- **Extensible Design**: Schema prepared for additional entities (bookings, hotels, reviews)

## Data Flow

### Client-Server Communication
1. React frontend makes API calls to Express backend
2. Backend processes requests and interacts with PostgreSQL database
3. Drizzle ORM handles database queries and migrations
4. TanStack Query manages client-side caching and synchronization

### Authentication Flow
- User registration/login through dedicated auth pages
- Session management via PostgreSQL-stored sessions
- User type differentiation (regular users vs. admin)

### Tool Integration
- Individual tool components with isolated state management
- Mock data and simulation for demonstration purposes
- Extensible architecture for real API integrations

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL provider
- **Connection**: Uses DATABASE_URL environment variable
- **ORM**: Drizzle with TypeScript support

### UI Components
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety across the entire stack
- **ESLint/Prettier**: Code quality and formatting

## Deployment Strategy

### Production Build
- Frontend: Vite builds optimized React bundle
- Backend: esbuild compiles TypeScript to JavaScript
- Static assets served from dist/public directory

### Environment Setup
- Development: Vite dev server with Express API
- Production: Node.js server serving static files and API

### Database Management
- Drizzle migrations in ./migrations directory
- Schema definitions in ./shared/schema.ts
- Push-based deployment with `npm run db:push`

## Changelog

```
Changelog:
- July 04, 2025. Initial setup
- July 04, 2025. Fixed navigation shortcuts and enhanced homepage
  - Fixed broken Plan Your Trip and Explore Hotels buttons with proper React Router navigation
  - Added new feature section with 4 cards: Plan Your Trip, Hotels & Stays, Smart Tools, Visa Enquiry
  - Implemented premium UI with glassmorphism cards, gradient backgrounds, hover animations
  - Added "Why Choose ExploreNow" section with feature highlights
  - All navigation uses proper Link components for seamless routing
- July 04, 2025. Added comprehensive database architecture
  - Created complete database schema with users, hotels, trips, bookings, reviews, and travel documents
  - Implemented DatabaseStorage class with full CRUD operations
  - Added API routes for authentication, hotels, trips, bookings, reviews, and travel tools
  - Schema includes proper relations and type safety with Drizzle ORM
  - Ready for DATABASE_URL environment variable configuration
- July 04, 2025. Migrated from Replit Agent to Replit environment
  - Successfully migrated project to run in standard Replit environment
  - Created PostgreSQL database with DATABASE_URL environment variable
  - Pushed database schema using Drizzle migrations
  - Application now connects to real PostgreSQL database instead of memory storage
  - All workflows properly configured and running on port 5000
- July 04, 2025. Added dual database support (PostgreSQL + MongoDB)
  - Installed MongoDB and Mongoose packages for document database support
  - Created MongoDB schemas with proper type definitions
  - Implemented MongoStorage class with full CRUD operations
  - Added intelligent database selection: MongoDB (if USE_MONGODB=true), PostgreSQL (default), or Memory (fallback)
  - Both databases work seamlessly with the same application interface
- July 04, 2025. Successfully connected to PostgreSQL database
  - Created PostgreSQL database with all environment variables (DATABASE_URL, PGHOST, etc.)
  - Populated database with comprehensive sample data (4 users, 5 hotels, 5 trip packages, 4 bookings, 5 reviews, 3 travel documents)
  - Application now uses PostgreSQL storage by default with automatic detection
  - All API endpoints working correctly with persistent data storage
  - Database contains complete sample data ready for testing and development
- July 04, 2025. Optimized application performance
  - Database: Optimized connection pooling with Neon configuration
  - Database: Created indexes on frequently queried fields for faster queries
  - API: Added compression middleware to reduce response sizes
  - API: Implemented in-memory caching for GET endpoints (5-minute TTL)
  - Frontend: Implemented lazy loading for all routes to improve initial load time
  - Monitoring: Added performance tracking middleware with /api/performance endpoint
  - Cleanup: Removed unused MongoDB and MySQL dependencies
- July 04, 2025. PostgreSQL database fully configured and operational
  - Fixed DATABASE_URL parsing to handle Neon database connection format
  - Successfully pushed database schema with all tables (users, hotels, trips, bookings, reviews, travel documents)
  - Populated database with comprehensive sample data (4 users, 5 hotels, 5 trip packages, 4 bookings, 5 reviews, 3 travel documents)
  - Application now uses PostgreSQL storage by default with real persistent data
  - Database connection properly handles environment variable cleanup and error handling
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```