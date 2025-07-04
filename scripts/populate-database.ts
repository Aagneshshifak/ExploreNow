import { db } from '../server/db';
import { 
  users, hotels, tripPackages, bookings, reviews, travelDocuments,
  type InsertUser, type InsertHotel, type InsertTripPackage, 
  type InsertBooking, type InsertReview, type InsertTravelDocument 
} from '../shared/schema';

async function populateDatabase() {
  if (!db) {
    console.error('Database connection not available');
    return;
  }

  try {
    console.log('🚀 Starting database population...');

    // Create sample users
    const sampleUsers: InsertUser[] = [
      {
        username: 'admin',
        email: 'admin@explorenow.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+91-9876543210',
        userType: 'admin'
      },
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+91-9876543211',
        userType: 'user'
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+91-9876543212',
        userType: 'user'
      },
      {
        username: 'travel_guru',
        email: 'guru@example.com',
        password: 'password123',
        firstName: 'Travel',
        lastName: 'Guru',
        phone: '+91-9876543213',
        userType: 'user'
      }
    ];

    console.log('📝 Creating users...');
    const createdUsers = await db.insert(users).values(sampleUsers).returning();
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create sample hotels
    const sampleHotels: InsertHotel[] = [
      {
        name: 'Taj Mahal Palace, Mumbai',
        description: 'Iconic luxury hotel overlooking the Gateway of India with world-class amenities and historic charm.',
        location: 'Mumbai, Maharashtra',
        address: 'Apollo Bunder, Colaba, Mumbai, Maharashtra 400001',
        pricePerNight: '15000',
        rating: '4.8',
        amenities: ['Wi-Fi', 'Swimming Pool', 'Spa', 'Restaurant', 'Gym', 'Room Service', 'Concierge'],
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
        ],
        status: 'active'
      },
      {
        name: 'The Oberoi, New Delhi',
        description: 'Luxury hotel in the heart of New Delhi with modern amenities and exceptional service.',
        location: 'New Delhi, Delhi',
        address: 'Dr. Zakir Hussain Marg, New Delhi, Delhi 110003',
        pricePerNight: '12000',
        rating: '4.7',
        amenities: ['Wi-Fi', 'Swimming Pool', 'Spa', 'Restaurant', 'Business Center', 'Airport Shuttle'],
        images: [
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'
        ],
        status: 'active'
      },
      {
        name: 'ITC Grand Chola, Chennai',
        description: 'Palatial luxury hotel inspired by Chola architecture with world-class facilities.',
        location: 'Chennai, Tamil Nadu',
        address: '63, Mount Road, Guindy, Chennai, Tamil Nadu 600032',
        pricePerNight: '10000',
        rating: '4.6',
        amenities: ['Wi-Fi', 'Swimming Pool', 'Spa', 'Multiple Restaurants', 'Gym', 'Business Center'],
        images: [
          'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'
        ],
        status: 'active'
      },
      {
        name: 'Trident Nariman Point, Mumbai',
        description: 'Contemporary business hotel with stunning views of the Arabian Sea.',
        location: 'Mumbai, Maharashtra',
        address: 'Nariman Point, Mumbai, Maharashtra 400021',
        pricePerNight: '8000',
        rating: '4.4',
        amenities: ['Wi-Fi', 'Restaurant', 'Gym', 'Business Center', 'Room Service'],
        images: [
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
        ],
        status: 'active'
      },
      {
        name: 'The Leela Palace, Bangalore',
        description: 'Royal luxury hotel with traditional Indian hospitality and modern amenities.',
        location: 'Bangalore, Karnataka',
        address: '23, Kodihalli, HAL Airport Road, Bangalore, Karnataka 560008',
        pricePerNight: '9000',
        rating: '4.5',
        amenities: ['Wi-Fi', 'Swimming Pool', 'Spa', 'Restaurant', 'Gym', 'Airport Shuttle'],
        images: [
          'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'
        ],
        status: 'active'
      }
    ];

    console.log('🏨 Creating hotels...');
    const createdHotels = await db.insert(hotels).values(sampleHotels).returning();
    console.log(`✅ Created ${createdHotels.length} hotels`);

    // Create sample trip packages
    const sampleTripPackages: InsertTripPackage[] = [
      {
        name: 'Golden Triangle Tour',
        description: 'Experience the best of Delhi, Agra, and Jaipur in this classic 6-day tour covering India\'s most iconic destinations.',
        location: 'Delhi, Agra, Jaipur',
        duration: '6 days / 5 nights',
        price: '25000',
        rating: '4.8',
        category: ['Cultural', 'Historical', 'Photography'],
        inclusions: ['Hotels', 'Transportation', 'Breakfast', 'Sightseeing', 'Guide'],
        images: [
          'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800',
          'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800'
        ],
        status: 'active',
        isRecommended: true
      },
      {
        name: 'Kerala Backwaters Experience',
        description: 'Peaceful houseboat cruise through Kerala\'s serene backwaters with traditional cuisine and Ayurvedic treatments.',
        location: 'Kerala',
        duration: '4 days / 3 nights',
        price: '18000',
        rating: '4.7',
        category: ['Nature', 'Relaxation', 'Cultural'],
        inclusions: ['Houseboat Stay', 'All Meals', 'Ayurvedic Massage', 'Transfers'],
        images: [
          'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
        ],
        status: 'active',
        isRecommended: true
      },
      {
        name: 'Rajasthan Desert Safari',
        description: 'Adventure through the Thar Desert with camel rides, cultural performances, and luxury desert camps.',
        location: 'Rajasthan',
        duration: '5 days / 4 nights',
        price: '22000',
        rating: '4.6',
        category: ['Adventure', 'Cultural', 'Desert'],
        inclusions: ['Desert Camp', 'Camel Safari', 'Cultural Shows', 'All Meals', 'Transportation'],
        images: [
          'https://images.unsplash.com/photo-1509142727278-8e1b4bc67de2?w=800',
          'https://images.unsplash.com/photo-1520673351890-2d4e8b2d0e3e?w=800'
        ],
        status: 'active',
        isRecommended: false
      },
      {
        name: 'Goa Beach Paradise',
        description: 'Relax on pristine beaches, enjoy water sports, and experience Goa\'s vibrant nightlife and Portuguese heritage.',
        location: 'Goa',
        duration: '3 days / 2 nights',
        price: '12000',
        rating: '4.5',
        category: ['Beach', 'Adventure', 'Nightlife'],
        inclusions: ['Beach Resort', 'Water Sports', 'Breakfast', 'Airport Transfers'],
        images: [
          'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800',
          'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
        ],
        status: 'active',
        isRecommended: false
      },
      {
        name: 'Himalayan Adventure',
        description: 'Trekking and mountain adventure in the stunning Himalayas with breathtaking views and cultural experiences.',
        location: 'Himachal Pradesh',
        duration: '7 days / 6 nights',
        price: '30000',
        rating: '4.9',
        category: ['Adventure', 'Trekking', 'Mountains'],
        inclusions: ['Mountain Lodges', 'Trekking Guide', 'Equipment', 'All Meals', 'Permits'],
        images: [
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800'
        ],
        status: 'active',
        isRecommended: true
      }
    ];

    console.log('🎒 Creating trip packages...');
    const createdTripPackages = await db.insert(tripPackages).values(sampleTripPackages).returning();
    console.log(`✅ Created ${createdTripPackages.length} trip packages`);

    // Create sample bookings
    const sampleBookings: InsertBooking[] = [
      {
        userId: createdUsers[1].id, // John Doe
        hotelId: createdHotels[0].id, // Taj Mahal Palace
        checkIn: new Date('2024-12-15'),
        checkOut: new Date('2024-12-18'),
        guests: 2,
        totalPrice: '45000',
        status: 'confirmed',
        bookingDate: new Date('2024-11-20')
      },
      {
        userId: createdUsers[2].id, // Jane Smith
        tripPackageId: createdTripPackages[0].id, // Golden Triangle Tour
        guests: 1,
        totalPrice: '25000',
        status: 'confirmed',
        bookingDate: new Date('2024-11-25')
      },
      {
        userId: createdUsers[3].id, // Travel Guru
        hotelId: createdHotels[1].id, // The Oberoi
        checkIn: new Date('2024-12-20'),
        checkOut: new Date('2024-12-22'),
        guests: 2,
        totalPrice: '24000',
        status: 'pending',
        bookingDate: new Date('2024-12-01')
      },
      {
        userId: createdUsers[1].id, // John Doe
        tripPackageId: createdTripPackages[1].id, // Kerala Backwaters
        guests: 2,
        totalPrice: '36000',
        status: 'completed',
        bookingDate: new Date('2024-10-15')
      }
    ];

    console.log('📋 Creating bookings...');
    const createdBookings = await db.insert(bookings).values(sampleBookings).returning();
    console.log(`✅ Created ${createdBookings.length} bookings`);

    // Create sample reviews
    const sampleReviews: InsertReview[] = [
      {
        userId: createdUsers[1].id,
        hotelId: createdHotels[0].id,
        rating: 5,
        reviewText: 'Absolutely stunning hotel! The service was impeccable and the location is perfect. The heritage and luxury blend beautifully.',
        dateStayed: new Date('2024-10-10'),
        helpful: 15,
        verified: true
      },
      {
        userId: createdUsers[2].id,
        tripPackageId: createdTripPackages[0].id,
        rating: 5,
        reviewText: 'The Golden Triangle tour exceeded all expectations. Our guide was knowledgeable and the itinerary was perfect.',
        dateStayed: new Date('2024-09-15'),
        helpful: 12,
        verified: true
      },
      {
        userId: createdUsers[3].id,
        hotelId: createdHotels[1].id,
        rating: 4,
        reviewText: 'Great hotel with excellent facilities. The spa was particularly relaxing. Would definitely stay again.',
        dateStayed: new Date('2024-08-20'),
        helpful: 8,
        verified: true
      },
      {
        userId: createdUsers[1].id,
        tripPackageId: createdTripPackages[1].id,
        rating: 5,
        reviewText: 'Kerala backwaters were magical! The houseboat experience was unique and the food was amazing.',
        dateStayed: new Date('2024-07-10'),
        helpful: 20,
        verified: true
      },
      {
        userId: createdUsers[2].id,
        hotelId: createdHotels[2].id,
        rating: 4,
        reviewText: 'Beautiful architecture and great amenities. The breakfast spread was impressive.',
        dateStayed: new Date('2024-06-25'),
        helpful: 6,
        verified: true
      }
    ];

    console.log('⭐ Creating reviews...');
    const createdReviews = await db.insert(reviews).values(sampleReviews).returning();
    console.log(`✅ Created ${createdReviews.length} reviews`);

    // Create sample travel documents
    const sampleTravelDocuments: InsertTravelDocument[] = [
      {
        userId: createdUsers[1].id,
        fileName: 'passport_john_doe.pdf',
        fileType: 'application/pdf',
        filePath: '/documents/passport_john_doe.pdf',
        documentType: 'passport',
        uploadDate: new Date('2024-11-01')
      },
      {
        userId: createdUsers[2].id,
        fileName: 'visa_jane_smith.pdf',
        fileType: 'application/pdf',
        filePath: '/documents/visa_jane_smith.pdf',
        documentType: 'visa',
        uploadDate: new Date('2024-11-05')
      },
      {
        userId: createdUsers[3].id,
        fileName: 'id_travel_guru.jpg',
        fileType: 'image/jpeg',
        filePath: '/documents/id_travel_guru.jpg',
        documentType: 'id_card',
        uploadDate: new Date('2024-11-10')
      }
    ];

    console.log('📄 Creating travel documents...');
    const createdTravelDocuments = await db.insert(travelDocuments).values(sampleTravelDocuments).returning();
    console.log(`✅ Created ${createdTravelDocuments.length} travel documents`);

    console.log('\n🎉 Database population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: ${createdUsers.length}`);
    console.log(`🏨 Hotels: ${createdHotels.length}`);
    console.log(`🎒 Trip Packages: ${createdTripPackages.length}`);
    console.log(`📋 Bookings: ${createdBookings.length}`);
    console.log(`⭐ Reviews: ${createdReviews.length}`);
    console.log(`📄 Travel Documents: ${createdTravelDocuments.length}`);

  } catch (error) {
    console.error('❌ Error populating database:', error);
  }
}

// Run the population script
populateDatabase();