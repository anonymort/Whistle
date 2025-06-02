# Whistle

A secure, GDPR-compliant DAUK whistleblowing platform providing advanced technological safeguards for anonymous reporting with a focus on user protection and ease of use.

## Overview

Whistle addresses critical gaps in existing healthcare safety reporting systems by providing:

- **Anonymous Reporting**: True anonymity through end-to-end encryption
- **Mobile-First Design**: Accessible reporting from any device
- **GDPR Compliance**: Built-in data protection and retention policies
- **Advanced Security**: Military-grade encryption and audit logging
- **Healthcare Integration**: Comprehensive hospital database and workflow integration

## Key Features

### 🔒 Security & Privacy
- **End-to-End Encryption**: All submissions encrypted client-side using libsodium public-key cryptography
- **Anonymous Submissions**: No personal data collection required
- **Secure File Uploads**: Metadata stripping for documents (PDF, DOC, DOCX, PPT, CSV, TXT only)
- **Data Retention**: Automatic 90-day data purging for GDPR compliance
- **Audit Logging**: Comprehensive security event tracking

### 🏥 Healthcare Integration
- **Hospital Directory**: Complete UK hospital database with search functionality
- **Admin Dashboard**: Secure management interface for healthcare administrators
- **Investigator Management**: Role-based access control with investigator assignment
- **Case Management**: Advanced workflow system with status tracking and priority levels
- **Email Notifications**: Automated investigator notifications for case assignments
- **Analytics Dashboard**: Comprehensive reporting with national overview and trust-by-trust analysis
- **Submission Management**: Encrypted data viewing and response system
- **Production-Ready**: Suitable for healthcare deployment with security standards compliance

### 🛡️ Advanced Protection
- **CSRF Protection**: Token-based request validation
- **Rate Limiting**: Brute force attack prevention
- **Session Security**: Secure admin authentication with bcrypt password hashing
- **File Validation**: Secure document type restrictions (PDF, DOC, DOCX, PPT, CSV, TXT)
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
- `PUT /api/admin/submissions/:id` - Update submission status and priority
- `DELETE /api/admin/submissions/:id` - Delete submission
- `GET /api/admin/investigators` - List all investigators
- `POST /api/admin/investigators` - Create new investigator
- `PUT /api/admin/investigators/:id` - Update investigator
- `POST /api/admin/case-notes` - Add case note to submission
- `DELETE /api/admin/case-notes/:id` - Delete case note

### Investigator Endpoints (Authentication Required)
- `POST /api/investigator/login` - Investigator authentication
- `GET /api/investigator/submissions` - List assigned submissions
- `POST /api/investigator/case-notes` - Add case note to assigned submission

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

## Current Features (v1.0)

### Submission Management
- End-to-end encrypted anonymous submissions
- Hospital/trust selection from comprehensive UK database
- File upload with metadata stripping
- Automatic 90-day data retention

### Admin Dashboard
- Comprehensive case management interface
- Real-time submission statistics
- Bulk data purging capabilities
- Encryption key management

### Investigator System
- Role-based access control
- Case assignment and tracking
- Email notifications for new assignments
- Investigation notes and communication

### Analytics & Reporting
- National overview dashboard
- Trust-by-trust analysis
- Category breakdown charts
- Timeline and trend analysis
- Performance metrics tracking

### Security Features
- libsodium end-to-end encryption
- CSRF protection
- Rate limiting
- Comprehensive audit logging
- Session security

## Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/whistle_db
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=whistle_db

# Authentication
SESSION_SECRET=your_64_character_session_secret
ADMIN_USERNAME=Admin
ADMIN_PASSWORD_HASH=your_bcrypt_hash

# Encryption Keys
ADMIN_ENCRYPTION_PUBLIC_KEY=base64_encoded_public_key
ADMIN_ENCRYPTION_PRIVATE_KEY=base64_encoded_private_key
ADMIN_SIGNING_PUBLIC_KEY=base64_encoded_signing_public_key
ADMIN_SIGNING_PRIVATE_KEY=base64_encoded_signing_private_key

# Email Configuration (Optional)
SENDGRID_API_KEY=your_sendgrid_api_key
```

## Security

For security vulnerabilities, please contact the development team through secure channels.

## Support

- **Documentation**: See the `/docs` directory for detailed guides
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Healthcare Support**: Contact your local IT team for deployment assistance

---

**Whistle** - Empowering safe, anonymous reporting in healthcare environments.