import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...');
  await prisma.approvalAction.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.approvalRule.deleteMany();
  await prisma.ocrData.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Company
  console.log('🏢 Creating company...');
  const company = await prisma.company.create({
    data: {
      name: 'Tech Innovators Pvt. Ltd.',
      country: 'India',
      currency: 'INR',
    },
  });

  // Create Users
  console.log('👥 Creating users...');
  
  // Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@techinnovators.in',
      name: 'Aarav Sharma',
      password: hashedPassword,
      role: 'ADMIN',
      companyId: company.id,
    },
  });

  // CEO
  const ceo = await prisma.user.create({
    data: {
      email: 'ceo@techinnovators.in',
      name: 'Rajesh Patel',
      password: hashedPassword,
      role: 'CEO',
      companyId: company.id,
    },
  });

  // CFO
  const cfo = await prisma.user.create({
    data: {
      email: 'cfo@techinnovators.in',
      name: 'Priya Mehta',
      password: hashedPassword,
      role: 'CFO',
      companyId: company.id,
    },
  });

  // CTO
  const cto = await prisma.user.create({
    data: {
      email: 'cto@techinnovators.in',
      name: 'Vikram Singh',
      password: hashedPassword,
      role: 'CTO',
      companyId: company.id,
    },
  });

  // Director
  const director = await prisma.user.create({
    data: {
      email: 'director@techinnovators.in',
      name: 'Sneha Gupta',
      password: hashedPassword,
      role: 'DIRECTOR',
      companyId: company.id,
    },
  });

  // Managers
  const manager1 = await prisma.user.create({
    data: {
      email: 'manager1@techinnovators.in',
      name: 'Amit Desai',
      password: hashedPassword,
      role: 'MANAGER',
      companyId: company.id,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      email: 'manager2@techinnovators.in',
      name: 'Neha Joshi',
      password: hashedPassword,
      role: 'MANAGER',
      companyId: company.id,
    },
  });

  // Employees
  const employee1 = await prisma.user.create({
    data: {
      email: 'employee1@techinnovators.in',
      name: 'Rohan Verma',
      password: hashedPassword,
      role: 'EMPLOYEE',
      companyId: company.id,
      managerId: manager1.id,
      isManagerApprover: true,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: 'employee2@techinnovators.in',
      name: 'Kavita Nair',
      password: hashedPassword,
      role: 'EMPLOYEE',
      companyId: company.id,
      managerId: manager1.id,
      isManagerApprover: true,
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      email: 'employee3@techinnovators.in',
      name: 'Suresh Kumar',
      password: hashedPassword,
      role: 'EMPLOYEE',
      companyId: company.id,
      managerId: manager2.id,
      isManagerApprover: true,
    },
  });

  // Create Categories
  console.log('📁 Creating categories...');
  const travelCategory = await prisma.category.create({
    data: {
      name: 'Travel',
      companyId: company.id,
    },
  });

  const mealsCategory = await prisma.category.create({
    data: {
      name: 'Meals & Entertainment',
      companyId: company.id,
    },
  });

  const officeSuppliesCategory = await prisma.category.create({
    data: {
      name: 'Office Supplies',
      companyId: company.id,
    },
  });

  const softwareCategory = await prisma.category.create({
    data: {
      name: 'Software & Subscriptions',
      companyId: company.id,
    },
  });

  const marketingCategory = await prisma.category.create({
    data: {
      name: 'Marketing',
      companyId: company.id,
    },
  });

  // Create Approval Rules
  console.log('✅ Creating approval rules...');
  
  // Rule 1: Sequential approval for travel expenses
  const travelApprovalRule = await prisma.approvalRule.create({
    data: {
      name: 'Travel Expense Approval',
      type: 'SEQUENTIAL',
      companyId: company.id,
      categoryId: travelCategory.id,
      priority: 1,
      requiresManagerFirst: true,
      steps: {
        create: [
          {
            approverId: cfo.id,
            sequence: 1,
          },
          {
            approverId: ceo.id,
            sequence: 2,
          },
        ],
      },
    },
  });

  // Rule 2: CFO specific approver for large expenses
  const largeExpenseRule = await prisma.approvalRule.create({
    data: {
      name: 'Large Expense Approval',
      type: 'SPECIFIC_APPROVER',
      companyId: company.id,
      specificApproverId: cfo.id,
      minAmount: 50000,
      priority: 2,
      requiresManagerFirst: true,
    },
  });

  // Rule 3: Percentage approval for department expenses
  const departmentExpenseRule = await prisma.approvalRule.create({
    data: {
      name: 'Department Expense Approval',
      type: 'PERCENTAGE',
      percentageRequired: 50,
      companyId: company.id,
      priority: 3,
      steps: {
        create: [
          {
            approverId: director.id,
            sequence: 1,
          },
          {
            approverId: cto.id,
            sequence: 2,
          },
        ],
      },
    },
  });

  // Create Expenses
  console.log('💰 Creating expenses...');
  
  // Expense 1: Pending travel expense
  const expense1 = await prisma.expense.create({
    data: {
      description: 'Flight to Client Meeting in Mumbai',
      amount: 12500.00,
      currency: 'INR',
      amountInCompanyCurrency: 12500.00,
      expenseDate: new Date('2025-12-10'),
      paidBy: 'Corporate Card',
      remarks: 'Meeting with ABC Corp in Mumbai',
      status: 'PENDING',
      userId: employee1.id,
      categoryId: travelCategory.id,
      companyId: company.id,
      currentStepIndex: 0,
      managerApprovalComplete: false,
    },
  });

  // Expense 2: Approved meal expense
  const expense2 = await prisma.expense.create({
    data: {
      description: 'Team Lunch',
      amount: 3500.00,
      currency: 'INR',
      amountInCompanyCurrency: 3500.00,
      expenseDate: new Date('2025-12-15'),
      paidBy: 'Personal',
      remarks: 'Team building lunch at restaurant',
      status: 'APPROVED',
      userId: employee2.id,
      categoryId: mealsCategory.id,
      companyId: company.id,
      currentStepIndex: 1,
      managerApprovalComplete: true,
    },
  });

  // Create approval action for expense2
  await prisma.approvalAction.create({
    data: {
      expenseId: expense2.id,
      approverId: manager1.id,
      status: 'APPROVED',
      comments: 'Approved for team building',
      stepIndex: 0,
    },
  });

  // Expense 3: Office supplies
  const expense3 = await prisma.expense.create({
    data: {
      description: 'Desk Organizers and Stationery',
      amount: 1850.00,
      currency: 'INR',
      amountInCompanyCurrency: 1850.00,
      expenseDate: new Date('2025-12-12'),
      paidBy: 'Corporate Card',
      status: 'PENDING',
      userId: employee3.id,
      categoryId: officeSuppliesCategory.id,
      companyId: company.id,
      currentStepIndex: 0,
      managerApprovalComplete: false,
    },
  });

  // Expense 4: Software subscription
  const expense4 = await prisma.expense.create({
    data: {
      description: 'Annual Slack Subscription',
      amount: 45000.00,
      currency: 'INR',
      amountInCompanyCurrency: 45000.00,
      expenseDate: new Date('2025-12-01'),
      paidBy: 'Corporate Card',
      remarks: 'Team communication tool',
      status: 'IN_PROGRESS',
      userId: employee1.id,
      categoryId: softwareCategory.id,
      companyId: company.id,
      currentStepIndex: 1,
      managerApprovalComplete: true,
    },
  });

  // Create approval actions for expense4
  await prisma.approvalAction.create({
    data: {
      expenseId: expense4.id,
      approverId: manager1.id,
      status: 'APPROVED',
      comments: 'Essential tool for team',
      stepIndex: 0,
    },
  });

  // Expense 5: Marketing campaign
  const expense5 = await prisma.expense.create({
    data: {
      description: 'Google Ads Campaign',
      amount: 75000.00,
      currency: 'INR',
      amountInCompanyCurrency: 75000.00,
      expenseDate: new Date('2025-12-08'),
      paidBy: 'Corporate Card',
      remarks: 'Q4 Marketing push',
      receiptUrl: 'https://example.com/receipts/google-ads-dec.pdf',
      status: 'PENDING',
      userId: employee2.id,
      categoryId: marketingCategory.id,
      companyId: company.id,
      currentStepIndex: 0,
      managerApprovalComplete: false,
    },
  });

  // Expense 6: Rejected expense
  const expense6 = await prisma.expense.create({
    data: {
      description: 'Personal Gym Membership',
      amount: 4500.00,
      currency: 'INR',
      amountInCompanyCurrency: 4500.00,
      expenseDate: new Date('2025-12-05'),
      paidBy: 'Personal',
      status: 'REJECTED',
      userId: employee3.id,
      categoryId: officeSuppliesCategory.id,
      companyId: company.id,
      currentStepIndex: 0,
      managerApprovalComplete: false,
    },
  });

  // Create approval action for expense6
  await prisma.approvalAction.create({
    data: {
      expenseId: expense6.id,
      approverId: manager2.id,
      status: 'REJECTED',
      comments: 'Not a valid business expense',
      stepIndex: 0,
    },
  });

  // Create OCR Data for some expenses
  console.log('📄 Creating OCR data...');
  await prisma.ocrData.create({
    data: {
      expenseId: expense1.id,
      merchantName: 'IndiGo Airlines',
      extractedAmount: 12500.00,
      extractedDate: new Date('2025-12-10'),
      rawText: 'INDIGO AIRLINES\nFLIGHT TICKET\n₹12,500.00\n10-DEC-2025',
      confidence: 0.95,
    },
  });

  await prisma.ocrData.create({
    data: {
      expenseId: expense5.id,
      merchantName: 'Google Ads',
      extractedAmount: 75000.00,
      extractedDate: new Date('2025-12-08'),
      rawText: 'Google LLC\nAds Campaign\n₹75,000.00\n08-DEC-2025',
      confidence: 0.92,
    },
  });

  console.log('✨ Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Created 1 company: ${company.name} (Currency: INR)`);
  console.log(`   - Created 10 users (1 Admin, 1 CEO, 1 CFO, 1 CTO, 1 Director, 2 Managers, 3 Employees)`);
  console.log(`   - Created 5 categories`);
  console.log(`   - Created 3 approval rules`);
  console.log(`   - Created 6 expenses (3 Pending, 1 Approved, 1 In Progress, 1 Rejected)`);
  console.log(`   - Created 3 approval actions`);
  console.log(`   - Created 2 OCR data entries`);
  console.log('\n🔑 Test Credentials (password: password123):');
  console.log('   Admin:    admin@techinnovators.in');
  console.log('   CEO:      ceo@techinnovators.in');
  console.log('   CFO:      cfo@techinnovators.in');
  console.log('   CTO:      cto@techinnovators.in');
  console.log('   Director: director@techinnovators.in');
  console.log('   Manager:  manager1@techinnovators.in');
  console.log('   Manager:  manager2@techinnovators.in');
  console.log('   Employee: employee1@techinnovators.in');
  console.log('   Employee: employee2@techinnovators.in');
  console.log('   Employee: employee3@techinnovators.in');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
