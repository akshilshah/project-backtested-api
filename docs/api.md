# Trading Management System API Documentation

Base URL: `/api`

## Table of Contents
- [Authentication](#authentication)
  - [Signup](#signup)
  - [Login](#login)
  - [Get Profile](#get-profile)
  - [Update Profile](#update-profile)
  - [Update Settings](#update-settings)
- [Master Data - Coins](#master-data---coins)
  - [Create Coin](#create-coin)
  - [List Coins](#list-coins)
  - [Get Coin](#get-coin)
  - [Update Coin](#update-coin)
  - [Delete Coin](#delete-coin)
- [Master Data - Strategies](#master-data---strategies)
  - [Create Strategy](#create-strategy)
  - [List Strategies](#list-strategies)
  - [Get Strategy](#get-strategy)
  - [Update Strategy](#update-strategy)
  - [Delete Strategy](#delete-strategy)
- [Trades](#trades)
  - [Create Trade](#create-trade)
  - [List Trades](#list-trades)
  - [Get Trade](#get-trade)
  - [Update Trade](#update-trade)
  - [Exit Trade](#exit-trade)
  - [Delete Trade](#delete-trade)
  - [Get Analytics](#get-analytics)

---

## Authentication

### Signup
**URL**: `POST /api/auth/signup`
**Auth**: Not Required

Creates a new user account with a default organization.

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Minimum 6 characters |
| firstName | string | Yes | User's first name |
| lastName | string | Yes | User's last name |

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "message": "User created successfully",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "organizationId": 1
    },
    "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (409 - Conflict)**:
```json
{
  "success": false,
  "data": {
    "error": "User with this email already exists"
  }
}
```

---

### Login
**URL**: `POST /api/auth/login`
**Auth**: Not Required

Authenticates a user and returns a JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | User's password |

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Login successful",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "organization": {
        "id": 1,
        "name": "John's Organization",
        "description": "Default organization"
      }
    },
    "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (401 - Unauthorized)**:
```json
{
  "success": false,
  "data": {
    "error": "Invalid email or password"
  }
}
```

---

### Get Profile
**URL**: `GET /api/auth/profile`
**Auth**: Required

Retrieves the authenticated user's profile.

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "profileSettings": null,
    "organization": {
      "id": 1,
      "name": "John's Organization",
      "description": "Default organization"
    },
    "userSettings": {
      "currency": "USD",
      "timezone": "UTC",
      "preferences": null
    }
  }
}
```

---

### Update Profile
**URL**: `PUT /api/auth/profile`
**Auth**: Required

Updates the authenticated user's profile.

**Request Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "profileSettings": {
    "theme": "dark"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| firstName | string | No | User's first name |
| lastName | string | No | User's last name |
| profileSettings | object | No | Custom profile settings |

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Profile updated successfully",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "profileSettings": {
        "theme": "dark"
      }
    }
  }
}
```

---

### Update Settings
**URL**: `PUT /api/auth/settings`
**Auth**: Required

Updates the user's application settings.

**Request Body**:
```json
{
  "currency": "EUR",
  "timezone": "Europe/London",
  "preferences": {
    "notifications": true
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| currency | string | No | Preferred currency code |
| timezone | string | No | Timezone identifier |
| preferences | object | No | Custom preferences |

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Settings updated successfully",
    "settings": {
      "currency": "EUR",
      "timezone": "Europe/London",
      "preferences": {
        "notifications": true
      }
    }
  }
}
```

---

## Master Data - Coins

### Create Coin
**URL**: `POST /api/masters/coins`
**Auth**: Required

Creates a new coin/cryptocurrency.

**Request Body**:
```json
{
  "name": "Bitcoin",
  "symbol": "BTC",
  "description": "The first decentralized cryptocurrency"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Coin name (1-100 chars) |
| symbol | string | Yes | Coin symbol (1-20 chars, auto-uppercased) |
| description | string | No | Description (max 500 chars) |

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "message": "Coin created successfully",
    "coin": {
      "id": 1,
      "name": "Bitcoin",
      "symbol": "BTC",
      "description": "The first decentralized cryptocurrency",
      "organizationId": 1,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Response (409 - Conflict)**:
```json
{
  "success": false,
  "data": {
    "error": "Coin with this symbol already exists"
  }
}
```

---

### List Coins
**URL**: `GET /api/masters/coins`
**Auth**: Required

Retrieves all coins for the authenticated user's organization.

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "coins": [
      {
        "id": 1,
        "name": "Bitcoin",
        "symbol": "BTC",
        "description": "The first decentralized cryptocurrency",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

### Get Coin
**URL**: `GET /api/masters/coins/:id`
**Auth**: Required

Retrieves a specific coin by ID.

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Coin ID |

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "coin": {
      "id": 1,
      "name": "Bitcoin",
      "symbol": "BTC",
      "description": "The first decentralized cryptocurrency",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "createdBy": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe"
      },
      "updatedBy": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  }
}
```

**Response (404 - Not Found)**:
```json
{
  "success": false,
  "data": {
    "message": "Coin not found"
  }
}
```

---

### Update Coin
**URL**: `PUT /api/masters/coins/:id`
**Auth**: Required

Updates an existing coin.

**Request Body**:
```json
{
  "name": "Bitcoin Updated",
  "description": "Updated description"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | Coin name |
| symbol | string | No | Coin symbol |
| description | string | No | Description |

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Coin updated successfully",
    "coin": {
      "id": 1,
      "name": "Bitcoin Updated",
      "symbol": "BTC",
      "description": "Updated description"
    }
  }
}
```

---

### Delete Coin
**URL**: `DELETE /api/masters/coins/:id`
**Auth**: Required

Deletes a coin. Cannot delete if used in trades.

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Coin deleted successfully"
  }
}
```

**Response (400 - Bad Request)**:
```json
{
  "success": false,
  "data": {
    "message": "Cannot delete coin. It is used in 5 trade(s)."
  }
}
```

---

## Master Data - Strategies

### Create Strategy
**URL**: `POST /api/masters/strategies`
**Auth**: Required

Creates a new trading strategy.

**Request Body**:
```json
{
  "name": "Breakout Strategy",
  "description": "Buy when price breaks resistance",
  "rules": {
    "entry": "breakout above resistance",
    "exit": "trailing stop 2%"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Strategy name (1-100 chars) |
| description | string | No | Description (max 1000 chars) |
| rules | object | No | Strategy rules as JSON |

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "message": "Strategy created successfully",
    "strategy": {
      "id": 1,
      "name": "Breakout Strategy",
      "description": "Buy when price breaks resistance",
      "rules": {
        "entry": "breakout above resistance",
        "exit": "trailing stop 2%"
      }
    }
  }
}
```

---

### List Strategies
**URL**: `GET /api/masters/strategies`
**Auth**: Required

Retrieves all strategies for the organization.

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "strategies": [
      {
        "id": 1,
        "name": "Breakout Strategy",
        "description": "Buy when price breaks resistance",
        "rules": { "entry": "breakout above resistance" },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

### Get Strategy
**URL**: `GET /api/masters/strategies/:id`
**Auth**: Required

Retrieves a specific strategy by ID.

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "strategy": {
      "id": 1,
      "name": "Breakout Strategy",
      "description": "Buy when price breaks resistance",
      "rules": { "entry": "breakout above resistance" },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "createdBy": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe"
      },
      "updatedBy": null
    }
  }
}
```

---

### Update Strategy
**URL**: `PUT /api/masters/strategies/:id`
**Auth**: Required

Updates an existing strategy.

**Request Body**:
```json
{
  "name": "Updated Strategy Name",
  "rules": { "newRule": "value" }
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Strategy updated successfully",
    "strategy": { ... }
  }
}
```

---

### Delete Strategy
**URL**: `DELETE /api/masters/strategies/:id`
**Auth**: Required

Deletes a strategy. Cannot delete if used in trades.

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Strategy deleted successfully"
  }
}
```

---

## Trades

### Create Trade
**URL**: `POST /api/trades`
**Auth**: Required

Creates a new trade with status OPEN.

**Request Body**:
```json
{
  "coinId": 1,
  "strategyId": 1,
  "tradeDate": "2024-01-15",
  "tradeTime": "09:30:00",
  "avgEntry": 42500.00,
  "stopLoss": 41000.00,
  "quantity": 0.5,
  "notes": "Breakout entry"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| coinId | integer | Yes | ID of the coin |
| strategyId | integer | Yes | ID of the strategy |
| tradeDate | date | Yes | Trade date (ISO format) |
| tradeTime | string | Yes | Trade time (HH:mm:ss) |
| avgEntry | number | Yes | Entry price |
| stopLoss | number | Yes | Stop loss price |
| quantity | number | Yes | Trade quantity |
| notes | string | No | Optional notes |

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "message": "Trade created successfully",
    "trade": {
      "id": 1,
      "tradeDate": "2024-01-15T00:00:00.000Z",
      "tradeTime": "1970-01-01T09:30:00.000Z",
      "avgEntry": 42500,
      "stopLoss": 41000,
      "quantity": 0.5,
      "status": "OPEN",
      "coin": { "id": 1, "name": "Bitcoin", "symbol": "BTC" },
      "strategy": { "id": 1, "name": "Breakout Strategy" }
    }
  }
}
```

---

### List Trades
**URL**: `GET /api/trades`
**Auth**: Required

Retrieves trades with filtering and pagination.

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | - | Filter by OPEN or CLOSED |
| coinId | integer | - | Filter by coin |
| strategyId | integer | - | Filter by strategy |
| dateFrom | date | - | Start date (ISO format) |
| dateTo | date | - | End date (ISO format) |
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |
| sortBy | string | tradeDate | Sort field |
| sortOrder | string | desc | Sort order (asc/desc) |

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "trades": [
      {
        "id": 1,
        "tradeDate": "2024-01-15T00:00:00.000Z",
        "tradeTime": "1970-01-01T09:30:00.000Z",
        "avgEntry": 42500,
        "stopLoss": 41000,
        "quantity": 0.5,
        "status": "OPEN",
        "profitLoss": null,
        "profitLossPercentage": null,
        "coin": { "id": 1, "name": "Bitcoin", "symbol": "BTC" },
        "strategy": { "id": 1, "name": "Breakout Strategy" }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### Get Trade
**URL**: `GET /api/trades/:id`
**Auth**: Required

Retrieves a specific trade with all details.

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "trade": {
      "id": 1,
      "tradeDate": "2024-01-15T00:00:00.000Z",
      "tradeTime": "1970-01-01T09:30:00.000Z",
      "avgEntry": 42500,
      "stopLoss": 41000,
      "quantity": 0.5,
      "avgExit": null,
      "exitDate": null,
      "exitTime": null,
      "status": "OPEN",
      "profitLoss": null,
      "profitLossPercentage": null,
      "duration": null,
      "notes": "Breakout entry",
      "coin": { "id": 1, "name": "Bitcoin", "symbol": "BTC", "description": "..." },
      "strategy": { "id": 1, "name": "Breakout Strategy", "description": "...", "rules": {...} },
      "createdBy": { "id": 1, "firstName": "John", "lastName": "Doe", "email": "user@example.com" },
      "updatedBy": { "id": 1, "firstName": "John", "lastName": "Doe", "email": "user@example.com" }
    }
  }
}
```

---

### Update Trade
**URL**: `PUT /api/trades/:id`
**Auth**: Required

Updates an OPEN trade. Cannot update CLOSED trades.

**Request Body**:
```json
{
  "avgEntry": 42000,
  "stopLoss": 40500,
  "notes": "Updated entry"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| coinId | integer | No | Coin ID |
| strategyId | integer | No | Strategy ID |
| tradeDate | date | No | Trade date |
| tradeTime | string | No | Trade time |
| avgEntry | number | No | Entry price |
| stopLoss | number | No | Stop loss price |
| quantity | number | No | Quantity |
| notes | string | No | Notes |

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Trade updated successfully",
    "trade": { ... }
  }
}
```

**Response (400 - Cannot Update Closed)**:
```json
{
  "success": false,
  "data": {
    "message": "Cannot update closed trade"
  }
}
```

---

### Exit Trade
**URL**: `POST /api/trades/:id/exit`
**Auth**: Required

Closes an OPEN trade with exit details. Calculates P&L automatically.

**Request Body**:
```json
{
  "avgExit": 44000,
  "exitDate": "2024-01-20",
  "exitTime": "14:30:00",
  "notes": "Target hit"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| avgExit | number | Yes | Exit price |
| exitDate | date | Yes | Exit date (ISO format) |
| exitTime | string | Yes | Exit time (HH:mm:ss) |
| notes | string | No | Optional notes |

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Trade exited successfully",
    "trade": {
      "id": 1,
      "avgEntry": 42500,
      "avgExit": 44000,
      "quantity": 0.5,
      "status": "CLOSED",
      "profitLoss": 750,
      "profitLossPercentage": 3.53,
      "duration": 5,
      "coin": { ... },
      "strategy": { ... }
    }
  }
}
```

**Calculations**:
- `profitLoss = (avgExit - avgEntry) * quantity`
- `profitLossPercentage = ((avgExit - avgEntry) / avgEntry) * 100`
- `duration = exitDate - tradeDate` (in days)

---

### Delete Trade
**URL**: `DELETE /api/trades/:id`
**Auth**: Required

Deletes a trade.

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Trade deleted successfully"
  }
}
```

---

### Get Analytics
**URL**: `GET /api/trades/analytics`
**Auth**: Required

Retrieves comprehensive trade analytics.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| dateFrom | date | Start date filter |
| dateTo | date | End date filter |
| coinId | integer | Filter by coin |
| strategyId | integer | Filter by strategy |

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTrades": 100,
      "openTrades": 10,
      "closedTrades": 90,
      "profitableTrades": 60,
      "losingTrades": 30,
      "winRate": 66.67,
      "totalProfitLoss": 15000,
      "avgProfitLoss": 166.67,
      "avgProfitLossPercentage": 2.5
    },
    "bestTrade": {
      "id": 25,
      "profitLoss": 2500,
      "profitLossPercentage": 12.5,
      "coin": { "id": 1, "name": "Bitcoin", "symbol": "BTC" },
      "strategy": { "id": 1, "name": "Breakout Strategy" }
    },
    "worstTrade": {
      "id": 42,
      "profitLoss": -800,
      "profitLossPercentage": -3.2,
      "coin": { ... },
      "strategy": { ... }
    },
    "byCoin": [
      {
        "coin": { "id": 1, "name": "Bitcoin", "symbol": "BTC" },
        "totalTrades": 50,
        "totalProfitLoss": 8000,
        "avgProfitLossPercentage": 3.2
      }
    ],
    "byStrategy": [
      {
        "strategy": { "id": 1, "name": "Breakout Strategy" },
        "totalTrades": 40,
        "totalProfitLoss": 6000,
        "avgProfitLossPercentage": 2.8
      }
    ]
  }
}
```

---

## Error Responses

All endpoints return standardized error responses:

**400 - Bad Request** (Validation Error):
```json
{
  "success": false,
  "data": {
    "isJoi": true,
    "name": "ValidationError",
    "details": [
      {
        "message": "\"email\" must be a valid email",
        "path": ["email"],
        "type": "string.email"
      }
    ]
  }
}
```

**401 - Unauthorized**:
```json
{
  "success": false,
  "data": {
    "error": "Access denied. No token provided."
  }
}
```

**404 - Not Found**:
```json
{
  "success": false,
  "data": {
    "message": "Resource not found"
  }
}
```

**409 - Conflict**:
```json
{
  "success": false,
  "data": {
    "error": "Resource already exists"
  }
}
```

---

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are returned from the `/api/auth/signup` and `/api/auth/login` endpoints.

The token payload contains:
- `id`: User ID
- `organizationId`: Organization ID

Token expiration is configured via the `JWTEXP` environment variable.
