# UCT - University Course Tracking & Academic Dashboard

## Overview

UCT (University Course Tracking) is an all-in-one university management web application that combines financial tracking with comprehensive academic dashboard features. Starting as an expense/income tracker for university courses, it has evolved into a complete academic companion that manages calendar events, reminders, grades, notifications, and student productivity tools. 

Built as a Single Page Application (SPA) using vanilla JavaScript on the frontend and Express.js on the backend, with Supabase as the database and authentication provider. The application provides a modern, responsive interface with dark/light theme support and progressive web app capabilities for seamless mobile usage.

### Current Capabilities (v1.0 - COMPLETED)
- ✅ Secure user authentication and profile management with avatar upload
- ✅ Financial transaction tracking (expenses/income) for university activities  
- ✅ Person/contact management for shared expenses
- ✅ Dark/light theme system with user preferences
- ✅ Responsive mobile-first design with progressive web app features
- ✅ Profile management with nickname and avatar upload/crop to 36x36px

### Academic Dashboard Features (v2.0 - IN DEVELOPMENT)
- 📅 Perpetual calendar with university events and exam scheduling
- ⏰ Intelligent reminder system for exams, deadlines, and important dates
- 📊 Grade management with GPA calculation and academic progress tracking
- 🔔 Multi-channel notifications (in-app, email, SMS, push notifications)
- 📱 Google Calendar integration via ICS export for seamless synchronization
- 📚 Study productivity tools and academic workflow optimization

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
- **Supabase Storage**: Private bucket 'avatars' configured with RLS policies for secure file uploads

## 🚀 UCT 2.0 Development Roadmap

### ✅ COMPLETED (v1.0)
- [x] Sistema autenticazione Supabase con gestione sessioni
- [x] Gestione profili utente con avatar upload e crop automatico  
- [x] Sistema spese/entrate per persone con categorizzazione
- [x] Tema dark/light personalizzato con preferenze utente
- [x] Design responsive mobile-first con ottimizzazioni touch
- [x] Upload avatar sicuro con bucket privato e signed URLs

### 🔄 IN SVILUPPO (v2.0)

#### 📅 Phase 1: Dashboard & Calendario (2-3 settimane)
- [ ] Dashboard overview con widget di riepilogo accademico
- [ ] Calendario perpetuo integrato con FullCalendar
- [ ] Sistema CRUD per eventi universitari (lezioni, esami, scadenze)
- [ ] Export automatico ICS per sincronizzazione Google Calendar
- [ ] Notifiche in-app base con sistema di alert
- [ ] Interfaccia drag & drop per gestione eventi calendario

#### 🔔 Phase 2: Sistema Notifiche Multi-canale (1-2 settimane)  
- [ ] Integrazione Replit Mail per notifiche email automatiche
- [ ] Setup Twilio per SMS di emergenza e scadenze critiche
- [ ] Web Push API per notifiche browser anche offline
- [ ] Sistema alert multi-livello: 30 giorni, 7 giorni, 24 ore, 1 ora prima
- [ ] Personalizzazione preferenze notifiche per tipo evento

#### 📊 Phase 3: Gestione Accademica Avanzata (2-4 settimane)
- [ ] Sistema completo gestione voti con calcolo medie ponderate/aritmetiche
- [ ] Tracker CFU e progressi verso laurea con visualizzazione grafica
- [ ] Gestione appelli e sessioni d'esame con sistema "rifiutato" e ripetizioni
- [ ] Piano di studi interattivo con prerequisiti e corsi suggeriti
- [ ] Analytics performance studente con trend e previsioni
- [ ] Calendario accademico istituzionale integrato

### 🎯 FUNZIONALITÀ PIANIFICATE (v2.x Future)

#### 📚 Moduli Accademici Estesi
- **Libretto Universitario Digitale**: Voti, CFU, medie con grafici evoluzione
- **Tracker Progressi Laurea**: Timeline dinamica e milestone accademici
- **Sistema Appelli Intelligente**: Notifiche personalizzate e gestione iscrizioni
- **Calendario Accademico**: Integrazione scadenze istituzionali e festività

#### 💰 Finanze Universitarie Smart
- **Budget Planner Accademico**: Gestione budget semestre/anno accademico
- **Tracker Spese Dettagliato**: Categorizzazione libri, materiali, tasse, trasporti
- **Alert Scadenze Pagamenti**: Notifiche automatiche tasse, alloggio, mensa
- **Comparatore Prezzi Libri**: Integrazione con marketplace e notifiche offerte

#### 📖 Produttività e Studio  
- **Pomodoro Timer Integrato**: Sessioni di studio con statistiche performance
- **Sistema Appunti Avanzato**: Tag per materie, ricerca full-text, condivisione
- **Task Manager Accademico**: Gestione progetti, consegne, deadlines
- **Habit Tracker Studio**: Monitoraggio routine di studio e obiettivi settimanali

#### 👥 Network Universitario e Sociale
- **Rubrica Accademica Smart**: Contatti studenti, professori con info ricevimenti
- **Gruppi Studio Collaborativi**: Chat integrata, condivisione documenti, planning
- **Sistema Prenotazioni**: Ricevimenti professori, laboratori, spazi studio
- **Marketplace Universitario**: Scambio libri, appunti, servizi ripetizioni

#### 📊 Analytics e Business Intelligence
- **Performance Dashboard**: Trend voti, CFU, analisi punti di forza/debolezza
- **Previsioni Laurea AI**: Algoritmi predittivi basati su andamento attuale
- **Analisi Tempo Studio**: Ottimizzazioni AI per efficienza e produttività
- **Report Automatici**: Digest mensili, riepiloghi semestrali per studente/famiglia

#### 🤖 Funzionalità Avanzate Future
- **AI Assistant Universitario**: Chatbot per domande su orari, scadenze, procedure
- **Gamification Accademica**: Sistema punti, achievement, leaderboard motivazionali
- **Progressive Web App**: Installazione mobile nativa con funzionalità offline
- **Sincronizzazione Multi-dispositivo**: Cloud sync tra desktop, tablet, smartphone

### 🛠️ Stack Tecnologico Aggiuntivo (v2.0+)

#### Nuove Librerie e Integrazioni
- **FullCalendar**: Calendario professionale drag & drop con viste multiple
- **ICS Library**: Generazione file .ics per integrazione calendari esterni
- **Calendar-link**: Collegamenti diretti per Google/Apple/Outlook Calendar
- **Replit Mail**: Sistema email integrato per notifiche automatiche
- **Twilio SMS**: Servizio SMS per alert critici e emergenze
- **Web Push API**: Notifiche browser native anche con app chiusa
- **Add-to-Calendar Button**: Widget universale per aggiunta eventi

#### Future Enhancement Technologies
- **Service Worker**: Funzionalità offline e cache intelligente
- **PWA Manifest**: Installazione app mobile nativa
- **WebRTC**: Video chiamate integrate per gruppi studio
- **AI/ML APIs**: Algoritmi predittivi per performance e suggerimenti

### 🎨 Principi Design e UX Mantenuti

#### Coerenza Architetturale
- **Single Page Application**: Mantenimento SPA unificata senza frammentazione
- **Modularità Logica**: Organizzazione codice in sezioni ben definite
- **Backward Compatibility**: Funzionalità v1.0 completamente preservate
- **Progressive Enhancement**: Nuove funzionalità come estensioni naturali

#### Consistency UI/UX
- **Sistema Tema Unificato**: Dark/light mode esteso a tutti i nuovi moduli
- **Pattern Esistenti**: Riuso modali, form, navigazione, feedback utente
- **Mobile-First**: Approccio responsive mantenuto per tutte le aggiunte
- **Iconografia Coerente**: Estensione sistema Lucide icons esistente

#### Performance e Scalabilità
- **Lazy Loading**: Caricamento moduli on-demand per performance
- **Code Splitting**: Separazione logica mantenendo SPA experience
- **Caching Intelligente**: Strategie cache per calendario e notifiche
- **Database Optimization**: Strutture dati ottimizzate per nuove funzionalità