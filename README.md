# Real Estate AI Assistant

A sophisticated AI-powered conversational assistant for real estate sales, designed for Al Badia Living and Al Badia Villas properties in Dubai. The system uses Azure OpenAI GPT-4 to provide intelligent, context-aware responses with streaming capabilities, integrated knowledge bases, and smart image retrieval.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Key Features](#key-features)
- [Setup & Installation](#setup--installation)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Development](#development)

---

## Overview

This API powers conversational AI assistants for two luxury real estate properties:

- **Al Badia Living (ABL)** - Modern residential units
- **Al Badia Villas (ABV)** - Luxury villa properties

Each property has its own isolated service with:

- Dedicated Azure OpenAI configuration
- Custom knowledge base (markdown-based)
- Property-specific image catalog
- Separate Redis namespace for session management
- Tailored communication style and prompts

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client/Frontend                       │
│              (Sends queries via POST /api/abl/chat/query)   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     Express.js Server                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Middleware Stack                                     │   │
│  │  - Sentry (Error Tracking)                           │   │
│  │  - Helmet (Security)                                 │   │
│  │  - CORS                                              │   │
│  │  - Compression (SSE-aware)                           │   │
│  │  - Morgan (Logging)                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌────────────────────┐      ┌────────────────────┐         │
│  │   /abl Routes      │      │   /abv Routes      │         │
│  │  (Al Badia Living) │      │  (Al Badia Villas) │         │
│  └─────────┬──────────┘      └─────────┬──────────┘         │
└────────────┼─────────────────────────────┼──────────────────┘
             │                             │
             ▼                             ▼
    ┌────────────────┐          ┌────────────────┐
    │  ABL Service   │          │  ABV Service   │
    │                │          │                │
    │  ┌──────────┐  │          │  ┌──────────┐  │
    │  │Controller│  │          │  │Controller│  │
    │  └─────┬────┘  │          │  └─────┬────┘  │
    │        │       │          │        │       │
    │  ┌─────▼────────────────┐ │  ┌─────▼────────────────┐
    │  │  Core Services       │ │  │  Core Services       │
    │  │  - LLM Service       │ │  │  - LLM Service       │
    │  │  - Tools Service     │ │  │  - Tools Service     │
    │  │  - KB Service        │ │  │  - KB Service        │
    │  │  - Image Service     │ │  │  - Image Service     │
    │  │  - Conversation Svc  │ │  │  - Conversation Svc  │
    │  └──────────────────────┘ │  └──────────────────────┘
    └────────────────┘          └────────────────┘
             │                             │
             └──────────┬──────────────────┘
                        │
        ┌───────────────┼───────────────────┐
        │               │                   │
        ▼               ▼                   ▼
  ┌──────────┐   ┌───────────┐      ┌──────────┐
  │  Azure   │   │   Redis   │      │PostgreSQL│
  │  OpenAI  │   │  (Cache)  │      │ (Prisma) │
  │  GPT-4   │   │           │      │          │
  └──────────┘   └───────────┘      └──────────┘
```

---

## Tech Stack

### Backend Framework

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Rollup** - Build tool and bundler

### AI & LLM

- **Azure OpenAI** - GPT-4.1 for conversational AI
- **LangChain** - LLM orchestration framework
- **OpenAI SDK** - Azure OpenAI client

### Database & Caching

- **PostgreSQL** - Primary database
- **Prisma** - ORM and database toolkit
- **Redis (ioredis)** - Session management and conversation history

### Real-time Communication

- **Server-Sent Events (SSE)** - Streaming responses to client
- Custom SSE helpers for status updates and content streaming

### Security & Monitoring

- **Sentry** - Error tracking and performance monitoring
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Bcrypt** - Password hashing
- **JWT** - Authentication tokens

### File Processing

- **PDF Parse** - PDF document processing
- **Sharp** - Image processing
- **Multer & Multer-S3** - File uploads

### Cloud Services

- **AWS SDK** - S3 (storage), SES (email), SQS (queues)

### Development Tools

- **PM2** - Process management
- **Babel** - JavaScript transpilation
- **ESLint & Prettier** - Code quality
- **Dotenv** - Environment configuration

---

## Project Structure

```
backtested-api/
├── src/
│   ├── app.js                      # Express app setup
│   ├── server.js                   # Server initialization
│   │
│   ├── config/
│   │   ├── index.js                # Main config
│   │   ├── db.js                   # Prisma database client
│   │   ├── redis.js                # Redis client
│   │   ├── aws.js                  # AWS configuration
│   │   └── sentry.js               # Sentry configuration
│   │
│   ├── utils/
│   │   ├── express-helper.js       # Custom Express middleware
│   │   ├── auth.js                 # Authentication utilities
│   │   ├── validation.js           # Input validation
│   │   ├── llm.js                  # LLM helper functions
│   │   ├── ping.js                 # Health check
│   │   └── sqs.js                  # AWS SQS utilities
│   │
│   └── services/
│       ├── abl/                    # Al Badia Living Service
│       │   ├── abl.router.js       # Main router
│       │   │
│       │   ├── abliving/
│       │   │   ├── abl.router.js   # Nested routes
│       │   │   └── abl.controller.js # Main controller
│       │   │
│       │   ├── core/
│       │   │   ├── config/
│       │   │   │   ├── azure-config.js     # Azure OpenAI config
│       │   │   │   └── redis.js            # Redis config
│       │   │   │
│       │   │   └── services/
│       │   │       ├── llm-service.js      # LLM operations
│       │   │       ├── tools-service.js    # Tool definitions & execution
│       │   │       ├── kb-service.js       # Knowledge base search
│       │   │       ├── image-service.js    # Image retrieval
│       │   │       └── conversation-service.js # Chat history
│       │   │
│       │   ├── utils/
│       │   │   ├── sse-helpers.js  # SSE streaming utilities
│       │   │   └── prompts/
│       │   │       └── prompts.js  # System prompts & config
│       │   │
│       │   └── data/
│       │       ├── kb.md           # Knowledge base (markdown)
│       │       └── Al Badia Living Images/ # Property photos
│       │
│       ├── abv/                    # Al Badia Villas Service
│       │   └── [Same structure as abl/]
│       │
│       └── shared/                 # Shared utilities
│           └── utils/
│
├── prisma/
│   ├── schema.prisma               # Database schema
│   ├── migrations/                 # DB migrations
│   └── seed.js                     # Database seeding
│
├── public/                         # Static assets & UI
├── run.js                          # PM2 entry point
├── package.json                    # Dependencies
└── rollup.config.js               # Build configuration
```

---

## How It Works

### Request Flow: `POST /abl/chat/query`

```
1. CLIENT REQUEST
   │
   ├─► Query: "Tell me about 2 bedroom units"
   └─► session_id: "abc123" (optional)

2. INGRESS & VALIDATION
   │
   ├─► Router validates request
   ├─► Generates session_id if not provided
   └─► Loads conversation history from Redis

3. SSE HANDSHAKE
   │
   ├─► Sets Server-Sent Events headers
   ├─► Streams session_id to client
   └─► Sends status: "processing"

4. INITIAL LLM CALL
   │
   ├─► Builds messages array:
   │   - System prompt (with communication style)
   │   - Conversation history
   │   - Current user query
   │
   ├─► Calls Azure OpenAI GPT-4 with tools
   └─► Model decides: use tools OR respond directly

5A. TOOL EXECUTION PATH (if tools needed)
    │
    ├─► Tool: search_property_knowledge
    │   │
    │   ├─► Searches markdown knowledge base
    │   ├─► Retrieves relevant images
    │   └─► Returns structured context
    │
    ├─► Streams image metadata to client
    └─► Status: "searching"

5B. DIRECT RESPONSE PATH (greetings, simple questions)
    │
    └─► Skips to step 6 with empty tool results

6. UNIFIED PROMPT GENERATION
   │
   ├─► Builds comprehensive prompt with:
   │   - Conversation history
   │   - Tool results (KB context + images)
   │   - Current question
   │   - Communication style guidelines
   │
   └─► Cached for 2 hours (prompt caching)

7. FINAL STREAMING RESPONSE
   │
   ├─► Azure OpenAI streams answer
   ├─► Each chunk sent via SSE to client
   ├─► Status: "generating"
   └─► Full response accumulated

8. PERSISTENCE & CLEANUP
   │
   ├─► Saves user message to Redis
   ├─► Saves assistant response to Redis
   ├─► Limits history to 6 messages
   ├─► Sends SSE complete: "[DONE]"
   └─► Ends response
```

### Data Flow

**Conversation Memory (Redis)**

```
Key: abl:conversation:{session_id}
TTL: 24 hours
Structure: Array of {role, content, timestamp}
Limit: 6 messages (3 turns)
```

**Knowledge Base (File System + Local Cache)**

```
Format: Markdown (.md)
Location: src/services/abl/data/kb.md
Sections: Parsed by headers
Search: Keyword matching + context extraction
Local Cache: 10 minutes (in-memory)
```

**Image Catalog (File System + Local Cache)**

```
Location: src/services/abl/data/Al Badia Living Images/
Index: Auto-generated on startup
Matching: Keyword-based + category filtering
Metadata: Sent via SSE before text response
Local Cache: 10 minutes (in-memory)
```

**Azure OpenAI Prompt Cache (Automatic)**

```
Trigger: Prompts >= 1,024 tokens
Match Logic: First 1,024 tokens identical + every 128 tokens after
Duration: 5-10 minutes of inactivity (max 1 hour)
Cost Savings: ~50% reduction on cached tokens
Detection: response.usage.prompt_tokens_details.cached_tokens
```

---

## Key Features

### 1. Dual Property Support

- Independent services for ABL and ABV
- Isolated configurations, knowledge bases, and sessions
- Separate Azure OpenAI deployments (if needed)

### 2. Intelligent Tool System

- **Tool**: `search_property_knowledge`
  - Searches markdown knowledge base
  - Retrieves relevant property images
  - Returns structured context for LLM
- LLM decides autonomously when to use tools

### 3. Streaming Responses (SSE)

- Real-time status updates (`processing`, `thinking`, `searching`, `generating`)
- Chunked content streaming for smooth UX
- Image metadata streamed separately
- Completion signals (`[DONE]`)

### 4. Conversation Memory

- Redis-backed session management
- Maintains last 6 messages per session
- Auto-generates session IDs
- 24-hour TTL

### 5. Two-Layer Caching System

**Local Cache (Application Layer)**

- In-memory cache for knowledge base (10 minutes)
- Avoids repeated file I/O operations
- Lost on server restart

**Azure Cache (API Layer)**

- Automatic server-side prompt caching
- Activates for prompts >= 1,024 tokens
- Cache duration: 5-10 minutes of inactivity (max 1 hour)
- Reduces token costs by ~50% on cache hits
- No configuration needed - works automatically

### 6. Luxury Real Estate Tone

- Custom communication style prompt
- Sensory, benefit-oriented language
- Aspirational and consultative tone
- Dubai market-specific vocabulary

### 7. Comprehensive Error Handling

- Sentry integration for tracking
- Graceful SSE error messages
- Fallback responses
- Request validation

### 8. Security & Performance

- Helmet security headers
- CORS configuration
- SSE-aware compression
- Rate limiting ready
- JWT authentication utilities

---

## Setup & Installation

### Prerequisites

- Node.js 16+
- PostgreSQL database
- Redis server
- Azure OpenAI account

### 1. Clone & Install

```bash
git clone <repository-url>
cd backtested-api
yarn install
```

### 2. Configure Environment

Create `.env` file:

```env
# Server
PORT=31003
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/backtested_db"

# Redis
CACHE=true
REDIS_URL=redis://localhost:6379

# Azure OpenAI
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1
AZURE_OPENAI_API_VERSION=2024-10-21

# Authentication (optional)
JWT_SECRET=your_jwt_secret
JWT_EXPIRY_DATE=7d

# AWS (optional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Sentry (optional)
SENTRY_URL=your_sentry_dsn

# Other
WEB_BASE_URL=http://localhost:31003
DEBUG_LLM=false
```

### 3. Setup Database

```bash
# Generate Prisma client
yarn db:generate

# Run migrations
yarn db:migrate

# Push schema to database
yarn db:push
```

### 4. Start Redis

```bash
# macOS with Homebrew
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:latest
```

### 5. Run the Application

**Development Mode:**

```bash
# Terminal 1: Build with watch mode
yarn dev

# Terminal 2: Run server
node src/server.js
```

**Production Mode:**

```bash
# Build
yarn build

# Start with PM2
yarn start

# Stop
yarn stop

# Restart
yarn restart
```

### 6. Verify Installation

```bash
# Health check
curl http://localhost:31003/ping

# Test endpoint
curl http://localhost:31003/test

# Test chat (ABL)
curl -X POST http://localhost:31003/abl/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Tell me about the 2 bedroom units"}'
```

---

## API Endpoints

### Health & Status

```
GET  /ping          # Health check
GET  /test          # Service test
GET  /              # Landing page
```

### Al Badia Living (ABL)

```
POST /abl/chat/query       # Main chat endpoint
POST /api/abl/chat/query   # Alternative path

Request Body:
{
  "query": "Tell me about amenities",
  "session_id": "abc123"  // optional
}

Response: Server-Sent Events (SSE)
event: session_id
data: {"session_id": "abc123"}

event: status
data: {"status": "processing", "message": "Processing your query..."}

event: data
data: {"property_images": [...]}

event: content
data: {"content": "The property features..."}

event: complete
data: [DONE]
```

### Al Badia Villas (ABV)

```
POST /abv/chat/query       # Main chat endpoint
POST /api/abv/chat/query   # Alternative path

Same request/response structure as ABL
```

---

## Environment Variables

### Required

| Variable                       | Description                  | Example                        |
| ------------------------------ | ---------------------------- | ------------------------------ |
| `PORT`                         | Server port                  | `31003`                        |
| `DATABASE_URL`                 | PostgreSQL connection string | `postgresql://...`             |
| `AZURE_OPENAI_API_KEY`         | Azure OpenAI API key         | `sk-...`                       |
| `AZURE_OPENAI_ENDPOINT`        | Azure OpenAI endpoint        | `https://....openai.azure.com` |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Model deployment name        | `gpt-4.1`                      |

### Optional

| Variable     | Description          | Default                  |
| ------------ | -------------------- | ------------------------ |
| `CACHE`      | Enable Redis caching | `false`                  |
| `REDIS_URL`  | Redis connection URL | `redis://localhost:6379` |
| `NODE_ENV`   | Environment          | `development`            |
| `DEBUG_LLM`  | Enable LLM debugging | `false`                  |
| `JWT_SECRET` | JWT signing secret   | -                        |
| `SENTRY_URL` | Sentry DSN           | -                        |

---

## Development

### Database Management

```bash
# Generate Prisma client after schema changes
yarn db:generate

# Create migration
yarn db:migrate

# Apply migrations to database
yarn db:migrate:apply

# Push schema without migration
yarn db:push

# Open Prisma Studio (DB GUI)
yarn studio
```

### Useful Scripts

```bash
yarn dev                 # Development mode with watch
yarn build               # Production build
yarn start               # Start with PM2
yarn restart             # Restart PM2 process
yarn stop                # Stop PM2 process
yarn flush:cache         # Clear Redis cache
```

### Adding a New Property Service

1. **Create service directory**

```bash
mkdir -p src/services/new-property/{core/services,utils/prompts,data}
```

2. **Copy structure from ABL/ABV**

```bash
cp -R src/services/abl/* src/services/new-property/
```

3. **Update configurations**

- `core/config/azure-config.js` - Azure settings
- `core/config/redis.js` - Redis namespace
- `utils/prompts/prompts.js` - Custom prompts

4. **Add knowledge base**

- Create `data/kb.md`
- Add images to `data/Property Images/`

5. **Register routes**

```javascript
// In src/app.js
import newPropertyRouter from './services/new-property/router.js'
app.use(['/new-property', '/api/new-property'], newPropertyRouter)
```

### Customizing Communication Style

Edit `src/services/abl/utils/prompts/prompts.js`:

```javascript
const COMMUNICATION_STYLE = `
# Your custom tone instructions here
...
`
```

### Adding New Tools

Edit `src/services/abl/core/services/tools-service.js`:

```javascript
export const NEW_TOOL = {
  type: 'function',
  function: {
    name: 'tool_name',
    description: 'What the tool does',
    parameters: {
      /* schema */
    }
  }
}

export const handleNewTool = async (params, sseHelpers) => {
  // Implementation
}
```

---

## Database Schema

### Messages

Stores conversation messages and metadata

```sql
messages (
  id, uuid, session_id, question, text, answer,
  intent, type, token_metadata, vote, product,
  created_at
)
```

### Leads

Captures potential customer information

```sql
leads (
  id, uuid, session_id, email, name, mobile,
  location, comment, marketing_consent, terms_accepted,
  created_at, updated_at
)
```

### Evaluations

AI response quality tracking

```sql
evaluations (
  id, question, swirl_ai, ideal_answer,
  judge_score, judge_reason, intent, product,
  created_at, updated_at
)
```

---

## Performance Optimizations

1. **Two-Layer Caching**
   - **Local Cache**: In-memory KB storage (10 min) - eliminates file I/O
   - **Azure Cache**: Automatic API-side caching (5-10 min) - reduces token costs by 50%
   - Combined: Minimizes both latency and API costs
2. **Redis Session Storage** - Fast conversation retrieval with 24hr TTL
3. **SSE Streaming** - Real-time response delivery with chunked content
4. **Smart Compression** - Gzip for non-SSE responses (SSE-aware)
5. **PM2 Process Management** - Multi-process support with auto-restart
6. **Prisma Connection Pooling** - Efficient database connection reuse

---

## Monitoring & Debugging

### Logs

```bash
# PM2 logs
pm2 logs backtested-api

# Clear logs
pm2 flush
```

### Redis Debugging

```bash
# Connect to Redis CLI
redis-cli

# View all conversation keys
KEYS abl:conversation:*

# Get conversation data
GET abl:conversation:abc123

# Clear all cache
yarn flush:cache
```

### Sentry

- Automatic error tracking
- Performance monitoring
- Request tracing
- Custom breadcrumbs

---

## Security Considerations

- Helmet middleware for security headers
- CORS configured for specific origins
- Input validation with Joi
- JWT token authentication ready
- Environment variables for secrets
- Sentry for error monitoring
- Rate limiting (ready to configure)

---

## License

ISC

---

## Author

Akshil Shah

---

## Support

For issues or questions:

1. Check logs: `pm2 logs backtested-api`
2. Verify environment variables
3. Test Redis connection
4. Check Azure OpenAI quotas
5. Review Sentry error reports
