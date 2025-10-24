# 🤖 Telegram Bot Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Your Telegram Bot

1. **Open Telegram** and search for `@BotFather`
2. **Start a chat** with BotFather
3. **Send command**: `/newbot`
4. **Choose bot name**: `HealthTech Scheduler Bot`
5. **Choose username**: `healthtech_scheduler_bot` (or any available name ending with 'bot')
6. **Copy the bot token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Configure Your Bot

1. **Set bot description** (optional):
   ```
   /setdescription
   Select your bot: @healthtech_scheduler_bot
   Description: Book medical appointments quickly and easily through chat
   ```

2. **Set bot commands** (optional):
   ```
   /setcommands
   Select your bot: @healthtech_scheduler_bot
   Commands:
   start - Start the bot and see main menu
   book - Book a new appointment
   help - Get help and support
   status - Check appointment status (use: /status TOKEN)
   ```

### Step 3: Update Environment Variables

1. **Open** `backend/.env` file
2. **Replace** the placeholder with your actual bot token:
   ```
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### Step 4: Restart Backend Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

### Step 5: Test Your Bot

1. **Open Telegram** and search for your bot username
2. **Send**: `/start`
3. **Expected response**: Welcome message with booking button
4. **Click**: "📅 Book Appointment" to test the flow

---

## 🎯 Complete Demo Flow

### Initial Contact
```
User: /start
Bot: 🏥 Welcome to HealthTech Scheduler!
     Hello [Name]! I can help you book medical appointments...
     [📅 Book Appointment] [❓ Help]
```

### New Patient Registration
```
User: [📅 Book Appointment]
Bot: Are you a new or existing patient?
     [👤 New Patient] [🔍 Existing Patient]

User: [👤 New Patient]
Bot: Let's collect your information step by step.
     First, what's your full name?

User: John Doe
Bot: Great! Hi John Doe 👋
     Now, what's your date of birth?
     Please use format: YYYY-MM-DD

User: 1990-05-15
Bot: Perfect! 📅
     What's your email address?
     You can type "skip" if you prefer not to provide it.

User: john@email.com
Bot: ✅ Registration Complete!
     Your Patient ID: PT2024123456
     Now, please describe your symptoms or reason for visit:
```

### Appointment Booking
```
User: fever and headache
Bot: 👨‍⚕️ Select a Doctor
     Which doctor would you like to see for your symptoms?
     [👨‍⚕️ Dr. Sarah Johnson (General Medicine)]
     [❤️ Dr. Michael Chen (Cardiology)]
     [👶 Dr. Emily Rodriguez (Pediatrics)]
     [🦴 Dr. David Kim (Orthopedics)]

User: [👨‍⚕️ Dr. Sarah Johnson]
Bot: 📅 Available Slots for Dr. Sarah Johnson
     Please select your preferred time:
     [🕐 10:00 AM] [🕐 12:00 PM] [🕐 2:00 PM]

User: [🕐 10:00 AM]
Bot: 📋 Booking Summary
     👤 Patient: John Doe
     👨‍⚕️ Doctor: Dr. Sarah Johnson
     🏥 Department: General Medicine
     📅 Time: 10:00 AM
     💬 Symptoms: fever and headache
     
     Please confirm your appointment:
     [✅ Confirm Booking] [❌ Cancel]
```

### Confirmation & QR Code
```
User: [✅ Confirm Booking]
Bot: ✅ Appointment Confirmed!
     
     🎫 Token: Q12345678
     📅 Date & Time: Today 10:00 AM
     👨‍⚕️ Doctor: Dr. Sarah Johnson
     🏥 Department: General Medicine
     
     📱 Important:
     • Arrive 15 minutes early
     • Bring valid ID and insurance card
     • Show your token at reception
     
     Your QR code is being sent...

Bot: [Sends QR Code Image]
     🔲 Your Appointment QR Code
     Token: Q12345678
     Show this QR code at the hospital reception.
```

---

## 🔧 Advanced Features

### Status Check
```
User: /status Q12345678
Bot: 📅 Appointment Status
     
     🎫 Token: Q12345678
     👤 Patient: John Doe
     👨‍⚕️ Doctor: Dr. Sarah Johnson
     📅 Date & Time: Today 10:00 AM
     📊 Status: BOOKED
     
     ⏰ Please arrive 15 minutes early
```

### Existing Patient Flow
```
User: [🔍 Existing Patient]
Bot: Please provide your Patient ID.
     Format: PT followed by 10 digits
     Example: PT2024123456

User: PT2024123456
Bot: ✅ Welcome back, John Doe!
     Please describe your symptoms or reason for this visit:
```

### Help Command
```
User: /help
Bot: 🆘 HealthTech Scheduler Help
     
     How to book an appointment:
     1. Type /book or click "Book Appointment"
     2. Choose if you're a new or existing patient
     3. Provide required information
     4. Select doctor and time slot
     5. Confirm your booking
     
     Commands:
     • /start - Main menu
     • /book - Book appointment
     • /status [token] - Check appointment
     • /help - This help message
```

---

## 🚀 Real-time Integration

### Admin Dashboard Sync
1. **Complete booking** in Telegram
2. **Check admin dashboard** (http://localhost:3000/admin)
3. **See appointment** appears instantly in today's queue
4. **Update status** in admin → reflects in bot status checks

### Features Included
- ✅ **Real Telegram Bot API** (not simulation)
- ✅ **Interactive Inline Keyboards** (buttons)
- ✅ **QR Code Image Generation** (actual images sent)
- ✅ **Complete Booking Flow** (new/existing patients)
- ✅ **Status Checking** (/status command)
- ✅ **Error Handling** (validation, fallbacks)
- ✅ **Real-time Sync** (with admin dashboard)

---

## 🛠️ Troubleshooting

### Bot Not Responding
1. **Check token** in `.env` file
2. **Restart backend** server
3. **Check console** for error messages
4. **Verify bot** with BotFather (/mybots)

### Common Issues
- **"Bot not found"**: Check username spelling
- **"Unauthorized"**: Verify bot token is correct
- **"Webhook conflict"**: Bot might have webhook set, use /deletewebhook with BotFather

### Testing Tips
- **Use /start** to reset conversation state
- **Check backend console** for debug messages
- **Test with multiple users** to verify state isolation
- **Monitor admin dashboard** for real-time sync

---

## 📱 Production Deployment

### Webhook Setup (Optional)
For production, you can set up webhooks instead of polling:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://yourdomain.com/api/telegram/webhook"}'
```

### Environment Variables
```bash
# Production .env
TELEGRAM_BOT_TOKEN=your_actual_bot_token
NODE_ENV=production
```

---

## 🎉 Success!

Once configured, you'll have a **real Telegram bot** that:
- Books actual appointments in your system
- Sends real QR code images
- Syncs with your admin dashboard in real-time
- Handles multiple users simultaneously
- Provides a complete healthcare booking experience

**Test it now**: Search for your bot in Telegram and send `/start`! 🚀