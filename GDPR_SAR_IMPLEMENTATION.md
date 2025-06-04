# GDPR Subject Access Request (SAR) Implementation

## Overview

The NHS WhistleLite portal now includes a comprehensive Subject Access Request system to fulfill GDPR Article 15 obligations. This system allows administrators to efficiently search for, identify, and export personal data when individuals request access to their information.

## Key Features

### 1. SAR Request Management
- **Request Tracking**: Create, track, and manage SAR requests with unique identifiers
- **Due Date Monitoring**: Automatic 30-day compliance timeline tracking
- **Status Management**: Pending, Processing, Completed, Rejected status workflow
- **Request Types**: Support for Article 15 (Access), Article 16 (Rectification), Article 17 (Erasure), Article 20 (Portability)

### 2. Personal Data Search
- **Multi-criteria Search**: Search by name, email, hash, or hospital trust
- **Encrypted Data Search**: Decrypt and search within encrypted submissions
- **Real-time Results**: Immediate display of matching submissions
- **Privacy Protection**: Search terms are logged but anonymized in audit trails

### 3. Data Export Compliance
- **Structured Export**: JSON format with complete data categorization
- **GDPR Metadata**: Includes legal basis, retention periods, and processing purposes
- **Personal Data Categories**:
  - Personal Identifiers (name, email, job title, department, staff ID)
  - Incident Data (description, location, date, time, category, priority)
  - Processing Details (status, assignment, hash, timestamps)
- **Audit Trail**: All searches and exports are logged for compliance

## Technical Implementation

### Frontend Components
- **GDPRDataRequestPanel**: Main interface for SAR management
- **Search Interface**: Multi-type search with real-time filtering
- **Export Controls**: Bulk and individual submission export
- **Dashboard Integration**: Seamlessly integrated into admin dashboard

### Backend API Endpoints

#### Search Personal Data
```
POST /api/admin/gdpr/search
```
- **Purpose**: Search encrypted submissions for personal data
- **Authentication**: Admin only
- **Parameters**: 
  - `term`: Search term
  - `type`: Search type (name, email, hash, trust)
- **Response**: Array of matching submissions

#### Export Personal Data
```
POST /api/admin/gdpr/export
```
- **Purpose**: Export personal data for SAR compliance
- **Authentication**: Admin only
- **Parameters**: 
  - `submissionIds`: Array of submission IDs to export
- **Response**: Structured GDPR-compliant data export

### Security Features
- **Admin Authentication**: All SAR functions require admin authentication
- **Audit Logging**: Comprehensive logging of all SAR activities
- **Data Minimization**: Only necessary data fields are exported
- **Encryption**: Personal data remains encrypted during search operations

## GDPR Compliance Features

### Article 15 - Right of Access
- **30-day Response**: Automatic due date tracking
- **Complete Data**: Export includes all personal data categories
- **Processing Information**: Details about purposes, legal basis, retention
- **Data Recipients**: Information about data sharing (if applicable)

### Data Protection by Design
- **Privacy by Default**: Search results anonymized in logs
- **Data Minimization**: Only relevant data included in exports
- **Purpose Limitation**: Clear documentation of processing purposes
- **Retention Management**: Automatic retention period information

### Audit and Accountability
- **Search Logging**: All data searches logged with timestamps
- **Export Tracking**: Complete audit trail of data exports
- **Access Controls**: Role-based access to SAR functions
- **Data Integrity**: Hash verification for exported data

## Usage Instructions

### Creating a SAR Request
1. Navigate to Admin Dashboard → GDPR Data Requests tab
2. Click "New Request"
3. Fill in requester details:
   - Name and email address
   - Request type (Access, Rectification, Erasure, Portability)
   - Search criteria
   - Additional notes
4. Click "Create SAR Request"

### Searching for Personal Data
1. Select search type (Name, Email, Hash, Trust)
2. Enter search term
3. Click "Search"
4. Review matched submissions
5. Use "Decrypt" to view submission details
6. Export individual or bulk data

### Exporting Personal Data
1. Select submissions from search results
2. Click "Export" or "Export All"
3. System generates GDPR-compliant JSON export
4. File automatically downloads with timestamp
5. Export logged in audit trail

## Data Export Format

The system exports personal data in a structured JSON format:

```json
{
  "exportDate": "2024-01-15T10:30:00.000Z",
  "dataController": "DAUK Whistleblowing Portal",
  "legalBasis": "GDPR Article 6(1)(c) - Legal obligation",
  "purpose": "Subject Access Request - Article 15",
  "retentionPeriod": "6 months from submission date",
  "personalData": [
    {
      "submissionId": 123,
      "submissionDate": "2024-01-01T12:00:00.000Z",
      "dataCategories": {
        "personalIdentifiers": {
          "name": "Dr. Jane Smith",
          "email": "jane.smith@nhs.uk",
          "jobTitle": "Senior Nurse",
          "department": "Emergency Department",
          "staffId": "NS001234"
        },
        "incidentData": {
          "description": "[Encrypted incident description]",
          "location": "Ward 7A",
          "date": "2024-01-01",
          "time": "14:30",
          "category": "patient_safety",
          "priority": "high",
          "riskLevel": "medium"
        },
        "processingDetails": {
          "status": "investigating",
          "assignedTo": "Dr. Johnson",
          "lastUpdated": "2024-01-10T09:15:00.000Z",
          "sha256Hash": "abc123..."
        }
      },
      "dataSource": "Anonymous Whistleblowing Submission",
      "processingPurpose": "Patient safety incident investigation",
      "legalBasisDetail": "Processing necessary for compliance with legal obligation under Health and Safety at Work Act 1974"
    }
  ]
}
```

## Compliance Monitoring

### Dashboard Metrics
- **Active Requests**: Number of pending and processing SAR requests
- **Due This Week**: Urgent requests requiring immediate attention
- **Completed Requests**: Successfully fulfilled requests (30-day period)

### Alert System
- **Due Date Warnings**: Automatic alerts for requests approaching deadline
- **Overdue Notifications**: Immediate alerts for overdue requests
- **Volume Monitoring**: Track SAR request volume for capacity planning

## Legal and Regulatory Compliance

### GDPR Articles Addressed
- **Article 15**: Right of access by the data subject
- **Article 16**: Right to rectification
- **Article 17**: Right to erasure ('right to be forgotten')
- **Article 20**: Right to data portability

### NHS and Healthcare Compliance
- **Health and Safety at Work Act 1974**: Legal basis for incident processing
- **NHS Data Protection Standards**: Encryption and security requirements
- **Medical Device Regulations**: If applicable to incident reports

### Audit Requirements
- **ICO Compliance**: Ready for Information Commissioner's Office audits
- **NHS Digital Standards**: Meets NHS data protection requirements
- **Internal Audits**: Complete audit trail for organizational reviews

## Support and Maintenance

### Regular Tasks
- **Monthly Review**: Review pending SAR requests for compliance
- **Quarterly Audit**: Audit trail review and compliance assessment
- **Annual Training**: Staff training on GDPR SAR procedures

### Escalation Procedures
- **Overdue Requests**: Immediate management notification
- **Complex Requests**: Legal team consultation
- **Data Disputes**: Information governance team involvement

## Future Enhancements

### Planned Features
- **Automated SAR Processing**: AI-assisted data identification
- **Multi-language Support**: Support for Welsh and other languages
- **API Integration**: Integration with NHS Digital systems
- **Advanced Analytics**: SAR request trend analysis

### Integration Opportunities
- **NHS Identity**: Integration with NHS login systems
- **FHIR Standards**: Healthcare data interoperability
- **National Systems**: Connection to national reporting systems

This comprehensive SAR system ensures the NHS WhistleLite portal meets all GDPR obligations while maintaining the highest standards of data protection and privacy for healthcare whistleblowing.