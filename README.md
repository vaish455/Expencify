# Expencify - Expense Management System

A comprehensive expense management system with role-based access control, multi-step approval workflows, OCR receipt processing, and real-time currency conversion.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Manager, Employee)
- Automatic company creation on signup
- Country-based currency selection

### 👥 User Management
- Create and manage employees and managers
- Assign roles and manager relationships
- Define manager approval requirements

### 💰 Expense Management
- Submit expenses with multiple currencies
- Automatic currency conversion
- Receipt upload with Cloudinary integration
- OCR receipt scanning for auto-fill
- Track expense status (Pending, In Progress, Approved, Rejected)

### ✅ Approval Workflows
- **Sequential Approval**: Step-by-step approval chain
- **Percentage-based**: Approve when X% of approvers agree
- **Specific Approver**: Auto-approve if specific person approves
- **Hybrid**: Combination of percentage and specific approver
- Manager approval priority option

### 📊 Dashboard & Analytics
- Company statistics
- Expense tracking by category
- Recent expense history
- User expense reports

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** with Prisma ORM
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Cloudinary** for file storage
- **Tesseract.js** for OCR
- **Axios** for external APIs

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

## API Documentation

### Authentication Endpoints

#### POST /api/auth/signup
Register new user and create company
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "country": "United States"
}
```

#### POST /api/auth/login
Login existing user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET /api/auth/me
Get current user profile (requires authentication)

#### GET /api/auth/countries
Get list of all countries with currencies

### User Management (Admin only)

#### POST /api/users
Create new user (employee/manager)

#### GET /api/users
Get all users in company

#### GET /api/users/:id
Get user by ID

#### PUT /api/users/:id
Update user details

#### DELETE /api/users/:id
Delete user

#### PUT /api/users/:id/assign-manager
Assign manager to user

### Expense Management

#### POST /api/expenses
Create new expense (with file upload)

#### POST /api/expenses/ocr
Process receipt with OCR

#### GET /api/expenses
Get all expenses (filtered by role)

#### GET /api/expenses/:id
Get expense details

#### PUT /api/expenses/:id
Update expense

#### DELETE /api/expenses/:id
Delete expense

#### GET /api/expenses/user/:userId
Get expenses for specific user

### Approval Workflow

#### POST /api/approvals/rules
Create approval rule (Admin only)

#### GET /api/approvals/rules
Get all approval rules

#### PUT /api/approvals/rules/:id
Update approval rule

#### DELETE /api/approvals/rules/:id
Delete approval rule

#### GET /api/approvals/pending
Get pending approvals (Manager/Admin)

#### POST /api/approvals/process/:expenseId
Approve or reject expense

### Category Management

#### POST /api/categories
Create category (Admin only)

#### GET /api/categories
Get all categories

#### PUT /api/categories/:id
Update category

#### DELETE /api/categories/:id
Delete category

### Company Management

#### GET /api/company
Get company details

#### PUT /api/company
Update company (Admin only)

#### GET /api/company/statistics
Get company statistics

## Database Schema

### Models
- **Company**: Organization data with currency
- **User**: Employees, managers, and admins
- **Category**: Expense categories
- **Expense**: Expense records with approval status
- **OcrData**: Extracted receipt data
- **ApprovalRule**: Approval workflow rules
- **ApprovalStep**: Sequential approval steps
- **ApprovalAction**: Approval/rejection history

## Approval Workflow Logic

### Sequential Approval
Expenses go through approvers one by one in defined order.

### Percentage-based Approval
Expense is approved when X% of defined approvers approve.

### Specific Approver Rule
If a specific person (e.g., CFO) approves, expense is auto-approved.

### Hybrid Rule
Combine percentage and specific approver: approve if either condition is met.

### Manager Approval
If `isManagerApprover` is true, employee's manager must approve first before other rules apply.

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation with express-validator
- SQL injection protection via Prisma
- File upload validation
- Environment variable protection

## Error Handling

Centralized error handling with proper HTTP status codes:
- 400: Bad Request / Validation Error
- 401: Unauthorized / Invalid Token
- 403: Forbidden / Insufficient Permissions
- 404: Not Found
- 409: Conflict / Duplicate Entry
- 500: Internal Server Error

## Development Tips

### Run Prisma Studio
```bash
npx prisma studio
```

### Reset Database
```bash
npx prisma migrate reset
```

### View Logs
Server uses Morgan for HTTP request logging in development mode.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Setup PostgreSQL with connection pooling
4. Configure Cloudinary production account
5. Enable HTTPS
6. Setup proper CORS origins
7. Add rate limiting
8. Setup monitoring and logging

## License

ISC

## Support

For issues or questions, please create an issue in the repository.
