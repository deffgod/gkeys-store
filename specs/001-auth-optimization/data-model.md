# Data Model: Authentication System Optimization

**Feature**: Authentication System Optimization  
**Date**: 2025-01-03  
**Phase**: 1 - Design

## Entities

### User

Represents an authenticated user with identity information.

**Fields**:
- `id` (string, required): Unique user identifier (UUID)
- `email` (string, required): User's email address (unique, normalized to lowercase)
- `nickname` (string, required): User's display name (default: "Newbie Guy")
- `firstName` (string, optional): User's first name
- `lastName` (string, optional): User's last name
- `avatar` (string, optional): URL to user's avatar image
- `role` (string, required): User's role (e.g., "USER", "ADMIN")

**Relationships**:
- One-to-many with Session (user can have multiple active sessions)
- One-to-many with LoginHistory (tracks login attempts)
- One-to-one with Cart (user's shopping cart)
- One-to-many with Wishlist (user's wishlist items)

**Validation Rules**:
- Email must be valid format and normalized to lowercase
- Nickname must be 2-50 characters
- First name and last name must be < 100 characters each
- Role must be one of predefined values

**State Transitions**:
- User created → Active (on registration)
- Active → Suspended (admin action)
- Suspended → Active (admin action)

**Frontend Transformation**:
- Backend provides `nickname`, frontend displays as `name`
- Transformation: `name = user.nickname || user.email`
- All other fields map directly

### Authentication Token

Represents a time-limited credential that grants access to protected resources.

**Fields**:
- `token` (string, required): JWT access token
- `refreshToken` (string, required): JWT refresh token
- `expiresIn` (number, required): Token expiration time in seconds (default: 7 days)

**Storage**:
- Frontend: Stored in localStorage as `gkeys_auth_token` and `gkeys_refresh_token`
- Backend: Not stored (stateless JWT)

**Validation Rules**:
- Token must be valid JWT format
- Token must not be expired
- Token must contain valid payload (userId, email, role)
- Refresh token must be different from access token

**State Transitions**:
- Token issued → Valid (on login/refresh)
- Valid → Expired (after expiration time)
- Expired → Refreshed (via refresh token)
- Expired → Invalid (refresh token expired)

### Session

Represents a user's active session with expiration and associated data (for guest users).

**Fields**:
- `sessionId` (string, required): Unique session identifier (UUID)
- `data` (object, optional): Session data (e.g., cart items, wishlist)
- `expiresAt` (datetime, required): Session expiration time (default: 24 hours from creation)
- `userId` (string, optional): Associated user ID if session is linked to authenticated user

**Relationships**:
- Many-to-one with User (optional - guest sessions have no user)

**Validation Rules**:
- Session ID must be valid UUID
- Expiration time must be in the future
- Session must be cleaned up after expiration

**State Transitions**:
- Session created → Active (on first visit or login)
- Active → Expired (after expiration time)
- Active → Migrated (guest session linked to user on login)

### LoginHistory

Tracks user login attempts for security and auditing.

**Fields**:
- `id` (string, required): Unique identifier
- `userId` (string, required): User who attempted login
- `ipAddress` (string, optional): IP address of login attempt
- `userAgent` (string, optional): User agent string
- `success` (boolean, required): Whether login was successful
- `createdAt` (datetime, required): Timestamp of login attempt

**Relationships**:
- Many-to-one with User

**Validation Rules**:
- User ID must reference existing user
- Timestamp must be valid datetime

## Type Definitions

### Backend Types (Source of Truth)

```typescript
// backend/src/types/auth.ts

export interface RegisterRequest {
  email: string;
  password: string;
  nickname?: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    nickname: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    role: string;
  };
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}
```

### Frontend Types (Transformed from Backend)

```typescript
// src/context/AuthContext.tsx

export interface User {
  id: string;
  email: string;
  name: string; // Transformed from nickname
  avatar?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

### Transformation Logic

```typescript
// Transformation function in AuthContext
function transformUser(backendUser: AuthResponse['user']): User {
  return {
    id: backendUser.id,
    email: backendUser.email,
    name: backendUser.nickname || backendUser.email, // Transform nickname to name
    avatar: backendUser.avatar,
    role: backendUser.role,
  };
}
```

## Validation Rules

### Password Validation (Registration & Login)

- Minimum length: 8 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number
- Applied on both frontend (UX) and backend (security)

### Email Validation

- Must be valid email format
- Normalized to lowercase on backend
- Must be unique (registration only)

### Token Validation

- Access token: Valid JWT, not expired, contains required claims
- Refresh token: Valid JWT, not expired, different secret
- Both tokens must be present for authenticated requests

## Security Considerations

- Passwords are hashed using bcrypt (salt rounds: 10)
- JWT secrets must be at least 32 characters
- Access and refresh tokens use different secrets
- Tokens stored in localStorage (consider httpOnly cookies for production)
- Session data expires after 24 hours
- Login history tracks all attempts for security auditing
