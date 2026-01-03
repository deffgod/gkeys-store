# API Contracts: Authentication System Optimization

**Feature**: Authentication System Optimization  
**Date**: 2025-01-03  
**Phase**: 1 - Design

## Base URL

- Development: `http://localhost:3001/api`
- Production: `https://gkeys2.vercel.app/api`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### POST /auth/register

Register a new user account.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "nickname": "JohnDoe",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Request Validation**:
- `email`: Required, valid email format, normalized to lowercase
- `password`: Required, minimum 8 characters, must contain uppercase, lowercase, and number
- `nickname`: Optional, 2-50 characters (default: "Newbie Guy")
- `firstName`: Optional, max 100 characters
- `lastName`: Optional, max 100 characters

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "nickname": "JohnDoe",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": null,
      "role": "USER"
    },
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": 604800
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation failed
  ```json
  {
    "success": false,
    "error": {
      "message": "Validation failed",
      "errors": [
        {
          "field": "email",
          "message": "Valid email is required"
        }
      ]
    }
  }
  ```
- `409 Conflict`: User already exists
  ```json
  {
    "success": false,
    "error": {
      "message": "User with this email already exists"
    }
  }
  ```

### POST /auth/login

Authenticate user and receive access tokens.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Request Validation**:
- `email`: Required, valid email format, normalized to lowercase
- `password`: Required, minimum 8 characters, must contain uppercase, lowercase, and number

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "nickname": "JohnDoe",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": null,
      "role": "USER"
    },
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": 604800
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation failed
- `401 Unauthorized`: Invalid email or password
  ```json
  {
    "success": false,
    "error": {
      "message": "Invalid email or password"
    }
  }
  ```

### POST /auth/refresh

Refresh access token using refresh token.

**Request**:
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Request Validation**:
- `refreshToken`: Required, non-empty string

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token",
    "expiresIn": 604800
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation failed
- `401 Unauthorized`: Invalid or expired refresh token
  ```json
  {
    "success": false,
    "error": {
      "message": "Invalid refresh token"
    }
  }
  ```

### GET /auth/me

Get current authenticated user's profile.

**Authentication**: Required (Bearer token)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "JohnDoe",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": null,
    "role": "USER"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: No token provided or invalid token
  ```json
  {
    "success": false,
    "error": {
      "message": "Unauthorized"
    }
  }
  ```

### POST /auth/logout

Log out current user (clears server-side session if applicable).

**Authentication**: Required (Bearer token)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: No token provided or invalid token

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": [
      {
        "field": "fieldName",
        "message": "Field-specific error message"
      }
    ]
  }
}
```

## Token Management

### Access Token
- Stored in: `localStorage.getItem('gkeys_auth_token')`
- Expiration: 7 days (604800 seconds)
- Used in: `Authorization: Bearer <token>` header
- Auto-refresh: 5 minutes before expiration

### Refresh Token
- Stored in: `localStorage.getItem('gkeys_refresh_token')`
- Expiration: 30 days
- Used for: Obtaining new access tokens
- Rotation: New refresh token issued on each refresh

### Token Refresh Flow

1. Client detects token expiration (5 minutes before expiry)
2. Client calls `POST /auth/refresh` with refresh token
3. Server validates refresh token and issues new tokens
4. Client updates stored tokens
5. Client retries original request with new access token

### Token Refresh Deduplication

If multiple components detect token expiration simultaneously:
1. First component initiates refresh request
2. Other components wait for same refresh promise
3. All components receive same new tokens
4. Refresh promise cleared after completion

## Security Considerations

- All passwords validated on backend regardless of frontend validation
- JWT secrets must be at least 32 characters
- Access and refresh tokens use different secrets
- Tokens stored in localStorage (consider httpOnly cookies for enhanced security)
- Login attempts logged for security auditing
- Rate limiting should be applied to prevent brute force attacks
