import { Role, PrismaClient } from '../src/prisma/generated/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@chat-crm.com' }
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists, skipping creation');
    return;
  }

  const password = await bcrypt.hash('admin123', 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@chat-crm.com',
      password,
      role: Role.Admin,
      firstName: 'Admin',
      lastName: 'User'
    },
  });

  // Create sample project
  const project = await prisma.project.create({
    data: {
      name: 'Demo Project',
      uniqueId: 'DEMO-001',
      userId: admin.id
    },
  });

  console.log('✅ Seed data created successfully:', { 
    admin: {
      id: admin.id, 
      email: admin.email, 
      role: admin.role 
    },
    project: {
      id: project.id,
      name: project.name,
      uniqueId: project.uniqueId
    }
  });
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
