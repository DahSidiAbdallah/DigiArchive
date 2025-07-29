# MAFCI DigiArchive Architecture

This document provides an overview of the MAFCI DigiArchive platform architecture.

## Backend Architecture

### Django Apps Structure

The backend is organized into the following Django apps:

1. **Authentication**
   - User management and authentication
   - Custom user model with department and position fields
   - JWT-based authentication

2. **Documents**
   - Document storage and management
   - Document metadata (title, type, reference number, date)
   - Document tagging system

3. **AI**
   - OCR processing (Tesseract)
   - Document classification (Phase 2)
   - Auto-tagging (Phase 2)

4. **Search**
   - Basic search functionality (Phase 1)
   - Advanced search with filters (Phase 2)
   - Full-text search capabilities

### Database Schema

The main database models include:

1. **User**
   - Custom user model extending Django's AbstractUser
   - Additional fields: department, position

2. **Document**
   - Core document model with metadata
   - File storage fields
   - Reference to OCR data

3. **DocumentOCR**
   - OCR extracted text
   - Processing metadata

4. **Tag**
   - Document tag model

### Asynchronous Tasks

Celery is used for handling asynchronous tasks such as:
- OCR processing
- Document classification
- Email notifications

Redis serves as the message broker for Celery tasks.

## Frontend Architecture

### Component Structure

The React frontend is organized into:

1. **Pages**
   - Main application views (Home, Dashboard, Documents, etc.)

2. **Components**
   - Reusable UI elements
   - Layout components

3. **Hooks**
   - Custom React hooks
   - Authentication hook

4. **Services**
   - API communication
   - Authentication services

### State Management

- React Query for server state management
- Local state using React's useState where appropriate

### Styling

- Tailwind CSS for utility-first styling
- Custom components built on Tailwind primitives

## Deployment Architecture

The application is designed to be deployed with:

1. **Docker Containers**
   - Backend, Frontend, Celery worker containers
   - PostgreSQL and Redis containers

2. **Local Development**
   - Docker Compose for local development environment
   - Hot reloading for both frontend and backend

3. **Production Deployment**
   - Phase 4 will include production-ready deployment
   - Security hardening
   - Backup and disaster recovery
