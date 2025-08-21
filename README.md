# 💰 Installment Management System

A modern, full-stack web application for managing customer installment plans and tracking payments. Built with cutting-edge technologies and best practices to demonstrate advanced software development skills.

> **⚠️ Project Status: In Development**  
> This is a personal SaaS project currently under active development. **Not all features are fully implemented or working yet.** This repository serves as a showcase of my coding skills and development progress.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-3.0-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)

## 🚀 Live Demo

[Coming Soon - Deploy to Vercel]

## ✨ Features

### 🔐 Authentication & Security
- **Multi-tenant architecture** with Row Level Security (RLS)
- **JWT-based authentication** with Supabase Auth
- **Role-based access control** for different user types
- **Secure password management** with forgot password functionality

### 👥 Customer Management
- **Customer database** with comprehensive profiles
- **Customer analytics** and statistics dashboard
- **Search and filter** capabilities
- **Add/Edit/Delete** customer operations

### 💳 Installment Plans
- **Flexible payment plans** with customizable terms
- **Business model support** for different pricing strategies
- **Plan analytics** and performance metrics
- **Template-based plan creation**

### 📊 Financial Tracking
- **Payment tracking** with due date management
- **Overdue alerts** and notifications
- **Revenue analytics** with interactive charts
- **Installment history** and audit trails

### 🎨 Modern UI/UX
- **Responsive design** for all devices
- **Dark/Light theme** support
- **Interactive dashboards** with real-time data
- **Modern component library** using shadcn/ui

## 📋 Current Implementation Status

### ✅ **Fully Implemented & Working**
- **Authentication system** - Login, signup, forgot password
- **Multi-tenant architecture** with RLS policies
- **Basic customer management** - CRUD operations
- **Installment plans creation** and management
- **Core database schema** and migrations
- **Responsive UI components** and layout

### 🚧 **Partially Implemented / In Progress**
- **Dashboard analytics** - Basic charts and stats
- **Payment tracking** - Core structure ready, UI needs refinement
- **User onboarding** - Basic flow implemented
- **Real-time updates** - Supabase subscriptions set up

### 🔄 **Planned / Not Yet Started**
- **Advanced reporting** and export functionality
- **Email/SMS notifications**
- **Mobile app development**
- **Third-party integrations**
- **Advanced analytics** and AI features

> **Note**: This project is actively being developed as a learning experience and portfolio piece. The current implementation focuses on core functionality and architecture rather than production-ready features.

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript 5.0** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Row Level Security (RLS)** - Data isolation
- **Real-time subscriptions** - Live updates

### State Management & Data
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **Custom hooks** - Reusable business logic

### Development Tools
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 🏗️ Architecture Highlights

### Multi-Tenant Design
- **Tenant isolation** using RLS policies
- **Automatic tenant creation** for new users
- **Shared data models** with tenant-specific filtering

### Database Design
- **Normalized schema** for data integrity
- **Efficient indexing** for performance
- **Audit trails** for compliance
- **Migration system** for schema evolution

### Security Features
- **Row Level Security** policies
- **JWT token validation**
- **Input sanitization** and validation
- **SQL injection prevention**

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/installment-management.git
   cd installment-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Run database migrations**
   ```bash
   # Apply the SQL migrations in supabase/migrations/
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── auth/              # Authentication pages
│   └── onboarding/        # User onboarding flow
├── components/             # Reusable UI components
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components
│   └── screens/           # Page-specific components
├── services/               # API and business logic
├── store/                  # State management
├── types/                  # TypeScript type definitions
├── hooks/                  # Custom React hooks
└── lib/                    # Utility functions
```

## 🔮 Future Features

### Phase 2: Enhanced Analytics
- **Advanced reporting** with custom date ranges
- **Export functionality** (PDF, Excel, CSV)
- **Email notifications** for overdue payments
- **SMS integration** for payment reminders

### Phase 3: Mobile & API
- **Mobile app** (React Native)
- **REST API** for third-party integrations
- **Webhook system** for real-time updates
- **Multi-currency support**

### Phase 4: Advanced Features
- **AI-powered risk assessment**
- **Automated payment processing**
- **Advanced user roles** and permissions
- **Audit and compliance** reporting

## 🤝 Contributing

This is a showcase project, but contributions are welcome! Please feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 About the Developer

This project was built to demonstrate:

- **Full-stack development** skills
- **Modern web technologies** expertise
- **Database design** and optimization
- **Security best practices**
- **Clean code architecture**
- **User experience design**

> **Learning Focus**: This is a personal project built for learning and skill development. It showcases my ability to work with modern web technologies, implement complex features like multi-tenancy, and build scalable applications. The code represents my current skill level and learning journey.

## 🔗 Links

- **Portfolio**: [Your Portfolio URL]
- **LinkedIn**: [Your LinkedIn]
- **GitHub**: [Your GitHub]

---

⭐ **Star this repository if you found it helpful!**
