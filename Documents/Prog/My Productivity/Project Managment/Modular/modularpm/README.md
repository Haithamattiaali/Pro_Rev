# ModularPM - Modular Project Management System

A modern, modular project management application built with Next.js 15, TypeScript, Prisma, and modular architecture.

## Features

- **Modular Architecture**: Clean separation of concerns with feature modules
- **Authentication**: Secure authentication with NextAuth.js
- **Workspace Management**: Multi-workspace support for team collaboration
- **Project Management**: Create and manage projects with customizable data models
- **Visualization**: Dynamic data visualization with D3.js and Recharts
- **Real-time Updates**: Socket.io integration for real-time collaboration
- **AI Integration**: Built-in AI services module for intelligent features

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4, Radix UI
- **Database**: Prisma ORM (supports PostgreSQL, MySQL, SQLite)
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **API**: tRPC for type-safe APIs
- **Real-time**: Socket.io
- **Forms**: React Hook Form with Zod validation

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Database (PostgreSQL recommended)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Haithamattiaali/modularpm.git
   cd modularpm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   - `DATABASE_URL`: Your database connection string
   - `NEXTAUTH_URL`: Your application URL (http://localhost:3000 for development)
   - `NEXTAUTH_SECRET`: A random string for NextAuth encryption

4. **Set up the database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
modularpm/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── api/               # API routes
├── src/
│   ├── modules/           # Feature modules
│   │   ├── ai-services/
│   │   ├── data-model/
│   │   ├── identity-access/
│   │   ├── notifications/
│   │   ├── project-core/
│   │   ├── visualization/
│   │   └── workspace-billing/
│   ├── shared/            # Shared utilities and components
│   └── types/             # TypeScript type definitions
├── prisma/                # Database schema and migrations
└── public/                # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema changes
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

## Development

The project follows a modular architecture where each feature is encapsulated in its own module with:
- Services for business logic
- Components for UI
- Repositories for data access
- Types for TypeScript definitions

## Deployment

The application can be deployed to any platform that supports Node.js applications:

- **Vercel**: Optimized for Next.js applications
- **Railway**: Easy deployment with database provisioning
- **Docker**: Containerized deployment
- **Traditional VPS**: Using PM2 or similar process managers

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.