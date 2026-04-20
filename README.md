# ITSM AI Automation Agent

A production-ready, enterprise-grade IT Service Management (ITSM) platform with AI-powered automation for employee onboarding, offboarding, access provisioning, and intelligent issue detection.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      ITSM AI Agent                          │
├──────────────┬──────────────┬──────────────┬───────────────┤
│   Backend    │  AI Service  │   Frontend   │    Kafka      │
│  (NestJS)    │  (NestJS)    │  (Next.js)   │  (Events)     │
├──────────────┴──────────────┴──────────────┴───────────────┤
│                     MongoDB Atlas                           │
└─────────────────────────────────────────────────────────────┘
```

## Modules

| Module | Description |
|--------|-------------|
| `auth` | JWT authentication & authorization |
| `user` | Employee CRUD operations |
| `onboarding` | Onboarding workflow orchestration |
| `offboarding` | Offboarding & account cleanup |
| `provisioning` | Core RBAC-based account provisioning |
| `integration` | Third-party API adapters (Slack, GitHub, etc.) |
| `ticketing` | ITSM ticket management |
| `admin-config` | Admin UI configuration & credentials |
| `ai-detection` | AI anomaly detection microservice |

## Kafka Event Flow

```
employee.created      → provisioning-module → create accounts per role
employee.role.updated → provisioning-module → update access
employee.deleted      → offboarding-module  → revoke all access
system.issue.detected → ticketing-module    → auto-create ticket
```

## Supported Integrations

- Google Workspace
- Microsoft 365
- Slack
- GitHub
- Jira
- Zoom
- Zoho
- ServiceNow
- SAP
- Salesforce

## Prerequisites

- Node.js >= 18
- Docker & Docker Compose
- MongoDB (local or Atlas)
- Apache Kafka

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/1Mallesh/istm-ai-agent.git
cd istm-ai-agent
```

### 2. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env

# AI Service
cp ai-service/.env.example ai-service/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

Edit each `.env` file with your credentials.

### 3. Start with Docker Compose (recommended)

```bash
cd docker
docker-compose up -d
```

This starts:
- MongoDB on port 27017
- Kafka + Zookeeper on port 9092
- Backend API on port 3001
- AI Service on port 3002
- Frontend on port 3000

### 4. Manual Start (development)

```bash
# Backend
cd backend
npm install
npm run start:dev

# AI Service
cd ai-service
npm install
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

## API Endpoints

### Employees

```
POST   /api/employees          - Create employee (triggers onboarding)
GET    /api/employees          - List all employees
GET    /api/employees/:id      - Get employee by ID
PUT    /api/employees/:id      - Update employee
DELETE /api/employees/:id      - Delete employee (triggers offboarding)
```

### Provisioning

```
GET    /api/provisioning/logs           - View provisioning logs
GET    /api/provisioning/logs/:userId   - Logs by user
POST   /api/provisioning/retry/:userId  - Retry failed provisioning
```

### Integrations

```
GET    /api/integrations                - List integrations
POST   /api/integrations               - Configure integration
PUT    /api/integrations/:id           - Update credentials
DELETE /api/integrations/:id           - Disable integration
```

### Tickets

```
GET    /api/tickets             - List tickets
POST   /api/tickets             - Create ticket
GET    /api/tickets/:id         - Get ticket
PUT    /api/tickets/:id/status  - Update ticket status
```

### Admin

```
GET    /api/admin/role-mappings         - Get role-to-tool mappings
PUT    /api/admin/role-mappings         - Update role mappings
GET    /api/admin/dashboard             - System overview
```

## RBAC Role-to-Tool Mapping (Default)

| Role | Tools Provisioned |
|------|-------------------|
| Developer | GitHub, Jira, Slack, Zoom |
| HR | Zoho, Slack, Zoom |
| Sales | Salesforce, Slack, Zoom |
| Finance | SAP, Slack, Zoom |
| IT Admin | All tools |
| Manager | Slack, Zoom, Jira |

## Environment Variables

See `backend/.env.example`, `ai-service/.env.example`, and `frontend/.env.example` for all required variables.

## CI/CD

GitHub Actions pipelines are configured in `.github/workflows/`:
- `ci.yml` - Lint, test, build on every PR
- `cd.yml` - Deploy on merge to main

## Project Structure

```
istm-ai-agent/
├── backend/                    # NestJS API server
│   └── src/
│       ├── modules/
│       │   ├── auth/
│       │   ├── user/
│       │   ├── onboarding/
│       │   ├── offboarding/
│       │   ├── provisioning/
│       │   ├── integration/
│       │   ├── ticketing/
│       │   └── admin-config/
│       ├── kafka/
│       ├── common/
│       └── database/
├── ai-service/                 # AI anomaly detection service
│   └── src/
│       ├── detectors/
│       ├── processors/
│       └── kafka/
├── frontend/                   # Next.js admin UI
│   └── src/
│       ├── app/
│       ├── components/
│       └── lib/
├── docker/                     # Docker Compose configs
└── .github/workflows/          # CI/CD pipelines
```

## Integration with Blazey (Onboarding System)

The ITSM agent exposes a webhook endpoint at `/api/webhooks/blazey` that accepts:

```json
{
  "event": "employee.onboarded | employee.offboarded",
  "employeeId": "string",
  "payload": { ... }
}
```

## License

MIT
