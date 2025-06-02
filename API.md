# WhistleLite API Documentation

## Overview

WhistleLite provides a RESTful API for secure whistleblowing submissions and administrative functions. All endpoints implement comprehensive security measures including encryption, authentication, and audit logging.

## Base URL

```
https://your-domain.nhs.uk/api
```

## Authentication

Administrative endpoints require session-based authentication. Public submission endpoints are accessible without authentication but implement CSRF protection.

### Admin Authentication Flow

1. Obtain CSRF token: `GET /csrf-token`
2. Login with credentials: `POST /admin/login`
3. Access protected endpoints with session cookie
4. Logout: `POST /admin/logout`

## Public Endpoints

### Health Check

```http
GET /api/health
```

Returns system status and basic metrics.

**Response:**
```json
{
  "status": "healthy",
  "submissionCount": 42,
  "timestamp": "2025-06-02T10:30:00.000Z"
}
```

### CSRF Token

```http
GET /api/csrf-token
```

Returns CSRF protection token for form submissions.

**Response:**
```json
{
  "csrfToken": "abc123def456..."
}
```

### Submit Report

```http
POST /api/submit
Content-Type: application/json
X-CSRF-Token: [token from /csrf-token]
```

Submit encrypted whistleblowing report.

**Request Body:**
```json
{
  "encryptedMessage": "encrypted_base64_content",
  "encryptedFile": "encrypted_file_data_optional",
  "replyEmail": "optional@email.com",
  "hospitalId": "nhs_hospital_code"
}
```

**Response (Success):**
```json
{
  "message": "Submission received successfully",
  "id": 123,
  "submittedAt": "2025-06-02T10:30:00.000Z"
}
```

**Response (Error):**
```json
{
  "error": "Invalid submission data"
}
```

## Admin Endpoints

All admin endpoints require authentication and proper session management.

### Get Public Key

```http
GET /api/admin/public-key
```

Returns the public encryption key for client-side encryption.

**Response:**
```json
{
  "publicKey": "base64_encoded_public_key"
}
```

### Admin Login

```http
POST /api/admin/login
Content-Type: application/json
```

Authenticate admin user with username and password.

**Request Body:**
```json
{
  "username": "admin_username",
  "password": "admin_password"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Authentication successful",
  "sessionId": "unique_session_id"
}
```

**Response (Error):**
```json
{
  "error": "Invalid credentials"
}
```

### Admin Logout

```http
POST /api/admin/logout
Authorization: Admin session required
```

Terminate admin session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Check Admin Status

```http
GET /api/admin/status
Authorization: Admin session required
```

Check current authentication status.

**Response:**
```json
{
  "authenticated": true,
  "sessionId": "unique_session_id"
}
```

### Get Submissions

```http
GET /api/admin/submissions
Authorization: Admin session required
```

Retrieve all encrypted submissions (admin view only).

**Response:**
```json
[
  {
    "id": 1,
    "encryptedMessage": "encrypted_content",
    "encryptedFile": "encrypted_file_data",
    "replyEmail": "user@example.com",
    "sha256Hash": "submission_hash",
    "submittedAt": "2025-06-02T10:30:00.000Z"
  }
]
```

### Get Statistics

```http
GET /api/admin/stats
Authorization: Admin session required
```

Get submission statistics and metrics.

**Response:**
```json
{
  "submissionCount": 42,
  "submissionsWithFiles": 15,
  "submissionsWithReplyEmail": 28,
  "urgentSubmissions": 3,
  "lastSubmission": "2025-06-02T10:30:00.000Z"
}
```

### Decrypt Submission

```http
POST /api/admin/decrypt
Authorization: Admin session required
Content-Type: application/json
```

Decrypt specific submission content for review.

**Request Body:**
```json
{
  "submissionId": 123
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Decrypted submission content",
    "file": {
      "name": "evidence.pdf",
      "content": "base64_file_content",
      "type": "application/pdf"
    },
    "hospitalId": "nhs_hospital_code",
    "timestamp": "2025-06-02T10:30:00.000Z"
  }
}
```

## Error Responses

All endpoints return consistent error response format:

```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2025-06-02T10:30:00.000Z"
}
```

### Common Error Codes

- `400` - Bad Request (invalid input data)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `413` - Payload Too Large (file size exceeded)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Public endpoints**: 10 requests per minute per IP
- **Admin endpoints**: 50 requests per minute per session
- **Login endpoint**: 5 attempts per hour per IP

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1672531200
```

## Security Headers

All API responses include security headers:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## Encryption Details

### Client-Side Encryption

All sensitive data must be encrypted client-side before transmission:

1. Fetch public key from `/api/admin/public-key`
2. Encrypt submission data using libsodium
3. Submit encrypted payload to `/api/submit`

### Encryption Format

Encrypted data uses the following JSON structure:

```json
{
  "data": "base64_encrypted_content",
  "algorithm": "curve25519-xsalsa20-poly1305",
  "nonce": "base64_nonce",
  "signature": "base64_signature"
}
```

## Audit Logging

All administrative actions are logged with:

- User ID and session information
- Action performed and resource accessed
- Timestamp and IP address
- Request details and user agent

Audit logs are accessible through secure NHS monitoring systems.

## Data Retention

The API automatically enforces GDPR compliance:

- Submissions are retained for 90 days maximum
- Automatic purging runs daily
- Admin sessions expire after 4 hours
- Audit logs are retained for 7 years (NHS requirement)

## NHS Integration

### Hospital Codes

The API accepts NHS hospital codes for submission categorization. Valid codes are maintained in the NHS hospital database and updated regularly.

### Compliance Features

- GDPR-compliant data handling
- NHS Digital security standards
- Comprehensive audit trails
- Secure session management
- Data encryption at rest and in transit

## Development and Testing

### Test Environment

Test endpoints are available at:
```
https://test.whistlelite.nhs.uk/api
```

### SDK and Libraries

Official client libraries are available for:
- JavaScript/TypeScript
- Python
- C# (.NET)

Contact the development team for access to SDKs and integration support.