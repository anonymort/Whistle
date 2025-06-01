# Privacy Policy - NHS WhistleLite Portal

## Overview

NHS WhistleLite is designed to protect your privacy while enabling secure reporting of concerns within healthcare settings. This policy explains how we handle your data in compliance with UK GDPR regulations.

## Data We Collect

### What We Collect
- **Report Content**: Your written concerns (encrypted before transmission)
- **Optional Files**: Supporting documents, images, or audio (metadata automatically removed)
- **Optional Contact**: Email address for follow-up (only if you choose to provide it)
- **Technical Data**: IP address for rate limiting (not stored with submissions)

### What We Don't Collect
- Your name or personal details (unless voluntarily provided)
- Browsing history or tracking data
- Device fingerprints or persistent identifiers
- Location data beyond IP-based rate limiting

## How We Protect Your Data

### Encryption
- All reports are encrypted on your device before transmission
- We use military-grade libsodium encryption (sealed box cryptography)
- Only authorized administrators can decrypt submissions
- Encryption keys are rotated regularly for enhanced security

### Metadata Protection
- File metadata (including location, camera details, timestamps) is automatically stripped
- Original filenames are sanitized to prevent identification
- File types are validated to prevent malicious uploads

### Access Controls
- Admin access requires secure authentication
- Session-based security with automatic timeouts
- Rate limiting prevents abuse and protects system integrity
- All decryption activities are logged for audit purposes

## Data Retention

### Automatic Deletion
- All submissions are automatically deleted after 90 days
- No manual intervention required - deletion is programmatic
- Deleted data cannot be recovered

### Right to Erasure
- You can request immediate deletion of your submission
- Contact us with submission details for expedited removal
- We will confirm deletion within 72 hours

## Your Rights Under GDPR

### Access Rights
- Request details of any data we hold about you
- Receive a copy of your encrypted submission (if identifiable)

### Correction Rights
- Request correction of inaccurate information
- Provide additional context or clarification

### Deletion Rights
- Request immediate deletion of your submission
- Automatic deletion after 90 days regardless

### Portability Rights
- Receive your data in a structured, machine-readable format
- Transfer your concerns to another platform if desired

## Lawful Basis for Processing

We process your data under the following legal bases:
- **Public Interest**: Protecting patient safety and healthcare quality
- **Legitimate Interest**: Investigating and addressing reported concerns
- **Consent**: When you voluntarily provide contact information

## Data Sharing

### Who We Share With
- Authorized NHS personnel involved in investigation
- Legal authorities if required by law
- External investigators only when necessary for patient safety

### Who We Don't Share With
- Commercial organizations
- Marketing companies
- Unauthorized third parties
- Anyone outside the healthcare investigation process

## Security Measures

### Technical Safeguards
- End-to-end encryption using industry-standard algorithms
- Secure database storage with encryption at rest
- Regular security audits and penetration testing
- Automated vulnerability scanning

### Organizational Safeguards
- Staff training on data protection and confidentiality
- Access controls limiting who can view submissions
- Regular review of access permissions
- Incident response procedures for data breaches

## Contact Information

### Data Protection Officer
- **Email**: dpo@nhswhistle.uk
- **Phone**: 0800 XXX XXXX
- **Post**: NHS WhistleLite DPO, [Address]

### Support Team
- **Email**: support@nhswhistle.uk
- **Phone**: 0800 XXX XXXX
- **Hours**: Monday-Friday, 9:00-17:00

### Complaints
If you're unhappy with how we've handled your data:
1. Contact our Data Protection Officer first
2. Escalate to the Information Commissioner's Office (ICO)
   - **Website**: ico.org.uk
   - **Phone**: 0303 123 1113

## Changes to This Policy

We may update this privacy policy to reflect changes in:
- Legal requirements
- Technology improvements
- Service enhancements

**Last Updated**: January 2025
**Next Review**: July 2025

## Transparency Report

We believe in transparency about our data handling practices:
- **Total Submissions**: Updated monthly on our website
- **Data Breaches**: Any incidents reported to ICO within 72 hours
- **Access Requests**: Processed within 30 days as required by law

## Technical Details

For those interested in the technical implementation:
- **Encryption**: libsodium sealed box (XSalsa20 + Poly1305)
- **Key Management**: Separate encryption and signing keypairs
- **Storage**: PostgreSQL with encrypted columns
- **Retention**: Automated cron job for 90-day deletion
- **Audit Trail**: All admin actions logged with timestamps

This policy is written in plain English to ensure accessibility while maintaining legal compliance with UK GDPR requirements.