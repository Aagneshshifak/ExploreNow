export const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    createdAt: String!
  }

  type Trip {
    id: ID!
    title: String!
    location: String!
    description: String
    price: Float!
    imageUrl: String
    duration: Int
    tags: [String]
    includes: [String]
    createdAt: String!
  }

  type Hotel {
    id: ID!
    name: String!
    location: String!
    description: String
    price: Float!
    imageUrl: String
    rating: Float
    tags: [String]
    includes: [String]
    amenities: [String]
    createdAt: String!
  }

  type Booking {
    id: ID!
    tripId: String!
    hotelId: String!
    customerName: String!
    email: String!
    phone: String!
    transport: String!
    checkIn: String!
    checkOut: String!
    guests: Int!
    totalCost: Float!
    status: String!
    paymentStatus: String
    createdAt: String!
    trip: Trip
    hotel: Hotel
  }

  type Payment {
    id: ID!
    bookingId: Int!
    userId: Int!
    amount: Float!
    currency: String!
    paymentMethod: String!
    cardHolderName: String!
    cardLastFour: String!
    status: String!
    transactionId: String!
    createdAt: String!
    booking: Booking
    user: User
  }

  type Review {
    id: ID!
    userId: Int!
    tripId: Int
    hotelId: Int
    rating: Int!
    title: String!
    comment: String!
    createdAt: String!
    user: User
    trip: Trip
    hotel: Hotel
  }

  type AuthResponse {
    success: Boolean!
    user: User
    token: String
    message: String!
  }

  type BookingResponse {
    success: Boolean!
    booking: Booking
    message: String!
  }

  type PaymentResponse {
    success: Boolean!
    payment: Payment
    message: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
    role: String
  }

  input BookingInput {
    tripId: String!
    hotelId: String!
    customerName: String!
    email: String!
    phone: String!
    transport: String!
    checkIn: String!
    checkOut: String!
    guests: Int!
    totalCost: Float!
  }

  input PaymentInput {
    bookingId: Int!
    amount: Float!
    cardHolderName: String!
    cardNumber: String!
    cvv: String!
  }

  input ReviewInput {
    tripId: Int
    hotelId: Int
    rating: Int!
    title: String!
    comment: String!
  }

  type Query {
    # User queries
    me: User
    users: [User!]!
    user(id: ID!): User

    # Trip queries
    trips: [Trip!]!
    trip(id: ID!): Trip
    tripsByLocation(location: String!): [Trip!]!

    # Hotel queries
    hotels: [Hotel!]!
    hotel(id: ID!): Hotel
    hotelsByLocation(location: String!): [Hotel!]!

    # Booking queries
    bookings: [Booking!]!
    booking(id: ID!): Booking
    userBookings: [Booking!]!

    # Payment queries
    payments: [Payment!]!
    payment(id: ID!): Payment
    bookingPayments(bookingId: ID!): [Payment!]!

    # Review queries
    reviews: [Review!]!
    review(id: ID!): Review
    tripReviews(tripId: ID!): [Review!]!
    hotelReviews(hotelId: ID!): [Review!]!
  }

  type Mutation {
    # Auth mutations
    login(input: LoginInput!): AuthResponse!
    register(input: RegisterInput!): AuthResponse!
    logout: AuthResponse!

    # Booking mutations
    createBooking(input: BookingInput!): BookingResponse!
    updateBookingStatus(id: ID!, status: String!): BookingResponse!

    # Payment mutations
    createPayment(input: PaymentInput!): PaymentResponse!

    # Review mutations
    createReview(input: ReviewInput!): Review!
    updateReview(id: ID!, input: ReviewInput!): Review!
    deleteReview(id: ID!): Boolean!
  }
`;
