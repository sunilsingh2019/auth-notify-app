import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from config.settings import (
    EMAIL_ENABLED, 
    EMAIL_HOST, 
    EMAIL_PORT, 
    EMAIL_USERNAME, 
    EMAIL_PASSWORD,
    EMAIL_FROM,
    EMAIL_FROM_NAME,
    FRONTEND_URL
)

# Set up logging
logger = logging.getLogger(__name__)

async def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send an email using SMTP.
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML content of the email
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if not EMAIL_ENABLED:
        logger.warning("Email sending is disabled. Set EMAIL_ENABLED=True to enable.")
        logger.info(f"Would have sent email to: {to_email}, Subject: {subject}")
        logger.debug(f"Email content: {html_content}")
        return False
    
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{EMAIL_FROM_NAME} <{EMAIL_FROM}>"
        message["To"] = to_email
        
        # Add HTML content
        message.attach(MIMEText(html_content, "html"))
        
        # Connect to SMTP server and send email
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
            server.send_message(message)
            
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False

async def send_verification_email(to_email: str, verification_token: str) -> bool:
    """
    Send a verification email with a token link.
    
    Args:
        to_email: Recipient email address
        verification_token: Verification token
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    # Create verification link
    verification_link = f"{FRONTEND_URL}/verify-email?token={verification_token}"
    
    # Create email subject
    subject = "Verify Your Email Address"
    
    # Create email content
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">Verify Your Email Address</h2>
            <p>Thank you for registering with Auth Notify App. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verification_link}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;">
                {verification_link}
            </p>
            <p>This link will expire in 24 hours.</p>
            <p>If you did not create an account, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #777;">This is an automated email. Please do not reply.</p>
        </div>
    </body>
    </html>
    """
    
    # Send email
    return await send_email(to_email, subject, html_content) 