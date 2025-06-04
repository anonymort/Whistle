# DAUK Whistle - NHS Whistleblowing Portal

A production-ready, GDPR-compliant whistleblowing platform specifically designed for NHS healthcare environments. Built with advanced security architecture and comprehensive regulatory compliance features.

## Overview

DAUK Whistle provides secure, anonymous reporting capabilities for NHS staff with enterprise-grade security and full regulatory compliance:

- **NHS Datix-Style Reporting**: Comprehensive incident reporting with familiar healthcare workflows
- **End-to-End Encryption**: Military-grade libsodium encryption protecting all submissions
- **GDPR Subject Access Requests**: Built-in SAR processing with 30-day compliance tracking
- **Anonymous Email System**: Postmark-powered anonymous communication between reporters and investigators
- **Mobile-Optimized**: Responsive design tested across all device types
- **Production Security**: Comprehensive audit logging and security monitoring

## Key Features

### 🔒 Security & Privacy
- **End-to-End Encryption**: All submissions encrypted client-side using libsodium public-key cryptography
- **Anonymous Communication**: Postmark-powered anonymous email aliases with reply capability
- **Secure File Uploads**: Metadata stripping for documents with comprehensive validation
- **Data Retention**: Automatic 6-month data purging with GDPR compliance monitoring
- **Comprehensive Audit Logging**: All administrative actions tracked with IP addresses and timestamps
- **CSRF Protection**: Token-based request validation preventing cross-site attacks
- **Rate Limiting**: Brute force protection across all endpoints

### 🏥 NHS Healthcare Integration
- **Complete NHS Hospital Database**: Searchable directory of all UK NHS trusts and hospitals
- **Datix-Style Incident Reporting**: Familiar NHS workflow with enhanced security features
- **Admin Dashboard**: Comprehensive case management with real-time statistics
- **Investigator Management**: Role-based access control with department assignments
- **Case Notes System**: Internal and external notes with investigator collaboration
- **Priority & Risk Assessment**: Critical case identification with automated escalation
- **GDPR Subject Access Requests**: Built-in SAR processing with 30-day compliance tracking
- **Anonymous Reply Service**: Two-way communication maintaining reporter anonymity

### 📊 GDPR Compliance & Data Protection
- **Subject Access Requests**: Built-in SAR processing with automated search and export
- **Data Retention Management**: Automatic 6-month purging with compliance monitoring
- **Personal Data Search**: Advanced search capabilities across all stored data
- **Data Export Tools**: Structured export of personal data for SAR compliance
- **Right to Erasure**: Manual and automated data deletion capabilities
- **Consent Management**: Clear data processing consent with withdrawal options
- **Privacy Impact Assessment**: Built-in privacy protection measures

## Technology Stack

- **Frontend**: React + TypeScript with Vite and TanStack Query
- **Backend**: Node.js + Express with TypeScript and comprehensive middleware
- **Database**: PostgreSQL with Drizzle ORM and automated migrations
- **Encryption**: libsodium for public-key cryptography with key rotation
- **Authentication**: bcrypt with secure session management and CSRF protection
- **UI Framework**: Tailwind CSS with shadcn/ui components and responsive design
- **Email Services**: Postmark for anonymous email aliases and notifications
- **Monitoring**: Comprehensive audit logging and data retention management

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Environment variables configured

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/whistle.git
cd whistle
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
- `GET /api/health` - System health check and status
- `GET /api/csrf-token` - CSRF token generation for form protection
- `POST /api/submit` - Submit encrypted whistleblowing report with file upload
- `GET /api/admin/public-key` - Get public encryption key for client-side encryption

### Admin Endpoints (Authentication Required)
- `POST /api/admin/login` - Admin authentication with bcrypt verification
- `POST /api/admin/logout` - Admin logout and session cleanup
- `GET /api/admin/check-auth` - Check authentication status
- `GET /api/admin/submissions` - List all submissions with filtering
- `GET /api/admin/stats` - Get comprehensive submission statistics
- `POST /api/admin/decrypt` - Decrypt submission content with audit logging
- `PUT /api/admin/submissions/:id` - Update submission status, priority, and assignment
- `DELETE /api/admin/submissions/:id` - Delete submission with audit trail
- `GET /api/admin/investigators` - List all investigators with status
- `POST /api/admin/investigators` - Create new investigator account
- `PATCH /api/admin/investigators/:id` - Update investigator details
- `POST /api/admin/case-notes` - Add case note to submission
- `DELETE /api/admin/case-notes/:id` - Delete case note
- `GET /api/admin/case-notes/:submissionId` - Get case notes for submission
- `POST /api/admin/rotate-keys` - Rotate encryption keys
- `GET /api/admin/aggregated-report` - Generate aggregated analytics report

### GDPR Compliance Endpoints
- `POST /api/admin/gdpr/search` - Search for personal data across all systems
- `POST /api/admin/gdpr/export` - Export personal data for Subject Access Requests
- `POST /api/admin/gdpr/retention-check` - Manual data retention policy check
- `DELETE /api/admin/gdpr/purge-old-data` - Purge data older than retention period

### Anonymous Communication Endpoints
- `POST /api/postmark/inbound` - Handle inbound anonymous email webhook
- `POST /api/admin/send-anonymous-notification` - Send notification through anonymous alias

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

## Healthcare Compliance

Whistle meets healthcare security standards for:

- **Data Protection**: GDPR-compliant data handling and retention
- **Access Control**: Secure authentication and authorization with role-based permissions
- **Audit Logging**: Comprehensive security event monitoring
- **Encryption**: End-to-end data protection
- **Vulnerability Protection**: OWASP Top 10 security measures
- **Case Management**: Full audit trail for submission lifecycle
- **Email Security**: Secure investigator notifications with SendGrid integration

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

The application uses a comprehensive, secure database schema:

- **submissions**: Encrypted whistleblowing reports with metadata
- **investigators**: Healthcare professional accounts with role-based access
- **case_notes**: Investigation notes and communication logs
- **audit_logs**: Comprehensive security and action audit trail
- **sessions**: Secure session storage for admin and investigator authentication

All sensitive data is encrypted client-side before storage.

### File Upload Security

Whistle implements comprehensive file security:

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
- [ ] Configure SendGrid API key for email notifications
- [ ] Configure HTTPS/TLS termination
- [ ] Enable database firewall rules
- [ ] Set up monitoring and alerting
- [ ] Configure backup procedures
- [ ] Create initial investigator accounts
- [ ] Test case assignment workflow

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

## Current Features (v2.0)

### NHS Datix-Style Submission System
- Comprehensive incident reporting with familiar NHS workflows
- Complete UK NHS hospital and trust database integration
- Advanced categorization with patient safety impact assessment
- Anonymous, email, and anonymous reply communication options
- Secure file upload with metadata stripping and validation
- Event date/time tracking with location specificity

### Advanced Admin Dashboard
- Real-time submission statistics with visual analytics
- Comprehensive case management with status tracking
- Investigator assignment and workload distribution
- Case notes system with internal/external visibility controls
- Encryption key rotation and security management
- Mobile-optimized responsive design across all devices

### GDPR Subject Access Request System
- Built-in SAR processing with automated personal data search
- 30-day compliance tracking with deadline monitoring
- Structured data export for regulatory compliance
- Personal data identification across all system components
- Right to erasure implementation with audit trails

### Anonymous Communication Platform
- Postmark-powered anonymous email aliases
- Two-way communication maintaining reporter anonymity
- Investigator notification system with case assignments
- Anonymous reply capability for ongoing correspondence
- Secure email forwarding with encryption protection

### Enhanced Security Architecture
- libsodium public-key cryptography with key rotation
- Comprehensive audit logging with IP tracking
- CSRF protection across all endpoints
- Advanced rate limiting and brute force protection
- Automatic data retention with 6-month purging
- Session security with secure cookie management

## Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/whistle_db
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=whistle_db

# Authentication & Security
SESSION_SECRET=your_64_character_session_secret
ADMIN_USERNAME=Admin
ADMIN_PASSWORD_HASH=your_bcrypt_hash

# Encryption Keys (Auto-generated if not provided)
ADMIN_ENCRYPTION_PUBLIC_KEY=base64_encoded_public_key
ADMIN_ENCRYPTION_PRIVATE_KEY=base64_encoded_private_key
ADMIN_SIGNING_PUBLIC_KEY=base64_encoded_signing_public_key
ADMIN_SIGNING_PRIVATE_KEY=base64_encoded_signing_private_key

# Email Services (Required for anonymous communication)
POSTMARK_API_TOKEN=your_postmark_api_token
SENDGRID_API_KEY=your_sendgrid_api_key
SIMPLELOGIN_API_KEY=your_simplelogin_api_key

# Development Environment
NODE_ENV=development
REPL_ID=your_replit_id
REPLIT_DOMAINS=your-domain.replit.app
```

## Security

For security vulnerabilities, please contact the development team through secure channels.

## Production Deployment Checklist

### Pre-Deployment Security Review
- [ ] Change default ADMIN_USERNAME from 'Admin' to organization-specific value
- [ ] Generate secure bcrypt password hash using `node generate-admin-hash.js`
- [ ] Configure unique SESSION_SECRET (minimum 64 characters)
- [ ] Set up HTTPS/TLS termination with valid certificates
- [ ] Configure database firewall rules and access controls
- [ ] Review and configure CORS settings for production domains
- [ ] Set up monitoring and alerting for security events
- [ ] Configure backup procedures for encryption keys and database

### Email Service Configuration
- [ ] Set up Postmark account and configure API token for anonymous aliases
- [ ] Configure SendGrid account for investigator notifications (optional)
- [ ] Set up SimpleLogin integration for enhanced anonymity (optional)
- [ ] Configure domain authentication for email services
- [ ] Test anonymous email forwarding and reply functionality

### NHS Trust Integration
- [ ] Review and customize NHS hospital database for your region
- [ ] Configure trust-specific investigator accounts
- [ ] Set up department mapping for case routing
- [ ] Test investigator assignment workflows
- [ ] Configure case escalation procedures

### GDPR Compliance Verification
- [ ] Review data retention policy (default 6 months)
- [ ] Configure automated data purging schedules
- [ ] Test Subject Access Request processing
- [ ] Verify personal data export functionality
- [ ] Document data processing procedures for audit

### Performance and Monitoring
- [ ] Configure database connection pooling for production load
- [ ] Set up application performance monitoring
- [ ] Configure log aggregation and security monitoring
- [ ] Test system under expected user load
- [ ] Set up automated backup verification

## Support

- **Documentation**: Comprehensive guides available in project documentation
- **Security Issues**: Report vulnerabilities through secure channels
- **NHS Deployment**: Contact your Trust's IT security team for deployment guidance
- **GDPR Compliance**: Built-in compliance tools with automated monitoring

## License & Compliance

This project is licensed under the MIT License. The NHS whistleblowing portal includes:

- **GDPR Article 6 & 9 Compliance**: Lawful basis for processing with special category protections
- **NHS Data Security Standards**: Meets healthcare data protection requirements
- **Information Governance**: Built-in audit trails and access controls
- **Cyber Essentials**: Architecture designed for UK government security standards

---

**DAUK Whistle** - Production-ready NHS whistleblowing platform with comprehensive security and GDPR compliance.