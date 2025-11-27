# Microsoft Power Automate Configuration Guide

## Overview
This guide provides step-by-step instructions for implementing three key Power Automate flows to streamline your business operations.

---

## Flow 1: Email Monitoring for Client Communications

### Purpose
Monitor shared mailbox or team email for client communications and organize/notify team members.

### Configuration Steps

**Trigger:** When a new email arrives (V3)
- **Folder:** Inbox
- **Include Attachments:** Yes (if needed)
- **From:** (Optional) Add specific client domains or leave blank for all

**Condition:** Check if email is relevant
- Add condition to filter by:
  - Subject contains keywords: "invoice", "order", "quote", "urgent", etc.
  - From address contains: "@clientdomain.com"
  - Importance: High (optional)

**Action 1:** Post message in Teams channel
- **Team:** Your team name
- **Channel:** Client Communications
- **Message:** 
```
🔔 New Client Email Alert

**From:** @{triggerOutputs()?['body/from']}
**Subject:** @{triggerOutputs()?['body/subject']}
**Received:** @{triggerOutputs()?['body/receivedDateTime']}

**Preview:** @{triggerOutputs()?['body/bodyPreview']}

[View Email](@{triggerOutputs()?['body/webLink']})
```

**Action 2:** Create item in SharePoint list (optional tracking)
- **Site Address:** Your SharePoint site
- **List Name:** Client Communications Log
- **Fields:**
  - Title: @{triggerOutputs()?['body/subject']}
  - ClientEmail: @{triggerOutputs()?['body/from']}
  - ReceivedDate: @{triggerOutputs()?['body/receivedDateTime']}
  - Priority: High/Medium/Low (use conditions)

**Action 3:** Save attachments (if any)
- **Condition:** If Has Attachments = true
- **Apply to each:** Attachments
- **Create file in SharePoint:**
  - Site: Your SharePoint site
  - Folder: /Client Documents/@{triggerOutputs()?['body/from']}
  - File Name: @{items('Apply_to_each')?['name']}
  - File Content: @{items('Apply_to_each')?['contentBytes']}

### Advanced Filters (Optional)
Add a **Parse JSON** action to extract specific data patterns from email body:
- Invoice numbers: Use regex or text parsing
- Client names: Extract from subject/body
- Amounts: Parse currency values

---

## Flow 2: SharePoint File Upload Notifications

### Purpose
Notify team via Teams when files are uploaded to specific SharePoint document libraries.

### Configuration Steps

**Trigger:** When a file is created (properties only)
- **Site Address:** Your SharePoint site
- **Library Name:** Select target library (e.g., "Client Invoices", "Contracts")

**Action 1:** Get file properties
- **Site Address:** Use same site
- **Library Name:** Use same library
- **Id:** @{triggerOutputs()?['body/{Identifier}']}

**Action 2:** Get file content (for preview/attachment)
- **Site Address:** Use same site
- **File identifier:** @{triggerOutputs()?['body/{Identifier}']}

**Action 3:** Post adaptive card in Teams
- **Team:** Your team
- **Channel:** File Notifications
- **Adaptive Card:**
```json
{
  "type": "AdaptiveCard",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.4",
  "body": [
    {
      "type": "TextBlock",
      "text": "📁 New File Uploaded",
      "weight": "bolder",
      "size": "large",
      "color": "accent"
    },
    {
      "type": "FactSet",
      "facts": [
        {
          "title": "File Name:",
          "value": "@{triggerOutputs()?['body/{FilenameWithExtension}']}"
        },
        {
          "title": "Uploaded By:",
          "value": "@{triggerOutputs()?['body/Author/DisplayName']}"
        },
        {
          "title": "Location:",
          "value": "@{triggerOutputs()?['body/{Path}']}"
        },
        {
          "title": "Size:",
          "value": "@{triggerOutputs()?['body/Size']} bytes"
        },
        {
          "title": "Modified:",
          "value": "@{triggerOutputs()?['body/Modified']}"
        }
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "Open File",
      "url": "@{triggerOutputs()?['body/{Link}']}"
    }
  ]
}
```

**Action 4 (Optional):** Send email notification
- **To:** Relevant team members
- **Subject:** New file uploaded: @{triggerOutputs()?['body/{FilenameWithExtension}']}
- **Body:** Include file details and link

### Multiple Libraries Setup
To monitor multiple SharePoint libraries:
1. Create separate flows for each library, OR
2. Use a single flow with SharePoint webhooks that monitors the entire site

---

## Flow 3: Invoice and Cash Flow Management

### Purpose
Track invoices, payment status, and cash flow projections automatically.

### Part A: Invoice Creation & Tracking

**Trigger:** When a file is created in SharePoint
- **Site Address:** Your SharePoint site
- **Library Name:** Invoices
- **Folder:** (Optional) /Pending

**Action 1:** Extract invoice details using AI Builder
- Use **AI Builder - Process and save information from forms**
- Or manually parse filename pattern (e.g., "INV-001-ClientName-$5000.pdf")

**Action 2:** Create record in Excel/SharePoint List
- **Site Address:** Your SharePoint site
- **List Name:** Invoice Tracker
- **Fields:**
  - InvoiceNumber: Extracted/parsed number
  - ClientName: Extracted/parsed
  - Amount: Extracted/parsed
  - InvoiceDate: @{utcNow()}
  - DueDate: @{addDays(utcNow(), 30)}
  - Status: "Pending Payment"
  - PaidAmount: 0

**Action 3:** Post to Teams accounting channel
- **Message:** New invoice created: INV-XXX for $AMOUNT

**Action 4:** Add reminder to Outlook Calendar
- **Subject:** Payment Due: Invoice @{InvoiceNumber}
- **Start time:** @{addDays(utcNow(), 25)} (5 days before due)
- **Reminder:** 1 day

### Part B: Payment Tracking

**Trigger:** When an item is modified (SharePoint List)
- **Site Address:** Your SharePoint site
- **List Name:** Invoice Tracker

**Condition:** Check if Status changed to "Paid"

**Action 1:** Update Excel cash flow sheet
- **Location:** OneDrive or SharePoint
- **File:** CashFlow-Tracker.xlsx
- **Table:** Add row with:
  - Date: @{utcNow()}
  - Type: "Income"
  - Amount: @{PaidAmount}
  - Source: Invoice @{InvoiceNumber}
  - Client: @{ClientName}

**Action 2:** Post to Teams
- **Message:** 
```
💰 Payment Received!

Invoice: @{InvoiceNumber}
Client: @{ClientName}
Amount: $@{PaidAmount}
Date Paid: @{utcNow()}
```

**Action 3:** Move invoice file in SharePoint
- **From folder:** /Invoices/Pending
- **To folder:** /Invoices/Paid/@{formatDateTime(utcNow(), 'yyyy-MM')}

### Part C: Automated Payment Reminders

**Trigger:** Recurrence (runs daily at 9 AM)

**Action 1:** Get items from Invoice Tracker list
- **Filter Query:** 
```
Status eq 'Pending Payment' and DueDate le '@{addDays(utcNow(), 7)}'
```

**Action 2:** Apply to each overdue/due-soon invoice

**Condition:** Check days until due
- If < 0: Overdue
- If < 7: Due soon

**Action 3a (Overdue):** Send email reminder
- **To:** Client email (from list)
- **CC:** Your accounts team
- **Subject:** Overdue Payment Reminder - Invoice @{InvoiceNumber}
- **Priority:** High

**Action 3b (Due Soon):** Send friendly reminder
- **To:** Client email
- **Subject:** Friendly Payment Reminder - Invoice @{InvoiceNumber}

**Action 4:** Post summary in Teams
- **Message:** 
```
📊 Daily Invoice Status

Overdue: @{length(overdueArray)} invoices
Due This Week: @{length(dueSoonArray)} invoices
Total Outstanding: $@{sum(all pending amounts)}
```

### Part D: Cash Flow Dashboard (Weekly Report)

**Trigger:** Recurrence (every Monday at 8 AM)

**Action 1:** Get all invoices from last 30 days

**Action 2:** Calculate metrics
- Total Invoiced: @{sum amounts}
- Total Paid: @{sum paid amounts}
- Outstanding: @{subtract total from paid}

**Action 3:** Get upcoming expenses (from separate tracker)

**Action 4:** Create formatted report
- Use **Create HTML table** or Excel
- Include:
  - Income last 30 days
  - Expenses last 30 days
  - Net cash flow
  - Outstanding invoices
  - Projected income (next 30 days)

**Action 5:** Post to Teams with adaptive card

**Action 6 (Optional):** Send email to management

---

## Setup Prerequisites

### Required Permissions
- Microsoft 365 Business Standard or Premium
- Power Automate license (included in M365 Business)
- SharePoint access
- Teams access
- Exchange Online (email)

### Required Setup
1. **SharePoint Lists:**
   - Client Communications Log
   - Invoice Tracker
   - Expense Tracker (optional)

2. **SharePoint Document Libraries:**
   - Client Documents
   - Invoices (with Pending/Paid folders)
   - Contracts

3. **Teams Channels:**
   - Client Communications
   - File Notifications
   - Finance/Accounting

4. **Excel/List Fields for Invoice Tracker:**
   - InvoiceNumber (Text)
   - ClientName (Text)
   - ClientEmail (Text)
   - Amount (Currency)
   - PaidAmount (Currency)
   - InvoiceDate (Date)
   - DueDate (Date)
   - Status (Choice: Pending Payment, Partially Paid, Paid, Cancelled)
   - Notes (Multi-line text)

---

## Quick Start Instructions

### To Create a New Flow:
1. Go to https://make.powerautomate.com
2. Click **+ Create** → **Automated cloud flow**
3. Name your flow
4. Select the trigger (e.g., "When a new email arrives")
5. Add actions step-by-step as outlined above
6. Click **Save**
7. Test the flow

### Tips for Success:
- Start with simple flows and add complexity gradually
- Use the **Test** feature to debug
- Enable flow analytics to monitor performance
- Use **parallel branches** for actions that don't depend on each other
- Add **error handling** with **Configure run after** settings
- Use **Compose** actions to store intermediate values
- Name your actions clearly for easier troubleshooting

### Common Dynamic Content:
- `@{triggerOutputs()?['body/property']}` - Get trigger data
- `@{utcNow()}` - Current timestamp
- `@{addDays(utcNow(), 30)}` - Date calculations
- `@{formatDateTime(utcNow(), 'yyyy-MM-dd')}` - Format dates
- `@{length(array)}` - Count items
- `@{concat('text', variable, 'text')}` - Combine text

---

## Cost Considerations

- **Standard Flows:** Free tier includes 750 runs/month
- **Premium Connectors:** May require Power Automate Per User plan ($15/user/month)
- **AI Builder:** Requires separate credits for document processing

Most basic flows described here use standard connectors included in M365 Business licenses.

---

## Support & Resources

- Power Automate Documentation: https://docs.microsoft.com/power-automate
- Community Forums: https://powerusers.microsoft.com/t5/Power-Automate-Community/ct-p/MPACommunity
- Templates: Browse pre-built templates in Power Automate portal

---

## Maintenance & Monitoring

### Set up flow notifications:
1. In each flow, go to **Settings**
2. Enable **Run after** notifications on failure
3. Add your email for error alerts

### Monitor flow runs:
- Check the **28-day run history** regularly
- Review failed runs and fix issues
- Optimize flows that run slowly

### Best practices:
- Document your flows in comments
- Version control: export flows as backups
- Test with sample data before production
- Review permissions quarterly


