import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database with Prisma...');

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@explorenow.com',
      password: adminPassword,
      role: 'admin',
    },
  });

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.create({
    data: {
      name: 'Aagnesh',
      email: 'user@explorenow.com',
      password: userPassword,
      role: 'user',
    },
  });

  // Create sample trips
  const trips = await Promise.all([
    prisma.trip.create({
      data: {
        title: 'Tropical Paradise in Bali',
        location: 'Bali, Indonesia',
        description: 'Experience the magic of Bali with pristine beaches, ancient temples, and vibrant culture.',
        price: 1299.99,
        duration: 7,
        tags: ['Beach', 'Culture', 'Adventure'],
        includes: ['Flight', 'Hotel', 'Meals', 'Tours'],
        imageUrl: '/images/bali-trip.jpg',
      },
    }),
    prisma.trip.create({
      data: {
        title: 'European Adventure',
        location: 'Paris, Rome, Barcelona',
        description: 'Explore the best of Europe with this multi-city adventure through iconic destinations.',
        price: 2199.99,
        duration: 14,
        tags: ['Culture', 'History', 'Architecture'],
        includes: ['Flight', 'Hotel', 'City Tours', 'Transportation'],
        imageUrl: '/images/europe-trip.jpg',
      },
    }),
    prisma.trip.create({
      data: {
        title: 'Safari Adventure Kenya',
        location: 'Nairobi, Kenya',
        description: 'Witness the Great Migration and explore the wildlife of Kenya in this unforgettable safari.',
        price: 1899.99,
        duration: 10,
        tags: ['Wildlife', 'Adventure', 'Nature'],
        includes: ['Flight', 'Safari Lodge', 'Game Drives', 'Meals'],
        imageUrl: '/images/kenya-safari.jpg',
      },
    }),
  ]);

  // Create sample hotels
  const hotels = await Promise.all([
    prisma.hotel.create({
      data: {
        name: 'Grand Palace Resort',
        location: 'Bali, Indonesia',
        description: 'Luxury beachfront resort with stunning ocean views and world-class amenities.',
        price: 299.99,
        rating: 4.8,
        tags: ['Luxury', 'Beach', 'Spa'],
        includes: ['Breakfast', 'WiFi', 'Pool'],
        amenities: ['Spa', 'Restaurant', 'Bar', 'Gym', 'Pool'],
        imageUrl: '/images/grand-palace-bali.jpg',
      },
    }),
    prisma.hotel.create({
      data: {
        name: 'Parisian Boutique Hotel',
        location: 'Paris, France',
        description: 'Charming boutique hotel in the heart of Paris, near major attractions.',
        price: 189.99,
        rating: 4.5,
        tags: ['Boutique', 'City Center', 'Historic'],
        includes: ['Breakfast', 'WiFi', 'Concierge'],
        amenities: ['Restaurant', 'Bar', 'Concierge', 'Room Service'],
        imageUrl: '/images/paris-boutique.jpg',
      },
    }),
    prisma.hotel.create({
      data: {
        name: 'Safari Lodge Kenya',
        location: 'Maasai Mara, Kenya',
        description: 'Authentic safari lodge experience with wildlife viewing from your room.',
        price: 449.99,
        rating: 4.9,
        tags: ['Safari', 'Wildlife', 'Adventure'],
        includes: ['All Meals', 'Game Drives', 'WiFi'],
        amenities: ['Restaurant', 'Game Drives', 'Wildlife Viewing', 'Bar'],
        imageUrl: '/images/safari-lodge.jpg',
      },
    }),
  ]);

  // Create sample bookings
  await Promise.all([
    prisma.booking.create({
      data: {
        userId: user.id,
        tripId: trips[0].id,
        type: 'trip',
        status: 'confirmed',
        amount: trips[0].price,
        checkIn: new Date('2024-08-15'),
        checkOut: new Date('2024-08-22'),
      },
    }),
    prisma.booking.create({
      data: {
        userId: user.id,
        hotelId: hotels[0].id,
        type: 'hotel',
        status: 'confirmed',
        amount: hotels[0].price * 3, // 3 nights
        checkIn: new Date('2024-09-01'),
        checkOut: new Date('2024-09-04'),
      },
    }),
    prisma.booking.create({
      data: {
        userId: user.id,
        tripId: trips[1].id,
        type: 'trip',
        status: 'pending',
        amount: trips[1].price,
        checkIn: new Date('2024-10-10'),
        checkOut: new Date('2024-10-24'),
      },
    }),
    prisma.booking.create({
      data: {
        userId: user.id,
        hotelId: hotels[1].id,
        type: 'hotel',
        status: 'cancelled',
        amount: hotels[1].price * 2, // 2 nights
        checkIn: new Date('2024-07-20'),
        checkOut: new Date('2024-07-22'),
      },
    }),
  ]);

  console.log('✅ Database seeded successfully with Prisma!');
  console.log('🔐 Admin login: admin@explorenow.com / admin123');
  console.log('👤 User login: user@explorenow.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });