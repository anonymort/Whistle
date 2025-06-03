# GDPR Compliance Documentation

## Data Processing Record (Article 30)

### Controller Information
- **Organization**: Doctors' Association UK (DAUK)
- **Service**: NHS WhistleLite Anonymous Reporting Portal
- **Data Protection Officer**: [To be assigned]
- **Contact**: [Legal contact details]

### Processing Activities

#### 1. Anonymous Whistleblowing Reports
- **Purpose**: Patient safety incident reporting and healthcare quality improvement
- **Lawful Basis**: Article 6(1)(f) - Legitimate interest in public health and safety
- **Categories of Data**: Healthcare incident descriptions, hospital identifiers, incident dates, optional contact details
- **Data Subjects**: NHS staff, patients, healthcare workers
- **Recipients**: DAUK reviewers, HSSIB, CQC (aggregated reports only)
- **Retention Period**: 90 days maximum (automated deletion)
- **Security Measures**: Client-side encryption, no IP logging, minimal data collection

#### 2. Administrative Access Logs
- **Purpose**: Security monitoring and audit compliance
- **Lawful Basis**: Article 6(1)(f) - Legitimate interest in system security
- **Categories of Data**: Access timestamps, user actions, system events
- **Retention Period**: 12 months
- **Security Measures**: Encrypted storage, access controls

## Data Protection Impact Assessment (DPIA)

### Risk Assessment
- **High Risk Processing**: Yes - sensitive health data with potential retaliation risks
- **Automated Decision Making**: No
- **Large Scale Processing**: Potentially
- **Vulnerable Data Subjects**: Healthcare workers facing potential retaliation

### Mitigation Measures
1. Client-side encryption before transmission
2. Minimal data collection principle
3. No IP address logging
4. Optional contact details only
5. Automated data deletion after 90 days
6. Decryption keys held only by authorized DAUK reviewers

### Safeguards
- End-to-end encryption
- No persistent cookies
- Anonymous submission capability
- Secure deletion procedures
- Access logging and monitoring