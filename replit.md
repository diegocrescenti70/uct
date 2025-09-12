# UCT - University Course Tracking

## Overview

UCT (University Course Tracking) is a web application designed to track expenses and income for university courses or academic cycles. It's built as a Single Page Application (SPA) using vanilla JavaScript on the frontend and Express.js on the backend, with Supabase as the database and authentication provider. The application provides a modern, responsive interface with dark/light theme support for managing financial transactions related to educational activities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single Page Application (SPA)**: Built with vanilla JavaScript using ES6 modules
- **Static File Serving**: Express serves static assets with intelligent caching strategies
- **Theme System**: CSS custom properties enable dark/light theme switching
- **Responsive Design**: Mobile-first approach with modern CSS Grid and Flexbox
- **Icon System**: Lucide icons integrated via CDN for consistent iconography

### Backend Architecture
- **Express.js Server**: Lightweight Node.js server handling static file delivery and SPA routing
- **Environment Configuration**: Dotenv for secure environment variable management
- **Production Optimizations**: Conditional caching headers and static file optimizations
- **Fallback Routing**: SPA-compatible routing that serves index.html for client-side navigation

### Authentication & Data Management
- **Supabase Integration**: Handles user authentication and database operations
- **Client-side Authentication**: JavaScript-based auth flow with session management
- **Real-time Capabilities**: Leverages Supabase's real-time database features

### File Structure & Organization
- **Public Directory**: Contains all frontend assets (HTML, CSS, JavaScript)
- **Environment Injection**: Dynamic environment variable injection via `/env.js` endpoint
- **Modular CSS**: Component-based styling with CSS custom properties
- **Asset Management**: Organized static assets with version-controlled cache busting

## External Dependencies

### Core Dependencies
- **Express.js**: Web server framework for Node.js
- **Dotenv**: Environment variable management
- **Supabase**: Backend-as-a-Service providing database and authentication

### Frontend Dependencies
- **Supabase JavaScript Client**: Browser client for Supabase integration (loaded via ESM)
- **Lucide Icons**: Modern icon library loaded via CDN
- **Google Fonts**: Inter font family for typography

### Development Tools
- **Node.js Types**: TypeScript definitions for Node.js development
- **NPM**: Package management and dependency resolution

### Infrastructure Requirements
- **Supabase Project**: External database and authentication service
- **Environment Variables**: SUPABASE_URL and SUPABASE_ANON_KEY required for operation
- **Static Hosting**: Application designed for deployment on platforms supporting Node.js