# ExploreNow Travel Booking Platform

## Overview

ExploreNow is a comprehensive travel booking platform built with a modern full-stack architecture. The application serves as a complete travel solution allowing users to discover destinations, book trips and hotels, manage travel documents, and access various travel tools. The platform includes both user-facing features and administrative capabilities for content management.

The system is designed to handle trip planning, hotel booking, expense estimation, visa checking, and various travel utilities through an intuitive interface. It features role-based access control with separate user and admin experiences, comprehensive travel tools, and a responsive design system.

**Recent Major Update (August 2025)**: The backend has been completely expanded with a comprehensive travel booking system including JWT authentication, role-based permissions, PostgreSQL database integration, currency conversion, AI-ready endpoints, and booking analytics dashboard.

**Latest Features (August 2025)**:
- ✅ Real currency conversion API using exchangerate-api.com with live rates
- ✅ Comprehensive booking history analytics with spending trends and charts  
- ✅ Interactive user dashboard with booking data visualization using Recharts
- ✅ AI-powered trip recommender with intelligent filtering by budget and interests
- ✅ Route planner foundation for future trip optimization features
- ✅ Sample booking data for testing analytics (4 bookings worth $4,149.98)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
**Technology Stack**: React 18 with TypeScript, using Vite as the build tool and development server. The frontend employs a component-based architecture with React Router for client-side routing and TanStack Query for server state management.

**UI Framework**: Implements Shadcn/ui design system built on Radix UI primitives and Tailwind CSS. The design follows a premium monochrome aesthetic with CSS custom properties for theming. Components are organized in a modular structure with reusable UI components, page components, and custom hooks.

**State Management**: Uses React's built-in state management with custom hooks for authentication (`useAuth`) and toast notifications (`useToast`). TanStack Query handles server-side state caching and synchronization.

**Routing Strategy**: Client-side routing with React Router, featuring protected routes for authenticated users and role-based access control for admin areas. Includes proper error handling with dedicated 404 and unauthorized pages.

### Backend Architecture
**Server Framework**: Express.js with TypeScript for the REST API server. The server implements middleware for request logging, JSON parsing, cookie parsing, and comprehensive error handling. The architecture separates concerns with dedicated routes, middleware, and storage layers.

**Development Setup**: Uses tsx for TypeScript execution in development and esbuild for production bundling. The server integrates with Vite's development middleware for seamless full-stack development.

**Storage Interface**: Implements comprehensive `IStorage` interface with `DatabaseStorage` class for full CRUD operations on Users, Trips, Hotels, and Bookings. The system uses PostgreSQL with Drizzle ORM for robust data persistence and type safety.

**Authentication System**: JWT-based authentication with bcrypt password hashing, role-based access control (user/admin), and secure cookie management. Middleware includes `requireUser` and `requireAdmin` for route protection.

**API Design**: All endpoints follow consistent JSON response format: `{success: boolean, data: any, message: string}`. The system supports comprehensive CRUD operations, currency conversion, and AI-ready endpoints.

### Database Design
**ORM**: Drizzle ORM configured for PostgreSQL with Neon database provider. The schema defines comprehensive entities for a complete travel booking system.

**Migration Strategy**: Uses Drizzle Kit for schema migrations with configurations in `drizzle.config.ts`. Database credentials are managed through environment variables with `npm run db:push` for schema updates.

**Schema Structure**: Complete travel booking system with:
- **Users**: Role-based system (user/admin) with authentication fields
- **Trips**: Travel packages with pricing, duration, and descriptions
- **Hotels**: Accommodation options with amenities, ratings, and pricing
- **Bookings**: User reservations linking trips/hotels with pricing and dates
- **Relationships**: Proper foreign key constraints and data integrity

### Authentication System
**Strategy**: JWT-based authentication with bcrypt password hashing and role-based access control (user/admin roles). Tokens are managed through secure HTTP-only cookies and include user ID, email, and role.

**Security**: Comprehensive middleware system with `requireUser` and `requireAdmin` for route protection. Implements protected routes using a `ProtectedRoute` component on frontend that checks authentication status and user roles.

**API Endpoints**: Complete auth system with registration, login, logout, and current user endpoints. Passwords are securely hashed with bcrypt (12 rounds) and never returned in API responses.

### Build and Deployment
**Development**: Vite development server with HMR, TypeScript checking, and integrated error overlay. The build process uses Vite for frontend bundling and esbuild for backend compilation.

**Asset Management**: Supports static assets through Vite's asset pipeline with proper path resolution. Images are lazy-loaded with intersection observer for performance optimization.

**Environment Configuration**: Uses environment variables for database connections, JWT secrets, and other configuration values.

## External Dependencies

### UI and Design System
- **Radix UI**: Comprehensive set of accessible UI primitives for building the design system
- **Tailwind CSS**: Utility-first CSS framework for styling and responsive design
- **Framer Motion**: Animation library for smooth UI transitions and interactions
- **Lucide React**: Icon library providing consistent iconography throughout the application

### Data and State Management
- **TanStack Query**: Server state management for API calls, caching, and synchronization
- **React Hook Form**: Form handling with validation and performance optimization
- **React Router**: Client-side routing with history management
- **Zod**: Schema validation for type-safe data handling

### Database and Backend
- **Drizzle ORM**: Type-safe ORM for PostgreSQL database operations
- **Neon Database**: Serverless PostgreSQL database provider
- **Express.js**: Web application framework for building the REST API
- **bcrypt**: Password hashing for secure authentication

### Development Tools
- **TypeScript**: Type safety and enhanced developer experience
- **Vite**: Fast build tool and development server with HMR
- **ESBuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution engine for development

### Utility Libraries
- **date-fns**: Date manipulation and formatting utilities
- **clsx/tailwind-merge**: CSS class name utilities for conditional styling
- **nanoid**: Unique ID generation for various application needs

### Deployment and Performance
- **Replit**: Development environment with custom plugins for runtime error handling and cartographer integration
- **PostCSS/Autoprefixer**: CSS processing and vendor prefixing for cross-browser compatibility