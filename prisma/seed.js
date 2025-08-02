import { Role, PrismaClient } from '../src/prisma/generated/client/index.js';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
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
