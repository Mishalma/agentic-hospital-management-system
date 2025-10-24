# 🏥 HealthTech Scheduler - Demo Script

## 5-Minute Hackathon Demo

### Setup (30 seconds)
```bash
npm run dev
```
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### 1. Patient Registration Demo (90 seconds)

**New Patient Flow:**
1. Go to http://localhost:3000
2. Click "Book Appointment"
3. Select "New Patient" tab
4. Fill form:
   - Name: "Sarah Wilson"
   - DOB: "1992-05-15"
   - Phone: "+1-555-9999"
   - Email: "sarah@demo.com"
5. Click "Continue to Booking"

**Existing Patient Flow:**
1. Select "Existing Patient" tab
2. Enter Patient ID: `PT2024123456`
3. Click "Find Patient" → Shows John Doe
4. Click "Continue to Booking"

### 2. Appointment Booking (90 seconds)

1. Select Doctor: "Dr. Sarah Johnson - General Medicine"
2. Choose available time slot (auto-populated)
3. Enter symptoms: "Annual checkup and blood pressure check"
4. Set urgency: "Low"
5. Click "Book Appointment"
6. **Show QR Code and Token** (e.g., Q12341234)

### 3. Real-time Queue Demo (90 seconds)

1. Go to "Queue" tab
2. Enter token from previous booking
3. Show live position and ETA
4. **Open second browser window** → Admin Dashboard
5. Login as admin: `admin` / `admin123`
6. Show real-time updates between patient and admin views

### 4. Admin Dashboard (90 seconds)

**Queue Management:**
1. View today's appointments table
2. Click "Call" button for next patient
3. Enter room number: "Room 101"
4. Show real-time notification in patient queue
5. Update appointment status to "In Progress"

**Analytics:**
- Show metrics: Total appointments, waiting, in-progress
- Display channel breakdown (web, kiosk, etc.)

### 5. Kiosk Mode (30 seconds)

1. Go to http://localhost:3000/kiosk
2. Show touch-friendly interface
3. Demonstrate self-service registration

## Key Demo Points

### Problem Solved
- **Before**: Fragmented systems, double-bookings, 30% no-shows
- **After**: Unified system, real-time updates, 25% no-show reduction

### Technical Highlights
- **Real-time**: WebSocket updates across all clients
- **Omnichannel**: Web, kiosk, WhatsApp (coming), Voice AI (coming)
- **Scalable**: Modular design for 53-module system
- **Inclusive**: Accessibility features, multiple languages ready

### Business Impact
- 40-50% admin time savings
- 25% reduction in no-shows
- Unified patient experience
- Real-time visibility for staff

## Demo Data

**Patient IDs:**
- PT2024123456 - John Doe
- PT2024789012 - Jane Smith  
- PT2024345678 - Bob Johnson

**Admin Accounts:**
- Admin: admin/admin123
- Doctor: doctor/doctor123
- Staff: staff/staff123

## Troubleshooting

**If demo breaks:**
1. Refresh browsers
2. Check console for errors
3. Restart with `npm run dev`

**Common issues:**
- Port conflicts: Change ports in .env files
- CORS errors: Check FRONTEND_URL in backend/.env
- Socket disconnection: Refresh page

## Future Modules (53 total)

This MVP demonstrates Module 1. Future modules include:
- WhatsApp chatbot integration
- Voice AI booking system
- EHR synchronization
- Advanced analytics & ML
- Mobile applications
- Telemedicine integration

---

**🎯 Demo Goal**: Show unified, real-time, omnichannel appointment system that reduces hospital admin chaos and improves patient experience.