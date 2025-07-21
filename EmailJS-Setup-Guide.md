# EmailJS Setup Guide for J. Stark Invoicing System

## Quick Setup Steps

### 1. Create EmailJS Account
- Go to [EmailJS.com](https://www.emailjs.com)
- Sign up for a free account (200 emails/month)
- Verify your email address

### 2. Add Email Service
1. Click "Email Services" in sidebar
2. Click "Add New Service"
3. Choose your email provider:
   - **Gmail** (Recommended)
   - Outlook
   - Yahoo
   - Other SMTP

#### For Gmail:
- Click "Connect Account"
- Sign in with your Gmail account
- Allow EmailJS permissions
- Give your service a name (e.g., "JStark Invoice Sender")
- Copy the **Service ID** (looks like: `service_xxxxxxx`)

### 3. Create Email Template
1. Click "Email Templates" in sidebar
2. Click "Create New Template"
3. Configure as follows:

#### Template Settings:
- **Name**: Invoice Email Template
- **Subject**: Invoice #{{invoice_number}} from {{from_name}}

#### Template Content:
Copy and paste the HTML template from `email-template.html` into the content editor.

#### Template Variables:
Make sure these variables are included:
- `{{to_email}}` - Recipient email
- `{{to_name}}` - Customer name
- `{{from_name}}` - Business name
- `{{invoice_number}}` - Invoice number
- `{{invoice_date}}` - Invoice date
- `{{invoice_amount}}` - Total amount
- `{{due_date}}` - Payment due date
- `{{message}}` - Custom message
- `{{business_address}}` - Your business address
- `{{business_phone}}` - Your phone number
- `{{business_email}}` - Your email
- `{{attachment}}` - PDF attachment (base64)

#### Auto-Reply Settings (Optional):
- Enable auto-reply to confirm receipt
- Subject: "Receipt Confirmation - Invoice #{{invoice_number}}"
- Message: "Thank you for your email. We have received your invoice #{{invoice_number}}. If you have any questions, please contact us at {{business_phone}}."

### 4. Configure Attachments
1. In the template editor, click "Attachments" tab
2. Add new attachment:
   - **Filename**: `Invoice-{{invoice_number}}.pdf`
   - **Type**: Variable Attachment
   - **Parameter name**: `attachment`
   - **Content**: Will be provided by the app

### 5. Get Your API Keys
1. Click "Integration" in sidebar
2. Copy these three items:
   - **Service ID**: `service_xxxxxxx`
   - **Template ID**: `template_xxxxxxx`
   - **Public Key**: Your public key (NOT the private key!)

### 6. Configure in J. Stark Invoicing
1. Open the invoicing app
2. Click "Email Settings" button
3. Enter your:
   - Service ID
   - Template ID
   - Public Key
4. Click "Test Configuration"
5. Save Settings

## Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `to_email` | Customer email | john@example.com |
| `to_name` | Customer name | John Smith |
| `from_name` | Business name | Superior Concrete Leveling LLC |
| `invoice_number` | Invoice number | 1234 |
| `invoice_date` | Date created | January 15, 2024 |
| `invoice_amount` | Total amount | $1,250.00 |
| `due_date` | Payment due date | February 14, 2024 |
| `business_address` | Your address | 4373 N Myers Rd, Geneva, OH 44041 |
| `business_phone` | Your phone | (440) 415-2534 |
| `business_email` | Your email | justinstark64@yahoo.com |
| `message` | Custom message | (User-editable in send dialog) |
| `attachment` | PDF invoice | (Auto-generated base64) |

## Testing Your Setup

1. Create a test invoice in the app
2. Click "Email Invoice"
3. Use your own email for testing
4. Check that you receive:
   - Professional HTML email
   - PDF attachment
   - All details correctly filled

## Troubleshooting

### "Test email failed"
- Check all three keys are entered correctly
- Ensure template variables match exactly
- Verify email service is connected in EmailJS

### "No attachment received"
- Check attachment configuration in template
- Ensure parameter name is `attachment`
- Verify PDF generation is working

### "Email not received"
- Check spam folder
- Verify email service is active
- Check EmailJS dashboard for errors

## Email Limits

- **Free Plan**: 200 emails/month
- **Basic Plan**: 1,000 emails/month ($5)
- **Pro Plan**: 10,000 emails/month ($15)

## Support

- EmailJS Support: support@emailjs.com
- EmailJS Docs: https://www.emailjs.com/docs/
- J. Stark System: Contact your administrator