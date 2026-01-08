# Backend API Development System Prompt

## Project Overview
You are building a microservice-based trading management system backend using Node.js, Express, Prisma ORM, and PostgreSQL. The system follows a modular architecture with standardized patterns for controllers, routers, and validation.

## Tech Stack
- **Runtime**: Node.js with ES6/ES7 syntax
- **Framework**: Express.js
- **ORM**: Prisma
- **Validation**: Joi
- **Build Tool**: Rollup
- **Database**: PostgreSQL

## Architecture Patterns

### 1. File Structure
Each module follows this structure:
````
src/services/{module-name}/
├── controller.js    # Business logic
├── router.js        # Route definitions
└── validation.js    # Joi schemas
````

### 2. Controller Pattern
````javascript
export const createResource = async (req, res) => {
  try {
    const context = req.context
    const body = await resourceSchema.validateAsync(req.body)

    const result = await db.resource.create({
      data: {
        organization: { connect: { id: context.organization.id } },
        createdBy: { connect: { id: context.user.id } },
        updatedBy: { connect: { id: context.user.id } },
        ...body
      }
    })

    res.created(constants.RECORD_CREATED)
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
````

### 3. Prisma Schema Pattern
````prisma
model Resource {
  id          Int      @id @default(autoincrement())
  name        String
  description String?

  // Relations
  organizationId Int
  organization   Organization @relation(fields: [organizationId], references: [id])

  // Audit fields
  createdAt   DateTime @default(now())
  createdBy   User     @relation("CreatedResource", fields: [createdById], references: [id])
  createdById Int
  updatedAt   DateTime @updatedAt
  updatedBy   User?    @relation("UpdatedResource", fields: [updatedById], references: [id])
  updatedById Int?

  @@map("resources")
}
````

### 4. Response Handlers
- `res.success(data)` - 200 OK
- `res.created(message)` - 201 Created
- `res.error(error)` - 400/500 Error
- `res.notFound(message)` - 404 Not Found

## Development Tasks

### Phase 1: Database Schema Design
**Task 1.1**: Create Prisma Schema
- [x] User model (id, email, password, firstName, lastName, profileSettings)
- [x] Organization model
- [x] UserSettings model (userId, currency, timezone, preferences)
- [x] Coin model (id, name, symbol, description) - Master table
- [x] Strategy model (id, name, description, rules) - Master table
- [x] Trade model with fields:
  - Basic: id, coinId, strategyId, tradeDate, tradeTime
  - Entry: avgEntry, stopLoss, quantity
  - Exit: avgExit, exitDate, exitTime, status (OPEN/CLOSED)
  - Calculated: profitLoss, profitLossPercentage, duration
  - Audit: organizationId, createdBy, updatedBy, createdAt, updatedAt
- [x] Run `npx prisma migrate dev` to apply schema

**Task 1.2**: Create seed data
- [ ] Add common coins (BTC, ETH, USDT, etc.)
- [ ] Add sample trading strategies

### Phase 2: Authentication & User Management
**Module**: `src/services/auth/`

**Task 2.1**: User Signup
- [ ] Create validation schema (email, password, firstName, lastName)
- [ ] Hash password using bcrypt
- [ ] Create user with default organization
- [ ] Return JWT token
- [ ] API: `POST /api/auth/signup`

**Task 2.2**: User Login
- [ ] Create validation schema (email, password)
- [ ] Verify credentials
- [ ] Generate JWT token
- [ ] API: `POST /api/auth/login`

**Task 2.3**: User Profile Management
- [ ] Get profile: `GET /api/auth/profile`
- [ ] Update profile: `PUT /api/auth/profile`
- [ ] Update settings (currency, preferences): `PUT /api/auth/settings`

### Phase 3: Master Data Management
**Module**: `src/services/masters/`

**Task 3.1**: Coin Management (CRUD)
- [ ] Create coin: `POST /api/masters/coins`
- [ ] List coins: `GET /api/masters/coins`
- [ ] Get coin: `GET /api/masters/coins/:id`
- [ ] Update coin: `PUT /api/masters/coins/:id`
- [ ] Delete coin: `DELETE /api/masters/coins/:id`

**Task 3.2**: Strategy Management (CRUD)
- [ ] Create strategy: `POST /api/masters/strategies`
- [ ] List strategies: `GET /api/masters/strategies`
- [ ] Get strategy: `GET /api/masters/strategies/:id`
- [ ] Update strategy: `PUT /api/masters/strategies/:id`
- [ ] Delete strategy: `DELETE /api/masters/strategies/:id`

### Phase 4: Trade Management Module
**Module**: `src/services/trade/`

**Task 4.1**: Create Trade
- [ ] Validation: coinId, strategyId, tradeDate, tradeTime, avgEntry, stopLoss, quantity
- [ ] Store with status = 'OPEN'
- [ ] API: `POST /api/trades`

**Task 4.2**: List Trades
- [ ] Filter by status (OPEN/CLOSED), date range, coin, strategy
- [ ] Pagination support
- [ ] Include coin and strategy details
- [ ] API: `GET /api/trades`

**Task 4.3**: Get Trade Details
- [ ] Fetch single trade with all relations
- [ ] API: `GET /api/trades/:id`

**Task 4.4**: Update Trade
- [ ] Allow updating entry details for OPEN trades
- [ ] Validation for editable fields
- [ ] API: `PUT /api/trades/:id`

**Task 4.5**: Exit Trade
- [ ] Validation: avgExit, exitDate, exitTime
- [ ] Calculate P&L: (avgExit - avgEntry) * quantity
- [ ] Calculate P&L %: ((avgExit - avgEntry) / avgEntry) * 100
- [ ] Calculate duration: exitDate - tradeDate
- [ ] Update status to 'CLOSED'
- [ ] API: `POST /api/trades/:id/exit`

**Task 4.6**: Trade Analytics
- [ ] Total trades count
- [ ] Win rate (profitable trades / total closed trades)
- [ ] Total P&L
- [ ] Average P&L per trade
- [ ] Best/Worst trades
- [ ] P&L by coin, strategy, time period
- [ ] API: `GET /api/trades/analytics`

### Phase 5: API Documentation
**Task 5.1**: Create API Documentation
- [ ] Create `docs/api.md` with all endpoints
- [ ] For each endpoint document:
  - HTTP Method and URL
  - Authentication required (Yes/No)
  - Request headers
  - Request body schema
  - Response codes
  - Response body schema
  - Example requests/responses

**Format**:
````markdown
## Endpoint Name
**URL**: `METHOD /api/path`
**Auth**: Required/Optional

**Request Body**:
```json
{
  "field": "type"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {}
}
```
````

### Phase 6: Error Handling & Middleware
**Task 6.1**: Global Error Handler
- [ ] Create error handling middleware
- [ ] Standardize error responses
- [ ] Log errors appropriately

**Task 6.2**: Authentication Middleware
- [ ] JWT verification middleware
- [ ] Attach user context to req.context
- [ ] Handle token expiration

**Task 6.3**: Authorization Middleware
- [ ] Organization-level data isolation
- [ ] Role-based access control (if needed)

## Code Quality Standards
1. **Always use try-catch** blocks in controllers
2. **Validate all inputs** using Joi schemas
3. **Use Prisma transactions** for multi-step operations
4. **Include audit fields** (createdBy, updatedBy) in all mutations
5. **Organization isolation**: Always filter by context.organization.id
6. **Consistent naming**: camelCase for JS, snake_case for DB
7. **Error logging**: Use console.log for errors (or logging library)
8. **HTTP status codes**: Use appropriate codes via res helpers

## Testing Checklist
For each endpoint, verify:
- [ ] Validation works (test invalid inputs)
- [ ] Authentication required endpoints reject unauthenticated requests
- [ ] Organization isolation (users can't access other org's data)
- [ ] Success responses match documentation
- [ ] Error responses are handled gracefully
- [ ] Database transactions work correctly

## Development Workflow
1. Start with Prisma schema changes
2. Run migrations
3. Create validation schemas
4. Implement controllers
5. Set up routers
6. Test endpoints manually
7. Document in API docs
8. Move to next task

## Important Notes
- Always maintain backward compatibility
- Use environment variables for sensitive config
- Keep business logic in controllers, not routers
- Reuse validation schemas where possible
- Follow the existing project structure strictly
- Refer to `@src/services/trade` as the reference implementation

Begin with Phase 1 and proceed sequentially. After completing each task, update the API documentation and mark the task as complete.