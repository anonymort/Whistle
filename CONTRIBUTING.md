# Contributing to WhistleLite

Thank you for your interest in contributing to WhistleLite, the NHS whistleblowing platform. This document provides guidelines for contributing to the project while maintaining the high security and quality standards required for healthcare environments.

## Code of Conduct

WhistleLite is developed for NHS healthcare environments. All contributors must:

- Prioritize patient safety and data protection
- Follow NHS Digital security standards
- Maintain confidentiality of sensitive information
- Respect the anonymous nature of whistleblowing reports
- Adhere to professional healthcare IT standards

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Git version control
- Understanding of healthcare data protection requirements

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/whistlelite.git`
3. Install dependencies: `npm install`
4. Configure environment: `cp .env.example .env`
5. Set up database: `npm run db:push`
6. Start development server: `npm run dev`

## Development Guidelines

### Security First

All contributions must maintain the highest security standards:

- **Encryption**: Never compromise end-to-end encryption
- **Authentication**: Maintain secure session management
- **Input Validation**: Validate all user inputs
- **Audit Logging**: Log all security-relevant actions
- **Error Handling**: Never expose sensitive information in errors

### Code Quality Standards

#### TypeScript
- Use strict mode TypeScript configuration
- Provide explicit type annotations
- No `any` types without justification
- Handle all error cases properly

#### React Components
- Use functional components with hooks
- Implement proper error boundaries
- Follow accessibility guidelines (WCAG 2.1)
- Ensure mobile-responsive design

#### Backend Development
- Validate all API inputs with Zod schemas
- Use parameterized database queries
- Implement proper HTTP status codes
- Include comprehensive error handling

### Testing Requirements

All contributions must include appropriate tests:

```bash
# Run test suites
npm run test:security     # Security vulnerability tests
npm run test:encryption   # Encryption functionality tests
npm run test:retention    # Data retention compliance tests
npm run test:api          # API endpoint tests
```

### Documentation Standards

- Update API documentation for endpoint changes
- Include JSDoc comments for complex functions
- Update README.md for feature additions
- Maintain deployment documentation accuracy

## Contribution Types

### Bug Fixes

1. Create issue describing the bug
2. Include reproduction steps
3. Reference security implications if applicable
4. Submit pull request with fix and tests

### Security Enhancements

Security improvements are highly prioritized:

1. Report security issues privately first
2. Include threat model assessment
3. Provide comprehensive testing
4. Document security impact

### Feature Development

New features must align with NHS requirements:

1. Discuss feature proposal in issues
2. Ensure GDPR compliance
3. Maintain encryption standards
4. Include comprehensive documentation

### Performance Optimizations

1. Provide performance benchmarks
2. Ensure no security compromises
3. Test under NHS-scale loads
4. Document performance improvements

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Security review completed
- [ ] Documentation updated
- [ ] No hardcoded credentials or secrets
- [ ] Encryption standards maintained

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Security enhancement
- [ ] Performance improvement
- [ ] Documentation update

## Security Impact
- [ ] No security implications
- [ ] Enhances security
- [ ] Requires security review

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Security tests pass
- [ ] Manual testing completed

## NHS Compliance
- [ ] GDPR compliance maintained
- [ ] Data protection standards met
- [ ] Audit logging preserved
- [ ] Encryption standards maintained
```

### Review Process

1. **Automated Checks**: All CI/CD tests must pass
2. **Security Review**: Security-sensitive changes require specialist review
3. **Code Review**: Minimum two reviewer approval required
4. **NHS Compliance**: Healthcare compliance verification
5. **Documentation Review**: All documentation updates verified

## Coding Standards

### File Organization

```
client/src/
├── components/     # Reusable UI components
├── pages/          # Application pages
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
└── data/           # Static data files

server/
├── auth.ts         # Authentication utilities
├── routes.ts       # API route handlers
├── encryption.ts   # Cryptographic functions
├── storage.ts      # Database operations
└── audit.ts        # Audit logging system
```

### Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

### Error Handling

```typescript
// Good: Comprehensive error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  logger.error('Operation failed:', error);
  throw new ValidationError('Invalid input data');
}

// Bad: Exposing sensitive information
} catch (error) {
  throw new Error(`Database error: ${error.message}`);
}
```

### Security Patterns

```typescript
// Good: Input validation
const validatedData = submissionSchema.parse(req.body);

// Good: Parameterized queries
const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));

// Bad: String concatenation
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

## NHS-Specific Requirements

### Data Protection

- All personal data must be encrypted
- Implement proper data retention policies
- Maintain audit trails for compliance
- Follow NHS Digital security standards

### Accessibility

- Meet WCAG 2.1 AA standards
- Support assistive technologies
- Ensure keyboard navigation
- Provide alternative text for images

### Performance

- Optimize for NHS network conditions
- Minimize data transfer requirements
- Ensure responsive design for all devices
- Test under high-load conditions

## Release Process

### Version Management

WhistleLite follows semantic versioning:

- **Major** (1.0.0): Breaking changes or major security updates
- **Minor** (1.1.0): New features or significant enhancements
- **Patch** (1.1.1): Bug fixes or minor improvements

### Release Checklist

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] NHS compliance verified
- [ ] Deployment procedures tested

## Support and Communication

### Getting Help

- **Technical Issues**: Create GitHub issue
- **Security Concerns**: Email security team privately
- **NHS Deployment**: Contact local NHS Digital team
- **General Questions**: Use GitHub discussions

### Community Guidelines

- Be respectful and professional
- Focus on patient safety and data protection
- Share knowledge and best practices
- Collaborate effectively with healthcare professionals

## Recognition

Contributors to WhistleLite help improve patient safety across the NHS. Significant contributions are recognized through:

- GitHub contributor acknowledgments
- NHS Digital project recognition
- Professional development opportunities
- Healthcare IT community presentations

Thank you for contributing to safer healthcare environments through secure technology.