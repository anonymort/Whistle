# SimpleLogin Anonymous Reply Service Integration

## Overview
The SimpleLogin Premium integration enables secure two-way communication while maintaining complete reporter anonymity. This service creates unique email aliases for each whistleblowing case, allowing DAUK to send updates and receive replies without exposing the reporter's real email address.

## How It Works

### 1. Alias Creation Process
When a user selects "anonymous reply service":
- System generates a unique submission ID (first 12 characters of SHA-256 hash)
- Creates SimpleLogin alias: `whistle-[submission-id]@[your-domain].com`
- Stores encrypted alias information in database
- Enables two-way communication channel

### 2. Communication Flow
**Outbound (DAUK → Reporter):**
- DAUK sends case updates to the SimpleLogin alias
- SimpleLogin forwards messages to reporter's real email
- Reporter sees DAUK communication without exposing their identity

**Inbound (Reporter → DAUK):**
- Reporter replies to forwarded messages
- SimpleLogin creates reverse alias for anonymous replies
- DAUK receives replies without seeing reporter's real email
- All communication remains in case management system

### 3. Privacy Protection
- Real email addresses never stored in DAUK systems
- SimpleLogin handles all forwarding transparently
- Aliases automatically deactivated when cases close
- No tracking or logging of real identities

## Technical Implementation

### Database Schema Updates
```sql
-- Added to submissions table
simplelogin_alias_id VARCHAR(50),     -- SimpleLogin alias ID for management
encrypted_alias_email TEXT,          -- Encrypted alias email address
```

### API Integration
- **Create Alias**: `POST /api/aliases` - Creates new alias for submission
- **Update Alias**: `PATCH /api/aliases/{id}` - Modify alias settings
- **Delete Alias**: `DELETE /api/aliases/{id}` - Deactivate when case closes
- **Reverse Alias**: `POST /api/aliases/{id}/contacts` - Enable replies

### Service Functions
```typescript
createAnonymousReplyService(submissionId)  // Create new alias
sendAnonymousUpdate(alias, content)        // Send case updates
deactivateAnonymousReplyService(aliasId)   // Close communication
```

## SimpleLogin Premium Benefits
- **Unlimited aliases** - No limit on cases
- **Custom domains** - Professional DAUK-branded aliases
- **PGP encryption** - Additional security layer
- **Reverse aliases** - Reporter can initiate new conversations
- **Catch-all domains** - Flexible alias generation

## Security Features
- End-to-end encryption of all alias data
- No logging of real email addresses
- Automatic alias lifecycle management
- Integration with existing DAUK audit system
- GDPR-compliant data handling

## Cost Analysis
**SimpleLogin Premium: $36/year**
- Unlimited aliases for all whistleblowing cases
- Professional domain integration
- Advanced security features
- Significant value compared to alternative anonymous communication methods

## Case Management Integration
- Aliases linked to specific submissions in database
- Admin dashboard shows communication status
- Automatic deactivation on case closure
- Audit trail of all anonymous communications
- Integration with existing case workflow

## Fallback Behavior
If SimpleLogin API is unavailable:
- System automatically falls back to standard anonymous submission
- User notified of fallback via form messaging
- Case proceeds normally without anonymous reply capability
- No data loss or system failure

## Future Enhancements
- **Scheduled Messages**: Automatic case status updates
- **Template System**: Standardized communication templates
- **Multi-language Support**: Automated translation for international cases
- **Analytics Dashboard**: Anonymous communication metrics
- **Integration with CQC Reporting**: Direct forwarding to regulatory bodies

## Deployment Checklist
- [x] SimpleLogin API key configured
- [x] Database schema updated with alias fields
- [x] Submission form updated with anonymous reply option
- [x] API integration implemented
- [ ] Custom domain configured in SimpleLogin
- [ ] Email templates created for case communications
- [ ] Admin dashboard updated with alias management
- [ ] Testing with real SimpleLogin account

## Testing Protocol
1. **Alias Creation**: Verify aliases created successfully
2. **Outbound Communication**: Test DAUK → Reporter messages
3. **Inbound Replies**: Test Reporter → DAUK responses  
4. **Alias Management**: Verify deactivation on case closure
5. **Fallback Testing**: Confirm graceful degradation
6. **Security Validation**: Ensure no real email exposure