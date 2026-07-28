# Nearby Service

A completely independent backend microservice for the Tourist Platform, designed to handle location-based queries and nearby discovery.

## Folder Structure

The project follows Clean Architecture and SOLID principles.

```
nearby-service/
├── prisma/
│   └── schema.prisma           # Prisma database schema configuration
├── src/
│   ├── application/            # APPLICATION LAYER (Use Cases & Service Layer)
│   │   └── services/           # Business logic orchestrators implementation
│   ├── config/                 # Configuration & Environment Variables
│   ├── domain/                 # DOMAIN LAYER (Enterprise Logic)
│   │   ├── entities/           # Core domain models
│   │   └── interfaces/         # Repository interfaces (Dependency Inversion)
│   ├── infrastructure/         # INFRASTRUCTURE LAYER
│   │   ├── grpc/               # gRPC client/server setup and proto definitions
│   │   ├── redis/              # Redis caching and pub/sub implementations
│   │   └── repositories/       # Database implementations (Prisma Repositories)
│   ├── interfaces/             # PRESENTATION LAYER (Controllers & Handlers)
│   │   ├── http/               # Express REST API (routes, controllers, middlewares)
│   │   └── rpc/                # gRPC service handlers
│   └── index.ts                # Application Entry Point
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Architecture Explanation

### 1. Clean Architecture Layers

**Domain Layer (`src/domain/`)**
The heart of the service. It contains business entities and interfaces that define how the application interacts with the outside world. It has no dependencies on external frameworks, databases, or libraries (e.g., Express or Prisma are strictly forbidden here).

**Application Layer (`src/application/`)**
Contains the "Use Cases" or "Service Layer". This layer coordinates business logic. It executes domain rules using the interfaces defined in the Domain layer. It acts as the orchestrator between the database (via repository interfaces) and external services.

**Infrastructure Layer (`src/infrastructure/`)**
Provides the concrete implementations for interfaces defined in the domain layer. This includes the Prisma ORM implementation (`repositories`), Redis clients (`redis`), and internal microservice communication setups (`grpc`).

**Interfaces/Presentation Layer (`src/interfaces/`)**
The entry point for incoming requests. It translates HTTP requests (via Express) or gRPC requests into calls to the Application layer, and formats the outbound responses.

### 2. SOLID Principles

- **Single Responsibility**: Each class/file has one reason to change. Controllers handle HTTP, Services handle logic, Repositories handle Data.
- **Open/Closed**: The system is open for extension but closed for modification (e.g., adding a new database engine simply means writing a new Repository implementation).
- **Liskov Substitution**: Any implementation of a domain interface can be substituted without altering the program (e.g., mocking repositories in tests).
- **Interface Segregation**: Clients shouldn't be forced to depend on interfaces they don't use. Repository interfaces are highly specific.
- **Dependency Inversion**: High-level modules (Services) rely on abstractions (Repository Interfaces), not concretions (Prisma Repositories). Dependencies are injected.

### 3. Repository Pattern & Service Layer

The **Repository Pattern** abstracts database interactions. The Application layer calls `userRepository.findById(id)` rather than `prisma.user.findUnique()`. This encapsulates database queries.
The **Service Layer** encapsulates business workflows, orchestrating between the repository and external APIs.

### 4. gRPC & HTTP

- **HTTP (Express)**: Provides RESTful endpoints for debugging or external gateway access.
- **gRPC**: Provides lightning-fast binary communication for internal microservice-to-microservice traffic (e.g., fetching auth data, or being queried by another service).

### 5. Docker

Containerized for independent deployment. The Dockerfile uses multi-stage builds to ensure a small production image, only compiling TypeScript in the build stage and copying the `dist` folder.
