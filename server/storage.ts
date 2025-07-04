import { 
  users, hotels, tripPackages, bookings, reviews, travelDocuments,
  type User, type InsertUser,
  type Hotel, type InsertHotel,
  type TripPackage, type InsertTripPackage,
  type Booking, type InsertBooking,
  type Review, type InsertReview,
  type TravelDocument, type InsertTravelDocument
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Hotel methods
  getHotels(): Promise<Hotel[]>;
  getHotel(id: number): Promise<Hotel | undefined>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(id: number, hotel: Partial<InsertHotel>): Promise<Hotel | undefined>;
  
  // Trip package methods
  getTripPackages(): Promise<TripPackage[]>;
  getTripPackage(id: number): Promise<TripPackage | undefined>;
  createTripPackage(tripPackage: InsertTripPackage): Promise<TripPackage>;
  
  // Booking methods
  getBookings(userId: number): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  
  // Review methods
  getReviews(hotelId?: number, tripPackageId?: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Travel document methods
  getTravelDocuments(userId: number): Promise<TravelDocument[]>;
  createTravelDocument(document: InsertTravelDocument): Promise<TravelDocument>;
  deleteTravelDocument(id: number, userId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    if (!db) throw new Error("Database not connected");
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not connected");
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not connected");
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not connected");
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Hotel methods
  async getHotels(): Promise<Hotel[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(hotels).where(eq(hotels.status, "active"));
  }

  async getHotel(id: number): Promise<Hotel | undefined> {
    if (!db) throw new Error("Database not connected");
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id));
    return hotel || undefined;
  }

  async createHotel(insertHotel: InsertHotel): Promise<Hotel> {
    if (!db) throw new Error("Database not connected");
    const [hotel] = await db
      .insert(hotels)
      .values(insertHotel)
      .returning();
    return hotel;
  }

  async updateHotel(id: number, updateHotel: Partial<InsertHotel>): Promise<Hotel | undefined> {
    if (!db) throw new Error("Database not connected");
    const [hotel] = await db
      .update(hotels)
      .set({ ...updateHotel, updatedAt: new Date() })
      .where(eq(hotels.id, id))
      .returning();
    return hotel || undefined;
  }

  // Trip package methods
  async getTripPackages(): Promise<TripPackage[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(tripPackages).where(eq(tripPackages.status, "active"));
  }

  async getTripPackage(id: number): Promise<TripPackage | undefined> {
    if (!db) throw new Error("Database not connected");
    const [tripPackage] = await db.select().from(tripPackages).where(eq(tripPackages.id, id));
    return tripPackage || undefined;
  }

  async createTripPackage(insertTripPackage: InsertTripPackage): Promise<TripPackage> {
    if (!db) throw new Error("Database not connected");
    const [tripPackage] = await db
      .insert(tripPackages)
      .values(insertTripPackage)
      .returning();
    return tripPackage;
  }

  // Booking methods
  async getBookings(userId: number): Promise<Booking[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    if (!db) throw new Error("Database not connected");
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    if (!db) throw new Error("Database not connected");
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    if (!db) throw new Error("Database not connected");
    const [booking] = await db
      .update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  // Review methods
  async getReviews(hotelId?: number, tripPackageId?: number): Promise<Review[]> {
    if (!db) throw new Error("Database not connected");
    
    if (hotelId) {
      return await db.select().from(reviews).where(eq(reviews.hotelId, hotelId));
    } else if (tripPackageId) {
      return await db.select().from(reviews).where(eq(reviews.tripPackageId, tripPackageId));
    }
    
    return await db.select().from(reviews);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    if (!db) throw new Error("Database not connected");
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    return review;
  }

  // Travel document methods
  async getTravelDocuments(userId: number): Promise<TravelDocument[]> {
    if (!db) throw new Error("Database not connected");
    return await db.select().from(travelDocuments).where(eq(travelDocuments.userId, userId));
  }

  async createTravelDocument(insertDocument: InsertTravelDocument): Promise<TravelDocument> {
    if (!db) throw new Error("Database not connected");
    const [document] = await db
      .insert(travelDocuments)
      .values(insertDocument)
      .returning();
    return document;
  }

  async deleteTravelDocument(id: number, userId: number): Promise<boolean> {
    if (!db) throw new Error("Database not connected");
    const result = await db
      .delete(travelDocuments)
      .where(and(eq(travelDocuments.id, id), eq(travelDocuments.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

// Memory-based fallback storage for when database is not available
export class MemoryStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private hotels: Map<number, Hotel> = new Map();
  private tripPackages: Map<number, TripPackage> = new Map();
  private bookings: Map<number, Booking> = new Map();
  private reviews: Map<number, Review> = new Map();
  private travelDocuments: Map<number, TravelDocument> = new Map();
  private currentId = 1;

  constructor() {
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample users
    const users = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@explorenow.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+91-9876543210',
        userType: 'admin' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+91-9876543211',
        userType: 'user' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+91-9876543212',
        userType: 'user' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        username: 'travel_guru',
        email: 'guru@example.com',
        password: 'password123',
        firstName: 'Travel',
        lastName: 'Guru',
        phone: '+91-9876543213',
        userType: 'user' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    users.forEach(user => this.users.set(user.id, user));

    // Sample hotels with comprehensive data
    const hotels = [
      {
        id: 1,
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
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
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
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
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
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
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
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
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
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    hotels.forEach(hotel => this.hotels.set(hotel.id, hotel));

    // Sample trip packages
    const tripPackages = [
      {
        id: 1,
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
        isRecommended: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
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
        isRecommended: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
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
        isRecommended: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
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
        isRecommended: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
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
        isRecommended: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    tripPackages.forEach(pkg => this.tripPackages.set(pkg.id, pkg));

    // Sample bookings
    const bookings = [
      {
        id: 1,
        userId: 2, // John Doe
        hotelId: 1, // Taj Mahal Palace
        tripPackageId: null,
        checkIn: new Date('2024-12-15'),
        checkOut: new Date('2024-12-18'),
        guests: 2,
        totalPrice: '45000',
        status: 'confirmed',
        bookingDate: new Date('2024-11-20'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        userId: 3, // Jane Smith
        hotelId: null,
        tripPackageId: 1, // Golden Triangle Tour
        checkIn: null,
        checkOut: null,
        guests: 1,
        totalPrice: '25000',
        status: 'confirmed',
        bookingDate: new Date('2024-11-25'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        userId: 4, // Travel Guru
        hotelId: 2, // The Oberoi
        tripPackageId: null,
        checkIn: new Date('2024-12-20'),
        checkOut: new Date('2024-12-22'),
        guests: 2,
        totalPrice: '24000',
        status: 'pending',
        bookingDate: new Date('2024-12-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        userId: 2, // John Doe
        hotelId: null,
        tripPackageId: 2, // Kerala Backwaters
        checkIn: null,
        checkOut: null,
        guests: 2,
        totalPrice: '36000',
        status: 'completed',
        bookingDate: new Date('2024-10-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    bookings.forEach(booking => this.bookings.set(booking.id, booking));

    // Sample reviews
    const reviews = [
      {
        id: 1,
        userId: 2,
        hotelId: 1,
        tripPackageId: null,
        rating: 5,
        reviewText: 'Absolutely stunning hotel! The service was impeccable and the location is perfect. The heritage and luxury blend beautifully.',
        dateStayed: new Date('2024-10-10'),
        helpful: 15,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        userId: 3,
        hotelId: null,
        tripPackageId: 1,
        rating: 5,
        reviewText: 'The Golden Triangle tour exceeded all expectations. Our guide was knowledgeable and the itinerary was perfect.',
        dateStayed: new Date('2024-09-15'),
        helpful: 12,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        userId: 4,
        hotelId: 2,
        tripPackageId: null,
        rating: 4,
        reviewText: 'Great hotel with excellent facilities. The spa was particularly relaxing. Would definitely stay again.',
        dateStayed: new Date('2024-08-20'),
        helpful: 8,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        userId: 2,
        hotelId: null,
        tripPackageId: 2,
        rating: 5,
        reviewText: 'Kerala backwaters were magical! The houseboat experience was unique and the food was amazing.',
        dateStayed: new Date('2024-07-10'),
        helpful: 20,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        userId: 3,
        hotelId: 3,
        tripPackageId: null,
        rating: 4,
        reviewText: 'Beautiful architecture and great amenities. The breakfast spread was impressive.',
        dateStayed: new Date('2024-06-25'),
        helpful: 6,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    reviews.forEach(review => this.reviews.set(review.id, review));

    // Sample travel documents
    const travelDocuments = [
      {
        id: 1,
        userId: 2,
        fileName: 'passport_john_doe.pdf',
        fileType: 'application/pdf',
        filePath: '/documents/passport_john_doe.pdf',
        documentType: 'passport',
        uploadDate: new Date('2024-11-01'),
        createdAt: new Date(),
      },
      {
        id: 2,
        userId: 3,
        fileName: 'visa_jane_smith.pdf',
        fileType: 'application/pdf',
        filePath: '/documents/visa_jane_smith.pdf',
        documentType: 'visa',
        uploadDate: new Date('2024-11-05'),
        createdAt: new Date(),
      },
      {
        id: 3,
        userId: 4,
        fileName: 'id_travel_guru.jpg',
        fileType: 'image/jpeg',
        filePath: '/documents/id_travel_guru.jpg',
        documentType: 'id_card',
        uploadDate: new Date('2024-11-10'),
        createdAt: new Date(),
      }
    ];

    travelDocuments.forEach(doc => this.travelDocuments.set(doc.id, doc));

    this.currentId = 10;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.currentId++,
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  // Hotel methods
  async getHotels(): Promise<Hotel[]> {
    return Array.from(this.hotels.values()).filter(hotel => hotel.status === "active");
  }

  async getHotel(id: number): Promise<Hotel | undefined> {
    return this.hotels.get(id);
  }

  async createHotel(insertHotel: InsertHotel): Promise<Hotel> {
    const hotel: Hotel = {
      id: this.currentId++,
      ...insertHotel,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.hotels.set(hotel.id, hotel);
    return hotel;
  }

  async updateHotel(id: number, updateHotel: Partial<InsertHotel>): Promise<Hotel | undefined> {
    const hotel = this.hotels.get(id);
    if (!hotel) return undefined;
    
    const updatedHotel: Hotel = {
      ...hotel,
      ...updateHotel,
      updatedAt: new Date()
    };
    this.hotels.set(id, updatedHotel);
    return updatedHotel;
  }

  // Trip package methods
  async getTripPackages(): Promise<TripPackage[]> {
    return Array.from(this.tripPackages.values()).filter(pkg => pkg.status === "active");
  }

  async getTripPackage(id: number): Promise<TripPackage | undefined> {
    return this.tripPackages.get(id);
  }

  async createTripPackage(insertTripPackage: InsertTripPackage): Promise<TripPackage> {
    const tripPackage: TripPackage = {
      id: this.currentId++,
      ...insertTripPackage,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tripPackages.set(tripPackage.id, tripPackage);
    return tripPackage;
  }

  // Booking methods
  async getBookings(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.userId === userId);
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      id: this.currentId++,
      ...insertBooking,
      bookingDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking: Booking = {
      ...booking,
      status,
      updatedAt: new Date()
    };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  // Review methods
  async getReviews(hotelId?: number, tripPackageId?: number): Promise<Review[]> {
    const allReviews = Array.from(this.reviews.values());
    
    if (hotelId) {
      return allReviews.filter(review => review.hotelId === hotelId);
    } else if (tripPackageId) {
      return allReviews.filter(review => review.tripPackageId === tripPackageId);
    }
    
    return allReviews;
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const review: Review = {
      id: this.currentId++,
      ...insertReview,
      helpful: 0,
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.reviews.set(review.id, review);
    return review;
  }

  // Travel document methods
  async getTravelDocuments(userId: number): Promise<TravelDocument[]> {
    return Array.from(this.travelDocuments.values()).filter(doc => doc.userId === userId);
  }

  async createTravelDocument(insertDocument: InsertTravelDocument): Promise<TravelDocument> {
    const document: TravelDocument = {
      id: this.currentId++,
      ...insertDocument,
      uploadDate: new Date(),
      createdAt: new Date()
    };
    this.travelDocuments.set(document.id, document);
    return document;
  }

  async deleteTravelDocument(id: number, userId: number): Promise<boolean> {
    const document = this.travelDocuments.get(id);
    if (!document || document.userId !== userId) return false;
    
    return this.travelDocuments.delete(id);
  }
}

// Choose storage based on available databases
let storage: IStorage;

async function initializeStorage(): Promise<IStorage> {
  // Try PostgreSQL
  if (db) {
    try {
      const pgStorage = new DatabaseStorage();
      // Test PostgreSQL connection
      await pgStorage.getHotels();
      console.log("✅ Using PostgreSQL storage");
      return pgStorage;
    } catch (error) {
      console.log("⚠️  PostgreSQL storage failed, using memory storage...");
    }
  }

  // Fallback to memory storage
  const memoryStorage = new MemoryStorage();
  console.log("✅ Using memory storage (comprehensive sample data)");
  return memoryStorage;
}

// Initialize storage - will be set by initializeStorage()
storage = new MemoryStorage(); // temporary fallback

// Initialize the appropriate storage
initializeStorage().then(initializedStorage => {
  storage = initializedStorage;
}).catch(error => {
  console.error("Failed to initialize storage:", error);
  console.log("Using memory storage as fallback");
});

export { storage };
