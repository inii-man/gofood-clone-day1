import prisma from './client';
import bcrypt from 'bcryptjs';

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();

  // Seed default User Budi (password: password123)
  const passwordHash = await bcrypt.hash('password123', 10);
  const budi = await prisma.user.upsert({
    where: { email: 'budi@mail.com' },
    update: {
      name: 'Budi Santoso',
      passwordHash,
      role: 'CUSTOMER',
    },
    create: {
      name: 'Budi Santoso',
      email: 'budi@mail.com',
      passwordHash,
      role: 'CUSTOMER',
    },
  });

  const nasgor =
    await prisma.restaurant.create({
      data: {
        name: 'Nasi Goreng Gila',
        image:
          'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
        rating: 4.8,
        deliveryTime: '20-30 min',
        deliveryFee: 5000,
        categories: ['Indonesian', 'Rice'],
        isPromo: true,
        menuItems: {
          create: [
            {
              name: 'Nasi Goreng Spesial',
              description:
                'Nasi goreng dengan telur, ayam, dan kerupuk',
              price: 35000,
              image:
                'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
              isPopular: true,
            },
            {
              name: 'Nasi Goreng Seafood',
              description:
                'Nasi goreng dengan cumi, udang, dan kepiting',
              price: 45000,
              image:
                'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
              isPopular: false,
            },
          ],
        },
      },
    });

  const burger =
    await prisma.restaurant.create({
      data: {
        name: 'Burger Bangor',
        image:
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        rating: 4.5,
        deliveryTime: '25-40 min',
        deliveryFee: 8000,
        categories: ['Western', 'Fast Food'],
        isPromo: false,
        menuItems: {
          create: [
            {
              name: 'Classic Cheeseburger',
              description:
                'Burger daging sapi dengan keju cheddar',
              price: 40000,
              image:
                'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
              isPopular: true,
            },
          ],
        },
      },
    });

  console.log('Seed completed:', {
    user: { email: budi.email, name: budi.name, defaultPassword: 'password123' },
    nasgor,
    burger,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
