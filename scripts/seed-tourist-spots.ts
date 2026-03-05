import "dotenv/config";
import { db } from "../server/db";
import { touristSpots } from "../shared/schema";

// Helper function to generate additional spots for testing clustering
function generateAdditionalSpots(count: number): Array<typeof touristSpotsData[number]> {
  const categories = ["museum", "beach", "monument", "park", "religious_site", "market", "viewpoint"];
  const cities = [
    { name: "New York", country: "United States", lat: 40.7128, lon: -74.0060 },
    { name: "London", country: "United Kingdom", lat: 51.5074, lon: -0.1278 },
    { name: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503 },
    { name: "Paris", country: "France", lat: 48.8566, lon: 2.3522 },
    { name: "Mumbai", country: "India", lat: 19.0760, lon: 72.8777 },
  ];
  
  const additionalSpots: any[] = [];
  for (let i = 0; i < count; i++) {
    const city = cities[i % cities.length];
    const category = categories[i % categories.length];
    // Add random offset to coordinates (within ~5km radius)
    const latOffset = (Math.random() - 0.5) * 0.1;
    const lonOffset = (Math.random() - 0.5) * 0.1;
    
    additionalSpots.push({
      name: `${category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')} Spot ${i + 1}`,
      country: city.country,
      city: city.name,
      latitude: (city.lat + latOffset).toFixed(7),
      longitude: (city.lon + lonOffset).toFixed(7),
      category: category,
      description: `A popular ${category.replace('_', ' ')} attraction in ${city.name}. Great for tourists looking to explore the local culture and history.`,
      images: ["https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800"],
    });
  }
  
  return additionalSpots;
}

const touristSpotsData = [
  // New York City - 6 spots
  {
    name: "Statue of Liberty",
    country: "United States",
    city: "New York",
    latitude: "40.6892494",
    longitude: "-74.0445004",
    category: "monument",
    description: "Iconic copper statue symbolizing freedom and democracy, gifted by France in 1886. Visitors can explore Liberty Island and climb to the crown for panoramic views of New York Harbor.",
    images: ["https://images.unsplash.com/photo-1569982175971-d92b01cf8694?w=800"],
  },
  {
    name: "Central Park",
    country: "United States",
    city: "New York",
    latitude: "40.7828647",
    longitude: "-73.9653551",
    category: "park",
    description: "843-acre urban park in Manhattan featuring lakes, walking paths, playgrounds, and cultural attractions. A green oasis in the heart of the city offering year-round recreational activities.",
    images: ["https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800"],
  },
  {
    name: "Metropolitan Museum of Art",
    country: "United States",
    city: "New York",
    latitude: "40.7794366",
    longitude: "-73.963244",
    category: "museum",
    description: "One of the world's largest and finest art museums, housing over 2 million works spanning 5,000 years of culture from around the globe.",
    images: ["https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800"],
  },
  {
    name: "Times Square",
    country: "United States",
    city: "New York",
    latitude: "40.758896",
    longitude: "-73.9851644",
    category: "viewpoint",
    description: "Bustling commercial intersection and entertainment hub known for its bright LED billboards, Broadway theaters, and vibrant atmosphere. The crossroads of the world.",
    images: ["https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=800"],
  },
  {
    name: "Brooklyn Bridge",
    country: "United States",
    city: "New York",
    latitude: "40.7060855",
    longitude: "-73.9968643",
    category: "monument",
    description: "Historic suspension bridge connecting Manhattan and Brooklyn, completed in 1883. Features a pedestrian walkway offering stunning views of the Manhattan skyline.",
    images: ["https://images.unsplash.com/photo-1513026705753-bc3fffca8bf4?w=800"],
  },
  {
    name: "Chelsea Market",
    country: "United States",
    city: "New York",
    latitude: "40.7425447",
    longitude: "-74.0059729",
    category: "market",
    description: "Upscale food hall and shopping mall in a former Nabisco factory, featuring artisanal food vendors, restaurants, and unique shops in Manhattan's Meatpacking District.",
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"],
  },

  // London - 6 spots
  {
    name: "Tower of London",
    country: "United Kingdom",
    city: "London",
    latitude: "51.5081124",
    longitude: "-0.0759493",
    category: "monument",
    description: "Historic castle and UNESCO World Heritage Site founded in 1066, home to the Crown Jewels and centuries of British history. Former royal palace, prison, and fortress.",
    images: ["https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800"],
  },
  {
    name: "British Museum",
    country: "United Kingdom",
    city: "London",
    latitude: "51.5194133",
    longitude: "-0.1269566",
    category: "museum",
    description: "World-renowned museum dedicated to human history, art, and culture, featuring over 8 million works including the Rosetta Stone and Egyptian mummies. Free admission.",
    images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800"],
  },
  {
    name: "Hyde Park",
    country: "United Kingdom",
    city: "London",
    latitude: "51.5072682",
    longitude: "-0.1657303",
    category: "park",
    description: "350-acre Royal Park in central London featuring the Serpentine lake, Speaker's Corner, and beautiful gardens. Perfect for picnics, boating, and outdoor concerts.",
    images: ["https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800"],
  },
  {
    name: "Westminster Abbey",
    country: "United Kingdom",
    city: "London",
    latitude: "51.4993168",
    longitude: "-0.1273368",
    category: "religious_site",
    description: "Gothic abbey church and UNESCO World Heritage Site, coronation church since 1066. Final resting place of monarchs, poets, and scientists including Isaac Newton.",
    images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800"],
  },
  {
    name: "London Eye",
    country: "United Kingdom",
    city: "London",
    latitude: "51.5033416",
    longitude: "-0.1195537",
    category: "viewpoint",
    description: "Giant observation wheel on the South Bank offering breathtaking 360-degree views of London's skyline. Each rotation takes 30 minutes in climate-controlled capsules.",
    images: ["https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800"],
  },
  {
    name: "Borough Market",
    country: "United Kingdom",
    city: "London",
    latitude: "51.5054306",
    longitude: "-0.0913008",
    category: "market",
    description: "Historic food market dating back to 1014, featuring artisan producers, street food stalls, and fresh produce. A culinary destination in the heart of London.",
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"],
  },

  // Tokyo - 6 spots
  {
    name: "Senso-ji Temple",
    country: "Japan",
    city: "Tokyo",
    latitude: "35.7147651",
    longitude: "139.7966553",
    category: "religious_site",
    description: "Tokyo's oldest Buddhist temple founded in 645 AD, featuring the iconic Thunder Gate and bustling Nakamise shopping street. A spiritual and cultural landmark in Asakusa.",
    images: ["https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800"],
  },
  {
    name: "Tokyo National Museum",
    country: "Japan",
    city: "Tokyo",
    latitude: "35.7188004",
    longitude: "139.7762464",
    category: "museum",
    description: "Japan's oldest and largest museum, housing the world's largest collection of Japanese art including samurai swords, kimonos, and ancient pottery.",
    images: ["https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800"],
  },
  {
    name: "Shinjuku Gyoen National Garden",
    country: "Japan",
    city: "Tokyo",
    latitude: "35.6851766",
    longitude: "139.7100627",
    category: "park",
    description: "Expansive park blending Japanese traditional, English landscape, and French formal garden styles. Famous for cherry blossoms in spring and chrysanthemums in autumn.",
    images: ["https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800"],
  },
  {
    name: "Tokyo Skytree",
    country: "Japan",
    city: "Tokyo",
    latitude: "35.7100627",
    longitude: "139.8107004",
    category: "viewpoint",
    description: "World's tallest tower at 634 meters, offering observation decks with stunning panoramic views of Tokyo and Mount Fuji on clear days. Modern architectural marvel.",
    images: ["https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800"],
  },
  {
    name: "Tsukiji Outer Market",
    country: "Japan",
    city: "Tokyo",
    latitude: "35.6654861",
    longitude: "139.7706697",
    category: "market",
    description: "Vibrant seafood and food market offering fresh sushi, street food, and culinary tools. A paradise for food lovers seeking authentic Japanese cuisine.",
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"],
  },
  {
    name: "Meiji Shrine",
    country: "Japan",
    city: "Tokyo",
    latitude: "35.6763976",
    longitude: "139.6993259",
    category: "religious_site",
    description: "Shinto shrine dedicated to Emperor Meiji and Empress Shoken, surrounded by a tranquil forest of 100,000 trees. A peaceful retreat in bustling Shibuya.",
    images: ["https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800"],
  },

  // Paris - 6 spots
  {
    name: "Eiffel Tower",
    country: "France",
    city: "Paris",
    latitude: "48.8583701",
    longitude: "2.2944813",
    category: "monument",
    description: "Iconic iron lattice tower built in 1889, standing 330 meters tall. Symbol of Paris offering three observation levels with breathtaking views of the city.",
    images: ["https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800"],
  },
  {
    name: "Louvre Museum",
    country: "France",
    city: "Paris",
    latitude: "48.8606111",
    longitude: "2.337644",
    category: "museum",
    description: "World's largest art museum and historic monument, home to the Mona Lisa and Venus de Milo. Houses 38,000 objects from prehistory to the 21st century.",
    images: ["https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800"],
  },
  {
    name: "Luxembourg Gardens",
    country: "France",
    city: "Paris",
    latitude: "48.8462807",
    longitude: "2.3371356",
    category: "park",
    description: "Beautiful 23-hectare park featuring French and English gardens, orchards, fountains, and the Luxembourg Palace. Popular spot for picnics and leisure.",
    images: ["https://images.unsplash.com/photo-1524396309943-e03f5249f002?w=800"],
  },
  {
    name: "Notre-Dame Cathedral",
    country: "France",
    city: "Paris",
    latitude: "48.8529682",
    longitude: "2.3499021",
    category: "religious_site",
    description: "Medieval Catholic cathedral and masterpiece of French Gothic architecture, famous for its rose windows, gargoyles, and literary significance. Currently under restoration.",
    images: ["https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800"],
  },
  {
    name: "Montmartre",
    country: "France",
    city: "Paris",
    latitude: "48.8867321",
    longitude: "2.3431148",
    category: "viewpoint",
    description: "Historic hilltop neighborhood crowned by Sacré-Cœur Basilica, offering panoramic views of Paris. Former bohemian quarter home to artists like Picasso and Van Gogh.",
    images: ["https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800"],
  },
  {
    name: "Marché aux Puces de Saint-Ouen",
    country: "France",
    city: "Paris",
    latitude: "48.9014149",
    longitude: "2.3316844",
    category: "market",
    description: "World's largest antique market with over 2,000 dealers selling vintage furniture, art, jewelry, and collectibles. A treasure hunter's paradise since 1885.",
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"],
  },

  // Mumbai - 6 spots
  {
    name: "Gateway of India",
    country: "India",
    city: "Mumbai",
    latitude: "18.9219841",
    longitude: "72.8346543",
    category: "monument",
    description: "Iconic arch monument built in 1924 to commemorate King George V's visit. Overlooks the Arabian Sea and serves as Mumbai's most recognizable landmark.",
    images: ["https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800"],
  },
  {
    name: "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya",
    country: "India",
    city: "Mumbai",
    latitude: "18.9269166",
    longitude: "72.8324851",
    category: "museum",
    description: "Premier museum showcasing Indian art, archaeology, and natural history. Housed in a stunning Indo-Saracenic building with over 50,000 artifacts.",
    images: ["https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800"],
  },
  {
    name: "Sanjay Gandhi National Park",
    country: "India",
    city: "Mumbai",
    latitude: "19.2342149",
    longitude: "72.9100627",
    category: "park",
    description: "Protected area within city limits featuring lush forests, ancient Kanheri Caves, and diverse wildlife including leopards. A green lung for Mumbai.",
    images: ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"],
  },
  {
    name: "Siddhivinayak Temple",
    country: "India",
    city: "Mumbai",
    latitude: "19.0176147",
    longitude: "72.8561644",
    category: "religious_site",
    description: "Revered Hindu temple dedicated to Lord Ganesha, attracting thousands of devotees daily. Known for its distinctive architecture and spiritual significance.",
    images: ["https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800"],
  },
  {
    name: "Marine Drive",
    country: "India",
    city: "Mumbai",
    latitude: "18.9432149",
    longitude: "72.8232644",
    category: "viewpoint",
    description: "3-kilometer boulevard along the Arabian Sea, known as the Queen's Necklace for its sparkling night lights. Popular promenade for sunset views.",
    images: ["https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800"],
  },
  {
    name: "Crawford Market",
    country: "India",
    city: "Mumbai",
    latitude: "18.9476149",
    longitude: "72.8346543",
    category: "market",
    description: "Historic wholesale market built in 1869, offering fresh produce, spices, flowers, and exotic pets. A sensory experience showcasing Mumbai's vibrant commerce.",
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"],
  },

  // Coimbatore - 8 spots
  {
    name: "Marudhamalai Temple",
    country: "India",
    city: "Coimbatore",
    latitude: "11.0493",
    longitude: "76.8428",
    category: "religious_site",
    description: "Ancient hill temple dedicated to Lord Murugan, located 12km from Coimbatore. Situated at 500 feet elevation with 659 steps, offering panoramic views of the Western Ghats.",
    images: [
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800",
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800",
      "https://images.unsplash.com/photo-1548013146-72479768bada?w=800"
    ],
    openingHours: "6:00 AM - 8:00 PM",
    bestTimeToVisit: "Early morning (6-8 AM) or evening (5-7 PM)",
  },
  {
    name: "Perur Pateeswarar Temple",
    country: "India",
    city: "Coimbatore",
    latitude: "11.0168",
    longitude: "76.9558",
    category: "religious_site",
    description: "Historic 2000-year-old Shiva temple known for its Dravidian architecture and intricate stone carvings. Features beautiful sculptures and a sacred tank.",
    images: [
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800",
      "https://images.unsplash.com/photo-1609920658906-8223bd289001?w=800",
      "https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?w=800"
    ],
    openingHours: "5:30 AM - 12:30 PM, 4:00 PM - 8:30 PM",
    bestTimeToVisit: "Early morning (6-8 AM) for peaceful darshan",
  },
  {
    name: "VOC Park and Zoo",
    country: "India",
    city: "Coimbatore",
    latitude: "11.0168",
    longitude: "76.9558",
    category: "park",
    description: "Popular urban park and mini zoo spread across 100 acres. Features walking trails, children's play areas, and a variety of animals and birds.",
    images: [
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800",
      "https://images.unsplash.com/photo-1516214104703-d870798883c5?w=800"
    ],
    openingHours: "9:00 AM - 6:00 PM (Closed on Tuesdays)",
    bestTimeToVisit: "Weekday mornings (9-11 AM) to avoid crowds",
  },
  {
    name: "Gass Forest Museum",
    country: "India",
    city: "Coimbatore",
    latitude: "11.0168",
    longitude: "76.9558",
    category: "museum",
    description: "One of India's oldest forest museums, showcasing forestry artifacts, wood samples, and wildlife specimens. Educational exhibits on Western Ghats biodiversity.",
    images: [
      "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800",
      "https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=800",
      "https://images.unsplash.com/photo-1577985043696-0d79c2b6e3f5?w=800"
    ],
    openingHours: "10:00 AM - 5:00 PM (Closed on Fridays)",
    bestTimeToVisit: "Weekday afternoons (2-4 PM) for guided tours",
  },
  {
    name: "Siruvani Waterfalls",
    country: "India",
    city: "Coimbatore",
    latitude: "10.9167",
    longitude: "76.6833",
    category: "viewpoint",
    description: "Scenic waterfalls 37km from Coimbatore, known for the sweetest water in the world. Surrounded by dense forests and wildlife, perfect for nature lovers.",
    images: [
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800",
      "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"
    ],
    openingHours: "6:00 AM - 6:00 PM",
    bestTimeToVisit: "Post-monsoon (October-February) for best water flow",
  },
  {
    name: "Kovai Kutralam Falls",
    country: "India",
    city: "Coimbatore",
    latitude: "10.9333",
    longitude: "76.8833",
    category: "viewpoint",
    description: "Beautiful waterfall located 35km from Coimbatore city. Popular picnic spot with natural pools and lush greenery, especially vibrant during monsoon season.",
    images: [
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800",
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
      "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800"
    ],
    openingHours: "7:00 AM - 6:00 PM",
    bestTimeToVisit: "Monsoon season (June-September) for maximum water flow",
  },
  {
    name: "Brookefields Mall",
    country: "India",
    city: "Coimbatore",
    latitude: "11.0168",
    longitude: "76.9558",
    category: "market",
    description: "Modern shopping mall and entertainment complex. Features retail stores, food court, multiplex cinema, and family entertainment options.",
    images: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
      "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800",
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"
    ],
    openingHours: "10:00 AM - 10:00 PM (Daily)",
    bestTimeToVisit: "Weekday afternoons (2-5 PM) to avoid weekend crowds",
  },
  {
    name: "Dhyanalinga Temple",
    country: "India",
    city: "Coimbatore",
    latitude: "11.0000",
    longitude: "76.7333",
    category: "religious_site",
    description: "Unique meditative space at Isha Yoga Center, featuring a powerful energy form. Open to people of all faiths for meditation and spiritual practices.",
    images: [
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800",
      "https://images.unsplash.com/photo-1604608672516-f1b9b1a4a0e5?w=800",
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800"
    ],
    openingHours: "6:00 AM - 8:00 PM (Daily)",
    bestTimeToVisit: "Early morning (6-8 AM) for peaceful meditation",
  },
];

async function seedTouristSpots() {
  try {
    console.log("🌍 Starting tourist spots seeding...");
    
    // Generate additional spots for clustering test (100+ total)
    const additionalSpots = generateAdditionalSpots(75);
    const allSpots = [...touristSpotsData, ...additionalSpots];
    
    console.log(`📊 Total spots to seed: ${allSpots.length}`);
    
    // Insert all tourist spots
    for (const spot of allSpots) {
      await db.insert(touristSpots).values(spot);
      console.log(`✅ Added: ${spot.name} in ${spot.city}`);
    }
    
    console.log(`\n🎉 Successfully seeded ${allSpots.length} tourist spots!`);
    console.log("\nBreakdown:");
    console.log(`- Original curated spots: ${touristSpotsData.length}`);
    console.log(`- Generated test spots: ${additionalSpots.length}`);
    console.log(`- Total: ${allSpots.length} spots`);
    console.log("\n✨ Map clustering will be tested with 100+ markers!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding tourist spots:", error);
    process.exit(1);
  }
}

seedTouristSpots();
