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
      name: 'Tech Innovators Inc.',
      country: 'United States',
      currency: 'USD',
    },
  });

  // Create Users
  console.log('👥 Creating users...');
  
  // Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@techinnovators.com',
      name: 'Alice Admin',
      password: hashedPassword,
      role: 'ADMIN',
      companyId: company.id,
    },
  });

  // CEO
  const ceo = await prisma.user.create({
    data: {
      email: 'ceo@techinnovators.com',
      name: 'Bob CEO',
      password: hashedPassword,
      role: 'CEO',
      companyId: company.id,
    },
  });

  // CFO
  const cfo = await prisma.user.create({
    data: {
      email: 'cfo@techinnovators.com',
      name: 'Carol CFO',
      password: hashedPassword,
      role: 'CFO',
      companyId: company.id,
    },
  });

  // CTO
  const cto = await prisma.user.create({
    data: {
      email: 'cto@techinnovators.com',
      name: 'David CTO',
      password: hashedPassword,
      role: 'CTO',
      companyId: company.id,
    },
  });

  // Director
  const director = await prisma.user.create({
    data: {
      email: 'director@techinnovators.com',
      name: 'Eve Director',
      password: hashedPassword,
      role: 'DIRECTOR',
      companyId: company.id,
    },
  });

  // Managers
  const manager1 = await prisma.user.create({
    data: {
      email: 'manager1@techinnovators.com',
      name: 'Frank Manager',
      password: hashedPassword,
      role: 'MANAGER',
      companyId: company.id,
      isManagerApprover: true,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      email: 'manager2@techinnovators.com',
      name: 'Grace Manager',
      password: hashedPassword,
      role: 'MANAGER',
      companyId: company.id,
      isManagerApprover: true,
    },
  });

  // Employees
  const employee1 = await prisma.user.create({
    data: {
      email: 'employee1@techinnovators.com',
      name: 'Henry Employee',
      password: hashedPassword,
      role: 'EMPLOYEE',
      companyId: company.id,
      managerId: manager1.id,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: 'employee2@techinnovators.com',
      name: 'Iris Employee',
      password: hashedPassword,
      role: 'EMPLOYEE',
      companyId: company.id,
      managerId: manager1.id,
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      email: 'employee3@techinnovators.com',
      name: 'Jack Employee',
      password: hashedPassword,
      role: 'EMPLOYEE',
      companyId: company.id,
      managerId: manager2.id,
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
      description: 'Flight to Client Meeting',
      amount: 750.00,
      currency: 'USD',
      amountInCompanyCurrency: 750.00,
      expenseDate: new Date('2025-12-10'),
      paidBy: 'Corporate Card',
      remarks: 'Meeting with ABC Corp in New York',
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
      amount: 125.50,
      currency: 'USD',
      amountInCompanyCurrency: 125.50,
      expenseDate: new Date('2025-12-15'),
      paidBy: 'Personal',
      remarks: 'Team building lunch',
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
      amount: 45.99,
      currency: 'USD',
      amountInCompanyCurrency: 45.99,
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
      amount: 1200.00,
      currency: 'USD',
      amountInCompanyCurrency: 1200.00,
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
      amount: 2500.00,
      currency: 'USD',
      amountInCompanyCurrency: 2500.00,
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
      amount: 89.99,
      currency: 'USD',
      amountInCompanyCurrency: 89.99,
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
      merchantName: 'Delta Airlines',
      extractedAmount: 750.00,
      extractedDate: new Date('2025-12-10'),
      rawText: 'DELTA AIRLINES\nFLIGHT TICKET\n$750.00\n10-DEC-2025',
      confidence: 0.95,
    },
  });

  await prisma.ocrData.create({
    data: {
      expenseId: expense5.id,
      merchantName: 'Google Ads',
      extractedAmount: 2500.00,
      extractedDate: new Date('2025-12-08'),
      rawText: 'Google LLC\nAds Campaign\n$2,500.00\n08-DEC-2025',
      confidence: 0.92,
    },
  });

  console.log('✨ Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Created 1 company: ${company.name}`);
  console.log(`   - Created 10 users (1 Admin, 1 CEO, 1 CFO, 1 CTO, 1 Director, 2 Managers, 3 Employees)`);
  console.log(`   - Created 5 categories`);
  console.log(`   - Created 3 approval rules`);
  console.log(`   - Created 6 expenses (1 Pending, 1 Approved, 1 In Progress, 1 Rejected)`);
  console.log(`   - Created 2 OCR data entries`);
  console.log('\n🔑 Test Credentials:');
  console.log('   Email: admin@techinnovators.com | Password: password123');
  console.log('   Email: ceo@techinnovators.com | Password: password123');
  console.log('   Email: manager1@techinnovators.com | Password: password123');
  console.log('   Email: employee1@techinnovators.com | Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
