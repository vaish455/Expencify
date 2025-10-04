# Expencify - Expense Management System

A comprehensive expense management system with role-based access control, multi-step approval workflows, OCR receipt processing, and real-time currency conversion.

## Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control (Admin, Manager, Employee, CEO, CFO, CTO, Director)
- Automatic company creation on signup
- Country-based currency selection

### 👥 User Management

- Create and manage employees, managers, and executives
- Assign roles: Employee, Manager, Admin, CEO, CFO, CTO, Director
- Define manager relationships and approval hierarchies
- Configure manager approval requirements
- **Profile & Settings**: Update profile information, change password, view company details

### 💰 Expense Management

- Submit expenses with multiple currencies
- Automatic currency conversion
- Receipt upload with Cloudinary integration
- OCR receipt scanning for auto-fill
- Track expense status (Pending, In Progress, Approved, Rejected)

### ✅ Approval Workflows

- **Manager Priority**: Manager must approve first if `isManagerApprover` is enabled
- **Sequential Approval**: Step-by-step approval chain with defined sequence (e.g., Manager → CFO → CEO)
- **Percentage-based**: Approve when X% of approvers agree
- **Specific Approver**: Auto-approve if specific person (e.g., CEO, CFO) approves
- **Hybrid**: Combination of percentage OR specific approver
- **Combined Workflows**: Support both sequential AND conditional rules together
- **Rule Priority**: Higher priority rules are evaluated first
- **Flexible Configuration**: Mix and match different approval strategies with executive roles
- **Executive Overrides**: CEOs and CFOs can be configured as specific approvers for instant approval
- **Executive Dashboards**: CEO, CFO, CTO, and Director roles have dedicated dashboards with approval capabilities
- **Multi-Role Support**: All executive roles can approve expenses assigned to them in workflows

### 📊 Dashboard & Analytics

- Company statistics (Admin)
- Expense tracking by category
- Recent expense history
- User expense reports
- Manager/Executive dashboard with pending approvals
- Employee dashboard with expense status

### 📧 Email Notifications

- Welcome email on signup
- Login notifications
- User creation with auto-generated password
- Expense submission confirmations
- Approval/rejection notifications
- Password change alerts

## Tech Stack

### Backend

- **Node.js** with Express.js
- **PostgreSQL** with Prisma ORM
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Cloudinary** for file storage
- **Tesseract.js** for OCR
- **Axios** for external APIs

### Frontend

- **React** 19+ with Vite
- **React Router** for navigation
- **Zustand** for state management
- **Tailwind CSS** 4+ for styling
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **date-fns** for date formatting
- **Axios** for API calls

### Design System

- **Primary Color**: #5a3a52 (Deep Mauve) - Odoo's signature color
- **Primary Light**: #875A7B (Light Mauve)
- **Secondary Color**: #017E84 (Teal) - Pantone 322C, RAL 5021
- **Neutral Gray**: #8F8F8F - Pantone 877C, RAL 7042
- **Modern gradient combinations** for enhanced visual appeal
- **Soft shadows and rounded corners** for a professional Odoo-inspired look

### External APIs

- RestCountries API (country/currency data)
- ExchangeRate API (currency conversion)
- Cloudinary (image storage)

## Installation

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Cloudinary account (free tier available)

### Backend Setup

1. **Clone the repository**

```bash
cd Expencify/backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
# Edit .env file with your credentials
DATABASE_URL="postgresql://username:password@localhost:5432/expencify?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=5000

CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Email Configuration (Gmail example)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-specific-password"
EMAIL_FROM="Expencify <noreply@expencify.com>"

FRONTEND_URL="http://localhost:5173"

NODE_ENV="development"
```

4. **Setup database**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npx prisma db seed
```

5. **Start the server**

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**

```bash
cd Expencify/frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
# Create .env file
cp .env.example .env

# Edit .env file
VITE_API_URL=http://localhost:5000/api
```

4. **Start the development server**

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

5. **Build for production**

```bash
npm run build
npm run preview
```
