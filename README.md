# WhistleLite

A secure, GDPR-compliant NHS whistleblowing platform providing advanced technological safeguards for anonymous reporting with a focus on user protection and ease of use.

## Overview

WhistleLite addresses critical gaps in existing NHS safety reporting systems like Datix by providing:

- **Anonymous Reporting**: True anonymity through end-to-end encryption
- **Mobile-First Design**: Accessible reporting from any device
- **GDPR Compliance**: Built-in data protection and retention policies
- **Advanced Security**: Military-grade encryption and audit logging
- **NHS Integration**: Comprehensive hospital database and workflow integration

## Key Features

### 🔒 Security & Privacy
- **End-to-End Encryption**: All submissions encrypted client-side using libsodium public-key cryptography
- **Anonymous Submissions**: No personal data collection required
- **Secure File Uploads**: Metadata stripping for PDFs, images, and documents
- **Data Retention**: Automatic 90-day data purging for GDPR compliance
- **Audit Logging**: Comprehensive security event tracking

### 🏥 NHS Integration
- **Hospital Directory**: Complete NHS hospital database with search functionality
- **Admin Dashboard**: Secure management interface for healthcare administrators
- **Submission Management**: Encrypted data viewing and response system
- **Production-Ready**: Suitable for NHS deployment with security standards compliance

### 🛡️ Advanced Protection
- **CSRF Protection**: Token-based request validation
- **Rate Limiting**: Brute force attack prevention
- **Session Security**: Secure admin authentication with bcrypt password hashing
- **File Validation**: Comprehensive security checks for uploaded content
- **Memory Protection**: Secure key management and storage

## Technology Stack

- **Frontend**: React + TypeScript with Vite
- **Backend**: Node.js + Express with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Encryption**: libsodium for public-key cryptography
- **Authentication**: bcrypt with secure session management
- **UI Framework**: Tailwind CSS with shadcn/ui components

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Environment variables configured

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/whistlelite.git
cd whistlelite
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Generate admin password hash**
```bash
node generate-admin-hash.js your_secure_password
# Add the output hash to your .env file as ADMIN_PASSWORD_HASH
```

5. **Set up database**
```bash
npm run db:push
```

6. **Start the application**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Environment Configuration

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/whistleblowing_db

# Session Security
SESSION_SECRET=your_64_character_random_secret_key_here

# Admin Authentication
ADMIN_USERNAME=your_secure_admin_username
ADMIN_PASSWORD_HASH=your_bcrypt_hashed_password_here

# Encryption Keys (recommended for production)
ADMIN_ENCRYPTION_PUBLIC_KEY=base64_public_encryption_key
ADMIN_ENCRYPTION_PRIVATE_KEY=base64_private_encryption_key
ADMIN_SIGNING_PUBLIC_KEY=base64_public_signing_key
ADMIN_SIGNING_PRIVATE_KEY=base64_private_signing_key
```

### Password Hash Generation

Generate a secure bcrypt password hash:

```bash
node generate-admin-hash.js your_secure_password
```

## Architecture

### Frontend Architecture
- **React Components**: Modular, reusable UI components
- **Form Management**: React Hook Form with Zod validation
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with responsive design

### Backend Architecture
- **Express Server**: RESTful API with TypeScript
- **Database Layer**: Drizzle ORM with PostgreSQL
- **Authentication**: Session-based admin authentication
- **Security Middleware**: CSRF protection, rate limiting, validation
- **Encryption**: Server-side key management and decryption

### Security Architecture
- **Client-Side Encryption**: All sensitive data encrypted before transmission
- **Zero-Knowledge Server**: Server cannot read submission content without admin keys
- **Key Separation**: Encryption and signing keys stored separately
- **Audit Trail**: All administrative actions logged with timestamps

## API Endpoints

### Public Endpoints
- `GET /api/health` - System health check
- `GET /api/csrf-token` - CSRF token generation
- `POST /api/submit` - Submit encrypted whistleblowing report
- `GET /api/admin/public-key` - Get public encryption key

### Admin Endpoints (Authentication Required)
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/status` - Check authentication status
- `GET /api/admin/submissions` - List all submissions
- `GET /api/admin/stats` - Get submission statistics
- `POST /api/admin/decrypt` - Decrypt submission content

## Security Features

### Encryption Implementation
- **Algorithm**: Curve25519 for key exchange, XSalsa20 for encryption
- **Key Management**: Separate encryption and signing key pairs
- **Perfect Forward Secrecy**: Each submission uses unique encryption
- **Signature Verification**: All submissions cryptographically signed

### Data Protection
- **Metadata Removal**: Automatic stripping from uploaded files
- **File Validation**: MIME type and signature verification
- **Size Limits**: Configurable upload size restrictions
- **Content Sanitization**: Input validation and XSS prevention

### Access Control
- **Admin Authentication**: Secure bcrypt password hashing
- **Session Management**: Secure session cookies with proper expiration
- **Rate Limiting**: Protection against brute force attacks
- **CSRF Protection**: Token-based request validation

## NHS Compliance

WhistleLite meets NHS Digital security standards for:

- **Data Protection**: GDPR-compliant data handling and retention
- **Access Control**: Secure authentication and authorization
- **Audit Logging**: Comprehensive security event monitoring
- **Encryption**: End-to-end data protection
- **Vulnerability Protection**: OWASP Top 10 security measures

## Development

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── data/          # Static data (NHS hospitals)
├── server/                # Express backend
│   ├── auth.ts           # Authentication utilities
│   ├── routes.ts         # API route handlers
│   ├── encryption.ts     # Cryptographic functions
│   ├── storage.ts        # Database operations
│   └── audit.ts          # Audit logging system
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema and types
└── tests/                # Test suites
```

### Database Schema

The application uses a minimal, secure database schema:

- **submissions**: Encrypted whistleblowing reports
- **admin_sessions**: Secure session storage

All sensitive data is encrypted client-side before storage.

### File Upload Security

WhistleLite implements comprehensive file security:

- **Metadata Stripping**: Removes EXIF data from images, document properties from PDFs
- **File Validation**: Checks file signatures and MIME types
- **Size Limits**: Configurable maximum file sizes
- **Encryption**: All files encrypted before storage

## Deployment

### Production Checklist

- [ ] Set unique ADMIN_USERNAME (not 'admin')
- [ ] Generate secure bcrypt password hash
- [ ] Configure strong SESSION_SECRET (64+ characters)
- [ ] Set encryption keys to prevent data loss
- [ ] Configure HTTPS/TLS termination
- [ ] Enable database firewall rules
- [ ] Set up monitoring and alerting
- [ ] Configure backup procedures

### Docker Deployment (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode requirements
- Implement comprehensive error handling
- Add security considerations for all features
- Update tests for new functionality
- Document API changes

## Testing

```bash
# Run security tests
npm run test:security

# Run encryption tests
npm run test:encryption

# Run data retention tests
npm run test:retention
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

For security vulnerabilities, please email security@whistlelite.nhs.uk instead of using the issue tracker.

## Support

- **Documentation**: See the `/docs` directory for detailed guides
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **NHS Support**: Contact your local NHS Digital team for deployment assistance

---

**WhistleLite** - Empowering safe, anonymous reporting in healthcare environments.