# WhistleLite Deployment Guide

## Production Deployment

This guide covers deploying WhistleLite for NHS environments with production-grade security.

## Prerequisites

- Node.js 20+ 
- PostgreSQL 14+
- SSL/TLS certificate
- Secure environment for secrets management

## Environment Setup

### 1. Database Configuration

Create a PostgreSQL database and user:

```sql
CREATE DATABASE whistlelite_prod;
CREATE USER whistlelite WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE whistlelite_prod TO whistlelite;
```

### 2. Environment Variables

Create a `.env` file with the following required variables:

```bash
# Database
DATABASE_URL=postgresql://whistlelite:secure_password@localhost:5432/whistlelite_prod
PGHOST=localhost
PGPORT=5432
PGUSER=whistlelite
PGPASSWORD=secure_password
PGDATABASE=whistlelite_prod

# Security
SESSION_SECRET=your_64_character_random_secret_key_here
ADMIN_USERNAME=nhs_admin
ADMIN_PASSWORD_HASH=generated_bcrypt_hash_here

# Encryption Keys (Required for production)
ADMIN_ENCRYPTION_PUBLIC_KEY=base64_public_encryption_key
ADMIN_ENCRYPTION_PRIVATE_KEY=base64_private_encryption_key
ADMIN_SIGNING_PUBLIC_KEY=base64_public_signing_key
ADMIN_SIGNING_PRIVATE_KEY=base64_private_signing_key

# Environment
NODE_ENV=production
```

### 3. Generate Secure Credentials

#### Admin Password Hash
```bash
node generate-admin-hash.js your_secure_admin_password
```

#### Session Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Encryption Keys
Start the application once to generate keys, then copy them from the console output to your environment variables.

## NHS Deployment Checklist

### Security Requirements
- [ ] HTTPS/TLS encryption enabled
- [ ] Firewall configured (ports 80, 443 only)
- [ ] Database access restricted to application server
- [ ] Admin credentials follow NHS password policy
- [ ] Session secret is 64+ random characters
- [ ] Encryption keys backed up securely
- [ ] Audit logging enabled and monitored

### Data Protection (GDPR)
- [ ] Data retention policy configured (90 days)
- [ ] Backup procedures documented
- [ ] Data processing agreement in place
- [ ] Privacy impact assessment completed
- [ ] Staff training on data handling completed

### Technical Configuration
- [ ] Production database configured
- [ ] SSL certificates installed
- [ ] Monitoring and alerting set up
- [ ] Log rotation configured
- [ ] Backup procedures tested
- [ ] Disaster recovery plan documented

## Server Configuration

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name whistlelite.nhs.uk;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name whistlelite.nhs.uk;
    return 301 https://$server_name$request_uri;
}
```

### Systemd Service

Create `/etc/systemd/system/whistlelite.service`:

```ini
[Unit]
Description=WhistleLite NHS Whistleblowing Platform
After=network.target

[Service]
Type=simple
User=whistlelite
WorkingDirectory=/opt/whistlelite
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/whistlelite/.env

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/whistlelite/logs

[Install]
WantedBy=multi-user.target
```

## Monitoring and Maintenance

### Health Monitoring

The application provides health check endpoints:

- `GET /api/health` - System status
- `GET /api/admin/stats` - Submission statistics

### Log Monitoring

Monitor these log patterns:

- Failed login attempts
- Encryption errors
- Database connection issues
- High submission volumes
- Audit log anomalies

### Regular Maintenance

#### Daily
- Check system health status
- Monitor audit logs for security events
- Verify backup completion

#### Weekly  
- Review submission statistics
- Check encryption key status
- Update system packages

#### Monthly
- Security vulnerability assessment
- Performance optimization review
- Disaster recovery testing

## Backup and Recovery

### Database Backup

```bash
#!/bin/bash
# Daily backup script
BACKUP_DIR="/backup/whistlelite"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -h localhost -U whistlelite whistlelite_prod > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep 30 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete
```

### Encryption Key Backup

Store encryption keys securely:

```bash
# Backup encryption keys
cp /opt/whistlelite/.env /secure/backup/location/env_backup_$(date +%Y%m%d).txt
```

### Recovery Procedures

1. **Database Recovery**
```bash
gunzip -c db_backup_YYYYMMDD_HHMMSS.sql.gz | psql -h localhost -U whistlelite whistlelite_prod
```

2. **Application Recovery**
```bash
systemctl stop whistlelite
git pull origin main
npm install
npm run build
systemctl start whistlelite
```

## Security Incident Response

### Incident Types

1. **Unauthorized Access Attempt**
   - Review audit logs
   - Check admin login attempts
   - Verify session security

2. **Data Breach Suspected**
   - Immediately secure system
   - Review encryption status
   - Contact NHS Digital security team

3. **System Compromise**
   - Isolate affected systems
   - Preserve evidence
   - Initiate recovery procedures

### Contact Information

- **NHS Digital Security**: security@nhs.net
- **Local IT Support**: [Your NHS Trust IT]
- **Application Support**: [Your development team]

## Performance Optimization

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_sessions_expire ON admin_sessions(expire);

-- Regular maintenance
VACUUM ANALYZE submissions;
VACUUM ANALYZE admin_sessions;
```

### Application Optimization

- Enable gzip compression
- Configure proper caching headers
- Monitor memory usage
- Optimize database connections

## Compliance Documentation

Maintain these documents for NHS compliance:

- Data Processing Impact Assessment (DPIA)
- Security Risk Assessment
- Backup and Recovery Procedures
- Incident Response Plan
- Staff Training Records
- Audit Log Review Reports