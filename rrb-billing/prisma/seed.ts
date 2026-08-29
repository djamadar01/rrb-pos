const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo dataset...');

  // Create outlets
  const mainOutlet = await prisma.outlet.create({
    data: {
      name: 'Main St. Outlet',
      location: '123 Main St, Cityville',
      contactInfo: '555-0101',
      taxConfiguration: JSON.stringify({ taxRate: 5, serviceCharge: 0 }),
    },
  });

  const downtownOutlet = await prisma.outlet.create({
    data: {
      name: 'Downtown Outlet',
      location: '456 Downtown Ave, Cityville',
      contactInfo: '555-0102',
      taxConfiguration: JSON.stringify({ taxRate: 5, serviceCharge: 2 }),
    },
  });

  const highwayOutlet = await prisma.outlet.create({
    data: {
      name: 'Highway Outlet',
      location: '789 Highway Rd, Cityville',
      contactInfo: '555-0103',
      taxConfiguration: JSON.stringify({ taxRate: 5, serviceCharge: 0 }),
    },
  });

  // Create Users (Owner and Managers)
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);

  const owner = await prisma.user.create({
    data: {
      name: 'Admin Owner',
      email: 'owner@rrb.com',
      passwordHash: ownerPassword,
      role: 'OWNER',
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      name: 'Alice',
      email: 'alice@rrb.com',
      passwordHash: managerPassword,
      role: 'MANAGER',
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: 'Bob',
      email: 'bob@rrb.com',
      passwordHash: managerPassword,
      role: 'MANAGER',
    },
  });

  // Create Menu Items and Modifiers
  const burger = await prisma.menuItem.create({
    data: {
      name: 'Classic Burger',
      price: 5.00,
      category: 'Meals',
      modifiers: {
        create: [
          { name: 'Extra Cheese', priceAdjustment: 1.00 },
          { name: 'Bacon', priceAdjustment: 1.50 },
        ],
      },
    },
  });

  const coke = await prisma.menuItem.create({
    data: {
      name: 'Coke',
      price: 2.00,
      category: 'Drinks',
    },
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
