# MAFCI Document Digitization & AI-Powered Archiving Platform

A comprehensive document management and archiving platform for MAFCI with AI-powered classification, OCR capabilities, and internal collaboration features.

## 🎯 Project Overview

This platform will digitize, organize, and make searchable all MAFCI documents including:
- Invoices (Factures)
- Bills of Lading (BLs)
- Transfer Requests (Demandes de transfert)
- And other company documents

## 🏗️ Architecture & Technology Stack

### Frontend
- **React 18** with **TypeScript**
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **React Query** for state management
- **React Router** for navigation

### Backend
- **Django 4.2+** with **Django REST Framework**
- **PostgreSQL** with full-text search
- **Celery** for async tasks
- **Redis** for caching and task queue

### AI & OCR
- **Tesseract OCR** for text extraction
- **OpenAI API** for document classification
- **LangChain** for intelligent document queries
- **Azure Form Recognizer** (optional premium feature)

### File Storage
- **Local NAS** (Phase 1)
- **AWS S3** (Phase 2 - Cloud migration)

### Search & Analytics
- **PostgreSQL** full-text search
- **Elasticsearch** (Phase 2 - Advanced search)

## 📋 Development Phases

### Phase 2: MVP — Scanning + Uploading + OCR
**Goal:** Make paper → digital
- [x] Basic login system (internal accounts)
- [x] Upload scanned PDFs/images
- [x] Use Tesseract to extract metadata (dates, invoice numbers, amounts, etc.)
- [x] Allow manual tagging & filing
- [x] Folder/department structure
**Deliverables:**
  - [x] Working document uploader
  - [x] OCR integration
  - [x] File storage & department classification
  - [x] Admin panel to manage docs

### Phase 3: Document Search + Smart Archive
**Goal:** Organize & retrieve anything
- [x] Advanced search using:
  - [x] Filename
  - [x] Tags
  - [x] Content (via OCR data)
  - [x] Department or upload date
- [ ] Use Elasticsearch for fast fuzzy/full-text searching (Planned)
- [x] Archive view (filter by BLs, Devis, Factures, etc.)
- [ ] User activity logging (Audit trail) (Planned)
**Deliverables:**
  - [x] Document explorer UI
  - [x] Search bar with filters
  - [ ] Audit trail per file (Planned)
  - [ ] Export (PDF, Excel) options (Planned)

### Phase 4: Internal Chat & Collaboration
**Goal:** Add team interaction
- [ ] Real-time internal chat (Planned)
  - [ ] Chat per file (“comments” on documents)
  - [ ] Departmental threads
- [ ] Socket.IO backend (Planned)
- [ ] Notifications for mentions or new uploads (Planned)
- [ ] Chat history stored & archived (Planned)
**Deliverables:**
  - [ ] Functional internal chat (Planned)
  - [ ] Integration into document view (Planned)
  - [ ] Mention/tag system (Planned)

### Phase 5: Validation & Approval Flows
**Goal:** Structured document workflows
- [ ] Add document status system: Draft > Submitted > Approved > Archived (Planned)
- [ ] Notification system for validation (Planned)
- [ ] Permissioned approval roles (Planned)
- [ ] Time stamping & user signature for accountability (Planned)
**Deliverables:**
  - [ ] Approvals dashboard (Planned)
  - [ ] Validation logic per department (Planned)
  - [ ] Notification system (email or dashboard) (Planned)

### Phase 6: Analytics & Audit Reporting
**Goal:** Insights + compliance
- [ ] Dashboards:
  - [ ] Monthly uploads by department (Planned)
  - [ ] Delay between upload & validation (Planned)
  - [ ] Number of documents by type (Planned)
- [ ] Export full logs for audits (Planned)
- [ ] AI assistant (optional later): Ask questions like: "Show me all unpaid bills from last month" (Planned)
**Deliverables:**
  - [ ] Dashboard with KPIs (Planned)
  - [ ] Downloadable audit reports (Planned)
  - [ ] System-wide log viewer (Planned)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Redis (for caching)

### Installation

1. **Clone and setup backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

2. **Setup frontend:**
```bash
cd frontend
npm install
npm run dev
```

3. **Start services:**
```bash
# Terminal 1: Backend
cd backend && python manage.py runserver

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Celery (for async tasks)
cd backend && celery -A config worker --loglevel=info
```

## 📁 Project Structure

```
mafci-digiarchive/
├── backend/                 # Django backend
│   ├── config/              # Django settings
│   ├── apps/
│   │   ├── authentication/  # User management & auth
│   │   ├── documents/       # Document, folder, department models & logic
│   │   ├── ai/              # OCR & AI (Tesseract, classification)
│   │   ├── search/          # Search utilities (future: Elasticsearch)
│   │   ├── notifications/   # Notification system
│   ├── requirements.txt
│   └── manage.py
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # UI components (upload, preview, selectors, etc.)
│   │   ├── pages/           # App pages (Home, Documents, Dashboard, etc.)
│   │   ├── hooks/           # React hooks
│   │   ├── services/        # API & business logic
│   │   ├── context/         # React context (global state)
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── docs/                    # Documentation
├── docker-compose.yml       # Dev environment
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

**Backend (.env):**
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost:5432/mafci_archive
REDIS_URL=redis://localhost:6379/0
OPENAI_API_KEY=your-openai-key
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=MAFCI Archive
```


## 📊 Features & Implementation Status

### Phase 2: MVP — Scanning + Uploading + OCR
**Goal:** Make paper → digital
- [x] Basic login system (internal accounts)
- [x] Upload scanned PDFs/images
- [x] Use Tesseract to extract metadata (dates, invoice numbers, amounts, etc.)
- [x] Allow manual tagging & filing
- [x] Folder/department structure
**Deliverables:**
  - [x] Working document uploader
  - [x] OCR integration
  - [x] File storage & department classification
  - [x] Admin panel to manage docs

### Phase 3: Document Search + Smart Archive
**Goal:** Organize & retrieve anything
- [x] Advanced search using:
  - [x] Filename
  - [x] Tags
  - [x] Content (via OCR data)
  - [x] Department or upload date
- [ ] Use Elasticsearch for fast fuzzy/full-text searching (Planned)
- [x] Archive view (filter by BLs, Devis, Factures, etc.)
- [ ] User activity logging (Audit trail) (Planned)
**Deliverables:**
  - [x] Document explorer UI
  - [x] Search bar with filters
  - [ ] Audit trail per file (Planned)
  - [ ] Export (PDF, Excel) options (Planned)

### Phase 4: Internal Chat & Collaboration
**Goal:** Add team interaction
- [ ] Real-time internal chat (Planned)
  - [ ] Chat per file (“comments” on documents)
  - [ ] Departmental threads
- [ ] Socket.IO backend (Planned)
- [ ] Notifications for mentions or new uploads (Planned)
- [ ] Chat history stored & archived (Planned)
**Deliverables:**
  - [ ] Functional internal chat (Planned)
  - [ ] Integration into document view (Planned)
  - [ ] Mention/tag system (Planned)

### Phase 5: Validation & Approval Flows
**Goal:** Structured document workflows
- [ ] Add document status system: Draft > Submitted > Approved > Archived (Planned)
- [ ] Notification system for validation (Planned)
- [ ] Permissioned approval roles (Planned)
- [ ] Time stamping & user signature for accountability (Planned)
**Deliverables:**
  - [ ] Approvals dashboard (Planned)
  - [ ] Validation logic per department (Planned)
  - [ ] Notification system (email or dashboard) (Planned)

### Phase 6: Analytics & Audit Reporting
**Goal:** Insights + compliance
- [ ] Dashboards:
  - [ ] Monthly uploads by department (Planned)
  - [ ] Delay between upload & validation (Planned)
  - [ ] Number of documents by type (Planned)
- [ ] Export full logs for audits (Planned)
- [ ] AI assistant (optional later): Ask questions like: "Show me all unpaid bills from last month" (Planned)
**Deliverables:**
  - [ ] Dashboard with KPIs (Planned)
  - [ ] Downloadable audit reports (Planned)
  - [ ] System-wide log viewer (Planned)

---

**Legend:**
- [x] Implemented
- [ ] Not yet implemented / Planned

This table is based on both the original roadmap and the additional requirements you provided. If you need a more granular breakdown or want to see code references for each feature, let me know!

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Submit pull request

## 📞 Support

For technical issues or questions, contact the development team.

---

**Built with ❤️ for MAFCI by the Development Team**
