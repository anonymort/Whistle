/**
 * SimpleLogin Integration for Anonymous Reply Service
 * Enables two-way communication while maintaining reporter anonymity
 */

interface SimpleLoginAlias {
  id: number;
  alias: string;
  creation_date: string;
  creation_timestamp: number;
  nb_forward: number;
  nb_block: number;
  nb_reply: number;
  enabled: boolean;
  note?: string;
}

interface CreateAliasRequest {
  alias_suffix?: string;
  signed_suffix?: string;
  mailbox_ids?: number[];
  note?: string;
  name?: string;
}

class SimpleLoginService {
  private apiKey: string;
  private baseUrl: string = 'https://app.simplelogin.io';

  constructor() {
    this.apiKey = process.env.SIMPLELOGIN_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('SIMPLELOGIN_API_KEY environment variable is required');
    }
  }

  /**
   * Create a new alias for anonymous communication
   */
  async createAlias(submissionId: string, note?: string): Promise<SimpleLoginAlias> {
    const aliasData: CreateAliasRequest = {
      alias_suffix: `whistle-${submissionId}`,
      note: note || `DAUK Whistleblowing Case ${submissionId}`,
      name: 'DAUK Anonymous Case'
    };

    const response = await fetch(`${this.baseUrl}/api/aliases`, {
      method: 'POST',
      headers: {
        'Authentication': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aliasData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SimpleLogin API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get alias information
   */
  async getAlias(aliasId: number): Promise<SimpleLoginAlias> {
    const response = await fetch(`${this.baseUrl}/api/aliases/${aliasId}`, {
      method: 'GET',
      headers: {
        'Authentication': this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SimpleLogin API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Update alias settings
   */
  async updateAlias(aliasId: number, updates: Partial<{ enabled: boolean; note: string }>): Promise<SimpleLoginAlias> {
    const response = await fetch(`${this.baseUrl}/api/aliases/${aliasId}`, {
      method: 'PATCH',
      headers: {
        'Authentication': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SimpleLogin API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Delete/disable alias when case is closed
   */
  async deleteAlias(aliasId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/aliases/${aliasId}`, {
      method: 'DELETE',
      headers: {
        'Authentication': this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SimpleLogin API error: ${response.status} - ${error}`);
    }
  }

  /**
   * Create reverse alias for DAUK to initiate contact
   */
  async createReverseAlias(aliasId: number, contactEmail: string): Promise<{ reverse_alias: string }> {
    const response = await fetch(`${this.baseUrl}/api/aliases/${aliasId}/contacts`, {
      method: 'POST',
      headers: {
        'Authentication': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contact: contactEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SimpleLogin API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Send email through anonymous alias
   */
  async sendAnonymousEmail(aliasEmail: string, subject: string, content: string): Promise<void> {
    // This would typically integrate with your email service (SendGrid)
    // to send emails from the DAUK domain through the SimpleLogin alias
    const emailData = {
      to: aliasEmail,
      from: 'cases@dauk.org', // Your verified sender
      subject: subject,
      html: content,
      text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    // Integration with SendGrid or your email service
    // This ensures emails appear to come from the anonymous system
    console.log('Sending anonymous email:', emailData);
  }
}

export const simpleLoginService = new SimpleLoginService();

/**
 * Generate anonymous reply ID and create SimpleLogin alias
 */
export async function createAnonymousReplyService(submissionId: string): Promise<{
  anonymousId: string;
  aliasEmail: string;
  aliasId: number;
}> {
  try {
    // Create alias through SimpleLogin
    const alias = await simpleLoginService.createAlias(
      submissionId,
      `DAUK Whistleblowing Case ${submissionId} - Anonymous Communication Channel`
    );

    return {
      anonymousId: `whistle-${submissionId}`,
      aliasEmail: alias.alias,
      aliasId: alias.id,
    };
  } catch (error) {
    console.error('Failed to create SimpleLogin alias:', error);
    throw new Error('Failed to set up anonymous reply service');
  }
}

/**
 * Handle case closure by disabling aliases
 */
export async function deactivateAnonymousReplyService(aliasId: number): Promise<void> {
  try {
    await simpleLoginService.updateAlias(aliasId, { 
      enabled: false,
      note: 'Case closed - Alias deactivated for privacy'
    });
  } catch (error) {
    console.error('Failed to deactivate SimpleLogin alias:', error);
    // Don't throw - this is cleanup, shouldn't block case closure
  }
}

/**
 * Send update to reporter through anonymous alias
 */
export async function sendAnonymousUpdate(
  aliasEmail: string,
  submissionId: string,
  updateContent: string,
  updateType: 'status_update' | 'request_info' | 'case_closure' = 'status_update'
): Promise<void> {
  const subjects = {
    status_update: `Case Update - Reference ${submissionId}`,
    request_info: `Additional Information Requested - Reference ${submissionId}`,
    case_closure: `Case Resolution - Reference ${submissionId}`,
  };

  const emailContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #1e40af;">DAUK Whistleblowing Case Update</h2>
      <p><strong>Case Reference:</strong> ${submissionId}</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        ${updateContent}
      </div>
      <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #6b7280;">
        This communication is sent through an anonymous relay service to protect your privacy.
        You can reply to this email and your response will be forwarded to the case reviewer anonymously.
      </p>
      <p style="font-size: 12px; color: #6b7280;">
        <strong>DAUK Confidential:</strong> Do not forward this email or share the case reference publicly.
      </p>
    </div>
  `;

  await simpleLoginService.sendAnonymousEmail(
    aliasEmail,
    subjects[updateType],
    emailContent
  );
}