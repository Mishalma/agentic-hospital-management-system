# Role-Based Access Control System Demo

## 🔐 Authentication & Authorization System

This hospital management system now includes a comprehensive role-based access control (RBAC) system with JWT authentication, password hashing, and MongoDB storage.

## 🎭 Available User Roles

### 1. **Administrator** 
- **Username:** `admin`
- **Password:** `password`
- **Access Level:** Full system access
- **Permissions:** All modules, user management, system settings
- **Dashboard:** Enterprise Dashboard with full analytics

### 2. **Receptionist**
- **Username:** `receptionist1` 
- **Password:** `password`
- **Access Level:** Patient registration & appointments
- **Permissions:** 
  - ✅ Patient Registration
  - ✅ Appointment Booking
  - ✅ Queue Management
  - ✅ Billing (Read-only)
- **Dashboard:** Integrated Booking System

### 3. **Doctor**
- **Username:** `doctor1`
- **Password:** `password` 
- **Access Level:** Patient care & medical records
- **Permissions:**
  - ✅ Medical Records (Create/Read/Update)
  - ✅ Prescriptions
  - ✅ Patient Management
  - ✅ Lab Results (Read)
  - ✅ Complaint Management
- **Dashboard:** Admin Dashboard with patient analytics

## 🏥 Module Access Matrix

| Module | Admin | Receptionist | Doctor | Nurse | Pharmacist |
|--------|-------|--------------|--------|-------|------------|
| Patient Registration | ✅ | ✅ | ❌ | ❌ | ❌ |
| Appointment Booking | ✅ | ✅ | ❌ | ❌ | ❌ |
| Queue Management | ✅ | ✅ | ✅ | ✅ | ❌ |
| Medical Records | ✅ | ❌ | ✅ | ✅ | ❌ |
| Prescriptions | ✅ | ❌ | ✅ | ❌ | ✅ |
| Complaint Management | ✅ | ❌ | ✅ | ❌ | ❌ |
| User Registration | ✅ | ❌ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| WhatsApp/SMS/Telegram | ✅ | ❌ | ❌ | ❌ | ❌ |

## 🚀 How to Test the System

### Step 1: Access the Login Page
1. Navigate to `/login`
2. You'll see demo accounts with different roles
3. Click "Use This Account" for any role to auto-fill credentials

### Step 2: Role-Based Navigation
After login, users are automatically redirected based on their role:
- **Admin** → Enterprise Dashboard (`/enterprise-dashboard`)
- **Receptionist** → Patient Registration (`/integrated-booking`)
- **Doctor** → Medical Dashboard (`/admin`)
- **Nurse** → Queue Management (`/queue-status`)

### Step 3: Module Access Control
- Navigate through the sidebar to see role-based module access
- **Green "Active"** badges = Full access
- **Red "Access Denied"** badges = Insufficient permissions
- **Yellow "Coming Soon"** badges = Feature in development

### Step 4: Admin User Management
1. Login as **admin**
2. Navigate to **System Administration** → **User Registration**
3. Create new users with different roles and departments
4. Each role automatically gets appropriate permissions

## 🔧 Technical Implementation

### Backend Security Features
- **JWT Authentication** with configurable expiration
- **bcrypt Password Hashing** (10 salt rounds)
- **MongoDB User Storage** with validation
- **Role-Based Middleware** for API protection
- **Permission Checking** at endpoint level

### Frontend Security Features
- **Protected Routes** with role validation
- **Dynamic Navigation** based on permissions
- **Token Storage** in localStorage
- **Automatic Redirects** for unauthorized access
- **Role-Based UI Components**

### Database Schema
```javascript
User Schema:
- username (unique, required)
- email (unique, required) 
- password (hashed, required)
- fullName (required)
- role (enum: admin, receptionist, doctor, etc.)
- department (enum: administration, emergency, etc.)
- permissions (array of module/action pairs)
- isActive (boolean)
- lastLogin (date)
- createdBy (reference to admin user)
```

## 🎯 Permission System

### Permission Structure
Each user has an array of permissions with:
- **module**: The system module (e.g., 'appointments', 'patients')
- **actions**: Array of allowed actions (['create', 'read', 'update', 'delete'])

### Default Role Permissions
```javascript
Admin: [{ module: 'all', actions: ['create', 'read', 'update', 'delete', 'manage'] }]
Receptionist: [
  { module: 'appointments', actions: ['create', 'read', 'update'] },
  { module: 'patients', actions: ['create', 'read', 'update'] },
  { module: 'registration', actions: ['create', 'read', 'update'] }
]
Doctor: [
  { module: 'medical_records', actions: ['create', 'read', 'update'] },
  { module: 'prescriptions', actions: ['create', 'read', 'update'] },
  { module: 'patients', actions: ['read', 'update'] }
]
```

## 🔒 Security Best Practices Implemented

1. **Password Security**
   - Minimum 6 characters required
   - bcrypt hashing with salt
   - No plain text storage

2. **JWT Security**
   - Configurable secret key
   - Token expiration (24h default)
   - Automatic token refresh

3. **API Security**
   - Protected endpoints with middleware
   - Role-based access control
   - Permission validation

4. **Frontend Security**
   - Protected routes
   - Token validation
   - Automatic logout on token expiry

## 📱 Demo Scenarios

### Scenario 1: Receptionist Workflow
1. Login as `receptionist1`
2. Access patient registration (✅ Allowed)
3. Try to access user management (❌ Denied)
4. Book appointments and manage queue

### Scenario 2: Doctor Workflow  
1. Login as `doctor1`
2. Access medical records (✅ Allowed)
3. Try to register new users (❌ Denied)
4. Manage patient complaints

### Scenario 3: Admin Workflow
1. Login as `admin`
2. Access all modules (✅ Full Access)
3. Create new users with different roles
4. Monitor system-wide analytics

## 🎉 Key Features Demonstrated

- ✅ **Secure Authentication** with JWT tokens
- ✅ **Role-Based Access Control** with 10+ roles
- ✅ **Dynamic Navigation** based on permissions  
- ✅ **User Management** for admins
- ✅ **MongoDB Integration** with fallback to mock data
- ✅ **Professional UI** with role indicators
- ✅ **Automatic Redirects** based on user role
- ✅ **Permission Validation** at both frontend and backend
- ✅ **Scalable Architecture** supporting 52+ hospital modules

This system provides enterprise-grade security and access control suitable for real hospital management systems while maintaining ease of use and professional appearance.