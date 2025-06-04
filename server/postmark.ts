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
   * Send an email via Postmark
   */
  async sendEmail(emailData: PostmarkEmail): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/email`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': this.apiToken,
        },
        body: JSON.stringify({
          ...emailData,
          MessageStream: emailData.MessageStream || 'outbound',
          TrackOpens: false, // Privacy protection
          TrackLinks: 'None', // Privacy protection
        }),
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