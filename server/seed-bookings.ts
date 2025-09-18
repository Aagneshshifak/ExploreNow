import { db } from './db';
import { bookings, users, trips, hotels } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function seedBookings() {
  try {
    console.log('🌱 Seeding booking data...');

    // Get the first user
    const user = await db.select().from(users).limit(1);
    if (!user[0]) {
      console.log('❌ No users found. Please seed users first.');
      return;
    }

    const userId = user[0].id;
    console.log(`👤 Using user: ${user[0].name} (ID: ${userId})`);

    // Get some trips and hotels
    const existingTrips = await db.select().from(trips).limit(3);
    const existingHotels = await db.select().from(hotels).limit(3);

    console.log(`📋 Found ${existingTrips.length} trips and ${existingHotels.length} hotels`);

    // Sample booking data
    const sampleBookings = [
      // Hotel bookings
      {
        id: 'hotel-booking-1',
        userId: userId,
        hotelId: existingHotels[0]?.id?.toString() || '1',
        type: 'hotel',
        customerName: user[0].name,
        customerEmail: user[0].email,
        customerPhone: '+1234567890',
        transportMode: 'flight',
        checkIn: '2024-02-15',
        checkOut: '2024-02-18',
        guests: 2,
        amount: '450.00',
        status: 'confirmed',
        specialRequests: 'Late checkout requested',
        emergencyContact: 'John Doe',
        emergencyPhone: '+1234567891',
        transportDetails: 'Flight from NYC to LAX',
        currency: 'USD'
      },
      {
        id: 'hotel-booking-2',
        userId: userId,
        hotelId: existingHotels[1]?.id?.toString() || '2',
        type: 'hotel',
        customerName: user[0].name,
        customerEmail: user[0].email,
        customerPhone: '+1234567890',
        transportMode: 'train',
        checkIn: '2024-03-10',
        checkOut: '2024-03-12',
        guests: 1,
        amount: '280.00',
        status: 'completed',
        specialRequests: 'High floor room preferred',
        emergencyContact: 'Jane Smith',
        emergencyPhone: '+1234567892',
        transportDetails: 'Train from Boston to NYC',
        currency: 'USD'
      },
      // Trip bookings
      {
        id: 'trip-booking-1',
        userId: userId,
        tripId: existingTrips[0]?.id?.toString() || '1',
        type: 'trip',
        customerName: user[0].name,
        customerEmail: user[0].email,
        customerPhone: '+1234567890',
        transportMode: 'flight',
        checkIn: '2024-04-05',
        checkOut: '2024-04-10',
        guests: 2,
        amount: '1200.00',
        status: 'confirmed',
        specialRequests: 'Vegetarian meals',
        emergencyContact: 'Bob Johnson',
        emergencyPhone: '+1234567893',
        transportDetails: 'Round trip flights included',
        currency: 'USD'
      },
      {
        id: 'trip-booking-2',
        userId: userId,
        tripId: existingTrips[1]?.id?.toString() || '2',
        type: 'trip',
        customerName: user[0].name,
        customerEmail: user[0].email,
        customerPhone: '+1234567890',
        transportMode: 'bus',
        checkIn: '2024-01-20',
        checkOut: '2024-01-25',
        guests: 4,
        amount: '800.00',
        status: 'completed',
        specialRequests: 'Family room needed',
        emergencyContact: 'Alice Brown',
        emergencyPhone: '+1234567894',
        transportDetails: 'Bus tour with guide',
        currency: 'USD'
      },
      // Transport-only bookings
      {
        id: 'transport-booking-1',
        userId: userId,
        type: 'transport',
        customerName: user[0].name,
        customerEmail: user[0].email,
        customerPhone: '+1234567890',
        transportMode: 'flight',
        checkIn: '2024-05-15',
        checkOut: '2024-05-15',
        guests: 1,
        amount: '350.00',
        status: 'confirmed',
        specialRequests: 'Window seat preferred',
        emergencyContact: 'Charlie Wilson',
        emergencyPhone: '+1234567895',
        transportDetails: 'Flight from LAX to JFK',
        currency: 'USD'
      },
      {
        id: 'transport-booking-2',
        userId: userId,
        type: 'transport',
        customerName: user[0].name,
        customerEmail: user[0].email,
        customerPhone: '+1234567890',
        transportMode: 'train',
        checkIn: '2024-06-01',
        checkOut: '2024-06-01',
        guests: 2,
        amount: '120.00',
        status: 'confirmed',
        specialRequests: 'Quiet car preferred',
        emergencyContact: 'Diana Lee',
        emergencyPhone: '+1234567896',
        transportDetails: 'Train from DC to NYC',
        currency: 'USD'
      }
    ];

    // Insert bookings
    for (const booking of sampleBookings) {
      try {
        await db.insert(bookings).values(booking);
        console.log(`✅ Created booking: ${booking.id} (${booking.type})`);
      } catch (error) {
        console.log(`⚠️  Booking ${booking.id} might already exist, skipping...`);
      }
    }

    console.log('🎉 Booking seeding completed!');
    
    // Show summary
    const totalBookings = await db.select().from(bookings).where(eq(bookings.userId, userId));
    console.log(`📊 Total bookings for user: ${totalBookings.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding bookings:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedBookings().then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}

export default seedBookings;