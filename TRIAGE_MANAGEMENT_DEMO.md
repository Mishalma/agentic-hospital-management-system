# Triage Management Software

## Overview
AI-powered web-based triage tool that prioritizes patients based on symptoms and vitals using risk scoring algorithms. Replaces paper-based processes with digital efficiency.

## Features

### 🚨 **Smart Risk Assessment**
- **AI-Based Scoring**: Automated risk calculation (0-100 scale)
- **Symptom Analysis**: Weighted scoring based on symptom type, severity, and duration
- **Vital Signs Integration**: Blood pressure, heart rate, temperature, oxygen saturation
- **Medical History**: Considers existing conditions and their severity

### 📊 **Priority Classification**
- **5-Level Triage System**: 
  - Level 1 (Critical) - Immediate attention
  - Level 2 (High) - Urgent care within 15 minutes
  - Level 3 (Medium) - Less urgent, 1 hour wait
  - Level 4 (Low) - Non-urgent, 2 hour wait
  - Level 5 (Routine) - Routine care, 4 hour wait

### 🏥 **Queue Management**
- **Automated Prioritization**: Patients sorted by triage level and risk score
- **Real-time Updates**: Live queue status with position tracking
- **Status Tracking**: Pending → In Assessment → Waiting Doctor → Completed
- **Staff Assignments**: Nurse assignment and workflow management

## Risk Scoring Algorithm

### Symptom Scoring
High-risk symptoms receive higher scores:
- **Chest Pain**: 15-40 points (severity dependent)
- **Difficulty Breathing**: 20-45 points
- **Severe Bleeding**: 25-50 points
- **Unconsciousness**: 40-60 points
- **Fever**: 5-20 points
- **General Symptoms**: 3-15 points

### Duration Multipliers
- **<1 hour**: 1.2x (recent onset = higher priority)
- **1-6 hours**: 1.0x (standard)
- **6-24 hours**: 0.8x (established condition)
- **>24 hours**: 0.6x (chronic condition)

### Vital Signs Scoring
- **Critical BP**: ≥180/120 (+20 points)
- **High BP**: ≥160/100 (+15 points)
- **Low BP**: <90/60 (+12 points)
- **Tachycardia**: >120 bpm (+15 points)
- **Bradycardia**: <50 bpm (+15 points)
- **High Fever**: ≥103°F (+15 points)
- **Low O2**: <90% (+20 points)
- **Severe Pain**: 8-10/10 (+15 points)

## User Roles & Access

### 👩‍⚕️ **Nurses**
- **Primary Assessors**: Conduct triage assessments
- **Data Entry**: Input symptoms, vitals, and medical history
- **Status Updates**: Move patients through triage workflow
- **Queue Monitoring**: View assigned patients and priorities

### 👨‍⚕️ **Doctors**
- **Queue Review**: Monitor prioritized patient list
- **Clinical Oversight**: Review high-priority cases
- **Status Management**: Update patient status after consultation
- **Dashboard Access**: View triage statistics and trends

### 👨‍💼 **Administrators**
- **Full System Access**: All triage functions
- **Analytics**: System-wide statistics and reporting
- **User Management**: Staff assignments and permissions
- **Quality Control**: Monitor triage accuracy and efficiency

## Key Workflows

### Triage Assessment Process
1. **Patient Registration**: Enter patient ID and basic information
2. **Symptom Documentation**: Record symptoms with severity and duration
3. **Vital Signs Entry**: Input current vital measurements
4. **Medical History**: Document relevant medical conditions
5. **AI Processing**: Automatic risk scoring and priority assignment
6. **Queue Placement**: Patient added to prioritized queue
7. **Staff Notification**: Alerts for high-priority cases

### Queue Management
1. **Priority Display**: Patients sorted by triage level and risk score
2. **Status Tracking**: Visual workflow from assessment to completion
3. **Real-time Updates**: Live queue position and wait times
4. **Staff Actions**: Update status as patients progress through care
5. **Dashboard Monitoring**: Statistics and high-priority alerts

## Technical Implementation

### Backend Features
- **MongoDB Integration**: Real data storage with automatic fallback to mock data
- **RESTful API**: Complete CRUD operations for triage assessments
- **Real-time Notifications**: Socket.io alerts for critical cases
- **Risk Algorithm**: Sophisticated scoring based on clinical guidelines
- **Queue Management**: Automated sorting and prioritization

### Frontend Features
- **Responsive Design**: Works on tablets, mobile, and desktop
- **Intuitive Interface**: Step-by-step assessment workflow
- **Real-time Updates**: Live queue status and patient tracking
- **Role-based Access**: Different views for nurses, doctors, and admins
- **Offline Capability**: Basic functionality without internet connection

## Sample Data
The system includes realistic sample triage cases:
- **Critical Case**: Chest pain with high BP (Risk Score: 85)
- **High Priority**: Fever with moderate symptoms (Risk Score: 55)
- **Medium Priority**: Back pain, chronic condition (Risk Score: 30)

## API Endpoints

### Triage Management
- `POST /api/triage` - Create new triage assessment
- `GET /api/triage/queue` - Get prioritized triage queue
- `GET /api/triage/priority/:priority` - Get patients by priority level
- `GET /api/triage/patient/:patientId` - Get patient's triage history
- `PATCH /api/triage/:id/status` - Update triage status
- `GET /api/triage/dashboard` - Get dashboard statistics
- `GET /api/triage/symptoms` - Get common symptoms for autocomplete

## Benefits

### Clinical Benefits
- **Improved Patient Safety**: Ensures critical cases are seen first
- **Standardized Assessment**: Consistent triage criteria across staff
- **Reduced Wait Times**: Efficient queue management and prioritization
- **Better Documentation**: Complete digital records of assessments

### Operational Benefits
- **Paperless Process**: Eliminates manual forms and reduces errors
- **Real-time Visibility**: Staff can see queue status instantly
- **Automated Alerts**: Immediate notification for high-priority cases
- **Data Analytics**: Track triage patterns and system performance

### Quality Improvements
- **Evidence-based Scoring**: Algorithm based on clinical guidelines
- **Audit Trail**: Complete record of assessments and decisions
- **Staff Efficiency**: Streamlined workflow reduces assessment time
- **Patient Satisfaction**: Transparent wait times and fair prioritization

This simple yet powerful triage system transforms emergency department operations by providing intelligent patient prioritization while maintaining ease of use for healthcare staff.