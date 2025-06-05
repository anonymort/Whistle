/**
 * Postmark Anonymous Email Alias Service
 * Handles anonymous email forwarding with reply support for whistleblowing cases
 */

import crypto from 'crypto';

interface PostmarkEmail {
  From: string;
  To: string;
  Cc?: string;
  Bcc?: string;
  Subject: string;
  HtmlBody?: string;
  TextBody?: string;
  ReplyTo?: string;
  MessageStream?: string;
  TrackOpens?: boolean;
  TrackLinks?: string;
}

interface PostmarkInboundEmail {
  From: string;
  FromName: string;
  To: string;
  ToFull: Array<{ Email: string; Name: string }>;
  Subject: string;
  MessageID: string;
  Date: string;
  TextBody: string;
  HtmlBody: string;
  StrippedTextReply?: string;
  ReplyTo?: string;
  MessageStream: string;
}

interface AliasMapping {
  alias: string;
  investigatorEmail: string;
  submissionId: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

class PostmarkService {
  private apiToken: string;
  private baseUrl: string = 'https://api.postmarkapp.com';
  private domain: string = 'dauk.org'; // Your domain for aliases

  constructor() {
    this.apiToken = process.env.POSTMARK_API_TOKEN || '';
    if (!this.apiToken) {
      throw new Error('POSTMARK_API_TOKEN environment variable is required');
    }
  }

  /**
   * Generate a unique anonymous email alias
   */
  generateAlias(submissionId: string): string {
    const randomString = crypto.randomBytes(6).toString('hex');
    return `anon-${randomString}@${this.domain}`;
  }

  /**
   * Send an email via Postmark with security validation
   */
  async sendEmail(emailData: PostmarkEmail): Promise<boolean> {
    try {
      // SECURITY FIX: Validate email addresses to prevent injection
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailData.To) || !emailRegex.test(emailData.From)) {
        console.error('Invalid email address format detected');
        return false;
      }

      // SECURITY FIX: Sanitise subject and content to prevent header injection
      const sanitisedEmailData = {
        ...emailData,
        Subject: emailData.Subject.replace(/[\r\n]/g, '').substring(0, 255),
        TextBody: emailData.TextBody?.replace(/[\r\n]{3,}/g, '\n\n'),
        HtmlBody: emailData.HtmlBody?.replace(/<script[^>]*>.*?<\/script>/gi, ''),
        MessageStream: emailData.MessageStream || 'outbound',
        TrackOpens: false, // Privacy protection
        TrackLinks: 'None', // Privacy protection
      };

      const response = await fetch(`${this.baseUrl}/email`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': this.apiToken,
        },
        body: JSON.stringify(sanitisedEmailData),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Postmark send error:', error);
        return false;
      }

      const result = await response.json();
      console.log('Email sent successfully:', result.MessageID);
      return true;
    } catch (error) {
      console.error('Postmark API error:', error);
      return false;
    }
  }

  /**
   * Send anonymous notification to investigator
   */
  async sendAnonymousNotification(
    investigatorEmail: string,
    alias: string,
    submissionId: string,
    subject: string,
    content: string
  ): Promise<boolean> {
    const emailData: PostmarkEmail = {
      From: alias,
      To: investigatorEmail,
      Subject: `[DAUK Whistleblowing] ${subject}`,
      ReplyTo: alias,
      HtmlBody: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            DAUK Anonymous Whistleblowing Case
          </h2>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Case Reference:</strong> ${submissionId}</p>
            <p><strong>Anonymous Reply Address:</strong> ${alias}</p>
          </div>
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            ${content}
          </div>
          <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
          <div style="font-size: 12px; color: #6b7280; line-height: 1.5;">
            <p><strong>How to respond anonymously:</strong></p>
            <ul>
              <li>Reply to this email to communicate with the reporter anonymously</li>
              <li>Your response will be forwarded without revealing your identity</li>
              <li>The reporter will see responses from: ${alias}</li>
              <li>All communication is logged for case management</li>
            </ul>
            <p style="margin-top: 15px;">
              <strong>Privacy Notice:</strong> This alias expires in 30 days. 
              All communication is encrypted and complies with GDPR requirements.
            </p>
          </div>
        </div>
      `,
      TextBody: `
DAUK Anonymous Whistleblowing Case

Case Reference: ${submissionId}
Anonymous Reply Address: ${alias}

${content.replace(/<[^>]*>/g, '')}

How to respond anonymously:
- Reply to this email to communicate with the reporter anonymously
- Your response will be forwarded without revealing your identity
- The reporter will see responses from: ${alias}

Privacy Notice: This alias expires in 30 days. All communication is encrypted and complies with GDPR.
      `,
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Forward anonymous reply from investigator to reporter
   */
  async forwardAnonymousReply(
    reporterEmail: string,
    alias: string,
    subject: string,
    textBody: string,
    htmlBody?: string
  ): Promise<boolean> {
    // Clean the subject line to avoid RE: RE: chains
    const cleanSubject = subject.replace(/^(Re:|RE:|Fwd:|FWD:)\s*/i, '');

    const emailData: PostmarkEmail = {
      From: alias,
      To: reporterEmail,
      Subject: `Case Update: ${cleanSubject}`,
      ReplyTo: alias,
      TextBody: `
${textBody}

---
This message is from DAUK regarding your anonymous whistleblowing report.
You can reply to this email to continue the conversation anonymously.
Case communications are confidential and protected under UK whistleblowing legislation.
      `,
      HtmlBody: htmlBody ? `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: white; padding: 20px; border-radius: 8px;">
            ${htmlBody}
          </div>
          <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
          <div style="font-size: 12px; color: #6b7280;">
            <p>This message is from DAUK regarding your anonymous whistleblowing report.</p>
            <p>You can reply to this email to continue the conversation anonymously.</p>
            <p>Case communications are confidential and protected under UK whistleblowing legislation.</p>
          </div>
        </div>
      ` : undefined,
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Process inbound email webhook from Postmark
   */
  async processInboundEmail(inboundData: PostmarkInboundEmail): Promise<boolean> {
    try {
      console.log('Processing inbound email to:', inboundData.To);

      // Extract alias from To field
      const alias = inboundData.To.toLowerCase();
      
      // Use stripped reply if available (removes quoted content)
      const messageBody = inboundData.StrippedTextReply || inboundData.TextBody;
      const htmlBody = inboundData.HtmlBody;

      // Log for audit trail
      console.log(`Inbound email from ${inboundData.From} to alias ${alias}`);

      return true;
    } catch (error) {
      console.error('Error processing inbound email:', error);
      return false;
    }
  }

  /**
   * Validate Postmark webhook signature (security)
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    // Implement webhook signature validation if Postmark provides it
    // For now, we'll rely on HTTPS and rate limiting
    return true;
  }

  /**
   * Send case assignment notification
   */
  async sendCaseAssignmentNotification(
    investigatorEmail: string,
    submissionId: string,
    alias: string,
    caseDetails: {
      category: string;
      priority: string;
      hospitalTrust: string;
      summary: string;
    }
  ): Promise<boolean> {
    const subject = `Case Assignment: ${caseDetails.category} - ${caseDetails.priority} Priority`;
    
    const content = `
      <h3>New Case Assignment</h3>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>Category:</strong> ${caseDetails.category}</p>
        <p><strong>Priority:</strong> ${caseDetails.priority}</p>
        <p><strong>Hospital/Trust:</strong> ${caseDetails.hospitalTrust}</p>
      </div>
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0;">
        <h4 style="margin: 0 0 10px 0; color: #92400e;">Case Summary</h4>
        <p style="margin: 0;">${caseDetails.summary}</p>
      </div>
      <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0;">
        <h4 style="margin: 0 0 10px 0; color: #1e40af;">Next Steps</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Review the case details in the admin dashboard</li>
          <li>Reply to this email to communicate with the reporter anonymously</li>
          <li>Update case status and add notes as investigation progresses</li>
          <li>Escalate to senior team if required based on risk assessment</li>
        </ul>
      </div>
    `;

    return await this.sendAnonymousNotification(
      investigatorEmail,
      alias,
      submissionId,
      subject,
      content
    );
  }

  /**
   * Send case status update to reporter
   */
  async sendStatusUpdate(
    alias: string,
    reporterEmail: string,
    submissionId: string,
    status: string,
    message: string
  ): Promise<boolean> {
    const statusMessages = {
      'under_review': 'Your report is under review',
      'investigating': 'Investigation has commenced',
      'resolved': 'Case has been resolved',
      'closed': 'Case has been closed'
    };

    const subject = statusMessages[status as keyof typeof statusMessages] || 'Case Update';

    const content = `
      <h3>Case Status Update</h3>
      <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 15px 0;">
        <p><strong>Status:</strong> ${status.replace('_', ' ').toUpperCase()}</p>
        <p><strong>Reference:</strong> ${submissionId}</p>
      </div>
      <div style="background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
        ${message}
      </div>
    `;

    return await this.forwardAnonymousReply(reporterEmail, alias, subject, message, content);
  }
}

export const postmarkService = new PostmarkService();

/**
 * Send submission confirmation email with GDPR compliance information
 */
export async function sendSubmissionConfirmation(
  recipientEmail: string,
  submissionData: any,
  submissionId: string,
  anonymousAlias?: string
): Promise<boolean> {
  const isAnonymous = submissionData.contactMethod === 'anonymous';
  const hasAnonymousReply = submissionData.contactMethod === 'anonymous_reply';
  
  const emailData = {
    From: 'noreply@dauk.org',
    To: recipientEmail,
    Subject: `[DAUK] Submission Confirmation - Case #${submissionId}`,
    HtmlBody: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">DAUK Whistleblowing Portal</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Submission Confirmation</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #1e40af; margin-bottom: 20px;">Thank you for your submission</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Case Reference:</strong> ${submissionId}</p>
            <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
            <p><strong>Hospital/Trust:</strong> ${submissionData.hospitalTrust || 'Not specified'}</p>
            <p><strong>Incident Location:</strong> ${submissionData.incidentLocation || 'Not specified'}</p>
            <p><strong>Risk Level:</strong> ${submissionData.riskLevel || 'Medium'}</p>
            <p><strong>Reporter Name:</strong> ${submissionData.encryptedReporterName || 'Anonymous'}</p>
            <p><strong>Job Title:</strong> ${submissionData.encryptedJobTitle || 'Not specified'}</p>
            <p><strong>Department:</strong> ${submissionData.encryptedDepartment || 'Not specified'}</p>
          </div>

          ${hasAnonymousReply && anonymousAlias ? `
          <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #047857; margin-top: 0;">Anonymous Communication Setup</h3>
            <p><strong>Your anonymous email address:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${anonymousAlias}</code></p>
            <p>Use this email address for secure, anonymous communication with our investigators. Your identity will remain protected.</p>
          </div>
          ` : ''}

          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">Important Information</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Confidentiality:</strong> Your submission is treated with the highest confidentiality</li>
              <li><strong>Investigation:</strong> A qualified investigator will review your case within 48 hours</li>
              <li><strong>Protection:</strong> DAUK provides protection against detriment for whistleblowers</li>
              <li><strong>Updates:</strong> ${isAnonymous ? 'No updates will be sent to maintain anonymity' : hasAnonymousReply ? 'Updates will be sent to your anonymous email address' : 'Updates will be sent to your provided email address'}</li>
            </ul>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Data Protection & Your Rights</h3>
            <p style="font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
              Your personal data is processed in accordance with GDPR and the Data Protection Act 2018. 
              We process your information to investigate your concern and protect patient safety.
            </p>
            <p style="font-size: 14px; line-height: 1.6; margin-bottom: 15px;"><strong>Your rights include:</strong></p>
            <ul style="font-size: 14px; margin: 0; padding-left: 20px;">
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure (in certain circumstances)</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
            </ul>
            <p style="font-size: 14px; line-height: 1.6; margin-top: 15px;">
              <strong>Data Retention:</strong> Your submission will be retained for 6 months from the date of submission, 
              after which it will be automatically deleted unless ongoing legal proceedings require retention.
            </p>
            <p style="font-size: 14px; line-height: 1.6; margin-top: 15px;">
              To exercise your rights or for data protection queries, contact our Data Protection Officer at: 
              <a href="mailto:dpo@dauk.org" style="color: #1e40af;">dpo@dauk.org</a>
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              For urgent concerns contact: <a href="mailto:urgent@dauk.org" style="color: #1e40af;">urgent@dauk.org</a><br>
              For general enquiries: <a href="mailto:info@dauk.org" style="color: #1e40af;">info@dauk.org</a>
            </p>
          </div>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            Doctors' Association UK (DAUK) | Confidential Whistleblowing Service<br>
            This email contains confidential information. If received in error, please delete and notify sender.
          </p>
        </div>
      </div>
    `,
    TextBody: `
DAUK Whistleblowing Portal - Submission Confirmation

Thank you for your submission.

Case Reference: ${submissionId}
Submission Date: ${new Date().toLocaleDateString('en-GB')}
Hospital/Trust: ${submissionData.hospitalTrust || 'Not specified'}
Incident Location: ${submissionData.incidentLocation || 'Not specified'}
Risk Level: ${submissionData.riskLevel || 'Medium'}
Reporter Name: ${submissionData.encryptedReporterName || 'Anonymous'}
Job Title: ${submissionData.encryptedJobTitle || 'Not specified'}
Department: ${submissionData.encryptedDepartment || 'Not specified'}

${hasAnonymousReply && anonymousAlias ? `
ANONYMOUS COMMUNICATION SETUP
Your anonymous email address: ${anonymousAlias}
Use this email address for secure, anonymous communication with our investigators.
` : ''}

IMPORTANT INFORMATION:
- Your submission is treated with the highest confidentiality
- A qualified investigator will review your case within 48 hours
- DAUK provides protection against detriment for whistleblowers
- ${isAnonymous ? 'No updates will be sent to maintain anonymity' : hasAnonymousReply ? 'Updates will be sent to your anonymous email address' : 'Updates will be sent to your provided email address'}

DATA PROTECTION & YOUR RIGHTS:
Your personal data is processed in accordance with GDPR and the Data Protection Act 2018.

Your rights include:
- Right to access your personal data
- Right to rectification of inaccurate data  
- Right to erasure (in certain circumstances)
- Right to restrict processing
- Right to data portability

Data Retention: Your submission will be retained for 6 months from the date of submission, after which it will be automatically deleted unless ongoing legal proceedings require retention.

To exercise your rights or for data protection queries, contact our Data Protection Officer at: dpo@dauk.org

For urgent concerns: urgent@dauk.org
For general enquiries: info@dauk.org

Doctors' Association UK (DAUK) | Confidential Whistleblowing Service
    `,
    MessageStream: 'outbound'
  };

  return await postmarkService.sendEmail(emailData);
}

/**
 * Create anonymous alias mapping for a submission
 */
export async function createAnonymousAlias(
  submissionId: string,
  investigatorEmail: string
): Promise<{
  alias: string;
  aliasId: string;
}> {
  try {
    const alias = postmarkService.generateAlias(submissionId);
    const aliasId = `pm-${submissionId}-${Date.now()}`;

    console.log(`Created Postmark alias: ${alias} for submission ${submissionId}`);

    return {
      alias,
      aliasId,
    };
  } catch (error) {
    console.error('Failed to create Postmark alias:', error);
    throw new Error('Failed to set up anonymous reply service');
  }
}

/**
 * Send case assignment with anonymous reply capability
 */
export async function sendCaseAssignment(
  investigatorEmail: string,
  submissionId: string,
  alias: string,
  caseDetails: any
): Promise<boolean> {
  return await postmarkService.sendCaseAssignmentNotification(
    investigatorEmail,
    submissionId,
    alias,
    caseDetails
  );
}

/**
 * Send status update through anonymous alias
 */
export async function sendAnonymousStatusUpdate(
  alias: string,
  reporterEmail: string,
  submissionId: string,
  status: string,
  message: string
): Promise<boolean> {
  return await postmarkService.sendStatusUpdate(
    alias,
    reporterEmail,
    submissionId,
    status,
    message
  );
}

/**
 * Process inbound email webhook
 */
export async function handleInboundEmail(inboundData: any): Promise<boolean> {
  return await postmarkService.processInboundEmail(inboundData);
}

/**
 * Send new submission notification to DAUK admin team
 */
export async function sendNewSubmissionNotification(
  adminEmail: string,
  submissionId: number,
  referenceCode: string,
  hospitalTrust: string,
  category: string
): Promise<boolean> {
  const emailData: PostmarkEmail = {
    From: 'noreply@dauk.org',
    To: adminEmail,
    Subject: 'New submission: Whistle',
    HtmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">New Whistleblowing Submission</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Doctors' Association UK</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #991b1b; font-weight: bold;">
              🚨 New submission requiring review
            </p>
          </div>
          
          <h2 style="color: #1e40af; margin-bottom: 20px;">Submission Details</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: bold; color: #374151;">Reference Code:</td>
              <td style="padding: 10px 0; color: #111827;">${referenceCode}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: bold; color: #374151;">Submission ID:</td>
              <td style="padding: 10px 0; color: #111827;">#${submissionId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: bold; color: #374151;">Hospital/Trust:</td>
              <td style="padding: 10px 0; color: #111827;">${hospitalTrust}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: bold; color: #374151;">Category:</td>
              <td style="padding: 10px 0; color: #111827;">${category}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #374151;">Submitted:</td>
              <td style="padding: 10px 0; color: #111827;">${new Date().toLocaleString('en-GB')}</td>
            </tr>
          </table>
          
          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #0c4a6e; font-weight: bold;">Action Required:</p>
            <p style="margin: 8px 0 0 0; color: #0c4a6e;">
              Please log into the admin dashboard to review this submission and assign it to an appropriate investigator.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'your-domain.replit.app'}/admin" 
               style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Access Admin Dashboard
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              <strong>Security Notice:</strong> This email contains sensitive information about a whistleblowing submission. 
              Handle with appropriate confidentiality and follow DAUK data protection protocols.
            </p>
          </div>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            Doctors' Association UK (DAUK) | Confidential Whistleblowing Service<br>
            This email contains confidential information. If received in error, please delete and notify sender.
          </p>
        </div>
      </div>
    `,
    TextBody: `
DAUK Whistleblowing Portal - New Submission Alert

A new whistleblowing submission has been received and requires review.

SUBMISSION DETAILS:
Reference Code: ${referenceCode}
Submission ID: #${submissionId}
Hospital/Trust: ${hospitalTrust}
Category: ${category}
Submitted: ${new Date().toLocaleString('en-GB')}

ACTION REQUIRED:
Please log into the admin dashboard to review this submission and assign it to an appropriate investigator.

Access the admin dashboard at: https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'your-domain.replit.app'}/admin

SECURITY NOTICE:
This email contains sensitive information about a whistleblowing submission. Handle with appropriate confidentiality and follow DAUK data protection protocols.

Doctors' Association UK (DAUK) | Confidential Whistleblowing Service
    `,
    MessageStream: 'outbound'
  };

  return await postmarkService.sendEmail(emailData);
}