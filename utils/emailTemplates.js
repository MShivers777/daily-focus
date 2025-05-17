export const SPOUSE_LINK_TEMPLATE = {
  subject: "Join your spouse on Daily Focus",
  body: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb; margin-bottom: 24px;">Daily Focus - Marriage Journey</h1>
    
    <p>Hello!</p>
    
    <p>Your spouse has invited you to join them on Daily Focus - a platform for growing together in marriage and fitness.</p>
    
    <p>Click the button below to create your account and link with your spouse:</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
        Accept Invitation
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
    
    <p style="color: #666; font-size: 12px; text-align: center;">
      Daily Focus - Growing Together in Marriage and Fitness
    </p>
  </div>`
};
