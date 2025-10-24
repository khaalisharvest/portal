# 🌿 Khaalis Harvest Platform

Pakistan's premier organic marketplace - تازہ، خالص، قدرتی مصنوعات۔ Connecting organic product lovers with the freshest, purest products from farms and suppliers.

## 🏗️ Architecture

This is a monorepo containing:

- **`apps/web`** - Next.js web application with PWA capabilities
- **`apps/backend`** - Nest.js API server with TypeORM
- **`packages/shared`** - Shared utilities, types, and validators

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd livestock-app
yarn install
```

### 2. Environment Setup
```bash
# Create .env files in each app folder
# Backend: apps/backend/.env
# Web: apps/web/.env.local
# See ENVIRONMENT.md for details
```

### 3. Database Setup
```bash
# Start database services
docker-compose -f docker-compose.dev.yml up -d

# Run migrations
yarn db:migrate
```

### 4. Start Development
```bash
# Start all services
yarn dev

# Or start individually:
yarn backend   # API server (port 3000)
yarn web       # Web app (port 3001)
```

## 📱 Features

### Phase 1 (MVP) ✅
- **Fresh Meat & Dairy Marketplace** - Browse and order fresh products
- **Consumer Mobile/Web App** - Cross-platform applications
- **Seller Management** - Seller onboarding and product management
- **Order Management** - Complete order lifecycle
- **Payment Integration** - JazzCash, EasyPaisa, COD support
- **Offline Support** - Works without internet connection

### Phase 2 (Ecosystem) 🔄
- **Farmer Marketplace** - Direct farm-to-table sales
- **Vet Services** - Online vet consultations and bookings
- **B2B Module** - Bulk ordering for restaurants/hotels
- **Subscription Model** - Regular delivery subscriptions

### Phase 3 (Advanced) 🔮
- **Export Facilitation** - Connect with international buyers
- **AI Health Monitoring** - Livestock health tracking
- **Farmer Finance** - Micro-financing and insurance

## 🛠️ Tech Stack

### Frontend
- **React Native** - Mobile app with offline support
- **Next.js** - Web application with SSR/SSG
- **TypeScript** - Type-safe development
- **Redux Toolkit** - State management
- **React Query** - Server state management

### Backend
- **Nest.js** - Scalable Node.js framework
- **TypeORM** - Database ORM with automatic migrations
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **JWT** - Authentication

### Mobile Features
- **Offline Support** - Redux Persist + AsyncStorage
- **Push Notifications** - Real-time updates
- **Camera Integration** - Product photos
- **Location Services** - Delivery tracking
- **Biometric Auth** - Secure login

## 🗄️ Database Schema

The project uses **TypeORM entities** instead of manual SQL files:

### Core Entities
- **Users** - Customer, seller, farmer, vet profiles
- **Products** - Meat, dairy, and fresh produce
- **Orders** - Order management and tracking
- **Categories** - Product categorization
- **Profiles** - Specialized profiles for different user types

### Key Benefits
- ✅ **Automatic Schema Generation** - Tables created from models
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Migrations** - Automatic migration generation
- ✅ **Relationships** - Easy foreign key management
- ✅ **Cross-Platform** - Works with any SQL database

## 📦 Development Commands

```bash
# Development
yarn dev              # Start all services
yarn backend          # API server only
yarn web              # Web app only

# Database
yarn db:migrate       # Run migrations
yarn db:generate      # Generate new migration
yarn db:revert        # Revert last migration

# Testing
yarn test             # Run all tests
yarn test:watch       # Watch mode
yarn test:coverage    # Coverage report

# Code Quality
yarn lint             # Lint all packages
yarn type-check       # TypeScript checking
yarn format           # Format code with Prettier

# Building
yarn build            # Build all packages
yarn clean            # Clean build artifacts
```

## 🌐 API Documentation

Once the backend is running, visit:
- **API Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1/health


## 🔧 Environment Configuration

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=livestock_ecosystem
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
```

### Web (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

### Mobile (.env)
```env
API_BASE_URL=http://localhost:3000/api/v1
```

## 🚀 Deployment

### Docker
```bash
# Build and run with Docker Compose
docker-compose up -d

# Production build
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
1. Build all packages: `yarn build`
2. Start database services
3. Run migrations: `yarn db:migrate`
4. Start production servers

## 🌟 Key Features

- **🔄 Offline Support** - Works in rural areas with poor connectivity
- **📱 Cross-Platform** - Mobile and web applications
- **🔐 Secure** - JWT authentication, data encryption
- **🌍 Localized** - Urdu/English support
- **💳 Payment Ready** - JazzCash, EasyPaisa integration
- **📊 Analytics** - Real-time business insights
- **🔔 Notifications** - Push notifications and SMS
- **🗺️ Location Services** - GPS tracking and delivery
- **📸 Media Support** - Image upload and processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**Built with ❤️ for Pakistan's agricultural community**
