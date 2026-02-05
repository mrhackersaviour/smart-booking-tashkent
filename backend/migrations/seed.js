require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'smart_booking.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function seed() {
  const passwordHash = bcrypt.hashSync('demo123456', 12);

  const insertUser = db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, phone, loyalty_points, subscription_tier) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const usersData = [
    ['demo@smartbooking.uz', 'Aziz Karimov', '+998901234567', 1500, 'premium'],
    ['fatima@smartbooking.uz', 'Fatima Rakhimova', '+998901234568', 800, 'basic'],
    ['ruslan@smartbooking.uz', 'Ruslan Petrov', '+998901234569', 2200, 'vip'],
    ['nilufar@smartbooking.uz', 'Nilufar Usmanova', '+998901234570', 350, 'free'],
    ['timur@smartbooking.uz', 'Timur Aliyev', '+998901234571', 1100, 'basic'],
  ];

  const transaction = db.transaction(() => {
    // Users
    const userIds = [];
    for (const [email, name, phone, points, tier] of usersData) {
      const id = uuidv4();
      insertUser.run(id, email, passwordHash, name, phone, points, tier);
      userIds.push(id);
      console.log(`Created user: ${email}`);
    }

    // Venues
    const insertVenue = db.prepare(
      `INSERT INTO venues (id, name, type, address, district, latitude, longitude, description, cuisine_type, price_range, rating, total_reviews, amenities, opening_hours, images, phone, three_d_model_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const venuesData = [
      ['Plov Center Yunusabad', 'restaurant', '45 Amir Temur Street, Yunusabad', 'Yunusabad', 41.3385, 69.2854,
        'The most authentic plov experience in Tashkent. Our master chefs prepare traditional Uzbek plov using century-old recipes, cooked in massive kazans over open flame.',
        'Uzbek Traditional', 2, 4.8, 342,
        '["WiFi", "Parking", "Outdoor Seating", "Live Music", "Halal"]',
        '{"monday":{"open":"07:00","close":"23:00"},"tuesday":{"open":"07:00","close":"23:00"},"wednesday":{"open":"07:00","close":"23:00"},"thursday":{"open":"07:00","close":"23:00"},"friday":{"open":"07:00","close":"00:00"},"saturday":{"open":"07:00","close":"00:00"},"sunday":{"open":"08:00","close":"22:00"}}',
        '["/images/venues/restaurant-plov.jpg"]', '+998712345001', '3gSxqJWRfG3'],
      ['The Silk Road Lounge', 'cafe', '12 Navoi Street, Mirzo Ulugbek', 'Mirzo Ulugbek', 41.3440, 69.2867,
        'A modern cafe inspired by the ancient Silk Road, blending Eastern and Western culinary traditions. Specialty coffees, artisan teas, and a fusion menu.',
        'International Fusion', 3, 4.6, 218,
        '["WiFi", "AC", "Power Outlets", "Book Corner", "Terrace", "Vegetarian Options"]',
        '{"monday":{"open":"08:00","close":"23:00"},"tuesday":{"open":"08:00","close":"23:00"},"wednesday":{"open":"08:00","close":"23:00"},"thursday":{"open":"08:00","close":"23:00"},"friday":{"open":"08:00","close":"00:00"},"saturday":{"open":"09:00","close":"00:00"},"sunday":{"open":"09:00","close":"22:00"}}',
        '["/images/silk-road-1.jpg"]', '+998712345002', 'wStbQsn2Tab'],
      ['Afsona Restaurant', 'restaurant', '78 Buyuk Ipak Yuli, Yakkasaray', 'Yakkasaray', 41.3067, 69.2787,
        'Fine dining meets Uzbek tradition. Award-winning chefs create stunning interpretations of classic Uzbek dishes with modern flair.',
        'Modern Uzbek', 4, 4.9, 456,
        '["WiFi", "Valet Parking", "Private Rooms", "Live Music", "Wine Bar", "Halal", "AC"]',
        '{"monday":{"open":"11:00","close":"00:00"},"tuesday":{"open":"11:00","close":"00:00"},"wednesday":{"open":"11:00","close":"00:00"},"thursday":{"open":"11:00","close":"00:00"},"friday":{"open":"11:00","close":"01:00"},"saturday":{"open":"11:00","close":"01:00"},"sunday":{"open":"12:00","close":"23:00"}}',
        '["/images/afsona-1.jpg"]', '+998712345003', 'oCaM5CSX6hT'],
      ['Kebab House Chilanzar', 'restaurant', '34 Bunyodkor Avenue, Chilanzar', 'Chilanzar', 41.2890, 69.2190,
        'Famous across Tashkent for the juiciest kebabs, grilled to perfection over charcoal. Family-friendly atmosphere with generous portions.',
        'Kebab & Grill', 2, 4.5, 567,
        '["Parking", "Outdoor Seating", "Kids Area", "Halal", "Takeaway"]',
        '{"monday":{"open":"10:00","close":"23:00"},"tuesday":{"open":"10:00","close":"23:00"},"wednesday":{"open":"10:00","close":"23:00"},"thursday":{"open":"10:00","close":"23:00"},"friday":{"open":"10:00","close":"00:00"},"saturday":{"open":"10:00","close":"00:00"},"sunday":{"open":"10:00","close":"22:00"}}',
        '["/images/kebab-house-1.jpg"]', '+998712345004', null],
      ['Samsa & Chai', 'cafe', '56 Shota Rustaveli, Sergeli', 'Sergeli', 41.2440, 69.2220,
        'Cozy neighborhood cafe specializing in freshly baked samsa varieties and premium teas. Over 20 types of samsa from across Uzbekistan.',
        'Uzbek Traditional', 1, 4.3, 189,
        '["WiFi", "Takeaway", "Delivery", "Halal"]',
        '{"monday":{"open":"06:00","close":"22:00"},"tuesday":{"open":"06:00","close":"22:00"},"wednesday":{"open":"06:00","close":"22:00"},"thursday":{"open":"06:00","close":"22:00"},"friday":{"open":"06:00","close":"22:00"},"saturday":{"open":"07:00","close":"22:00"},"sunday":{"open":"07:00","close":"21:00"}}',
        '["/images/samsa-chai-1.jpg"]', '+998712345005', null],
      ['Milliy Stadium', 'stadium', '1 Milliy Bog Avenue, Almazar', 'Almazar', 41.3210, 69.2340,
        'Tashkent\'s premier multi-purpose stadium hosting football matches, concerts, and cultural events. Capacity: 34,000.',
        null, 3, 4.4, 890,
        '["Parking", "Food Court", "VIP Boxes", "Disabled Access", "Big Screen"]',
        '{"event_based":true}',
        '["/images/milliy-stadium-1.jpg"]', '+998712345006', null],
      ['Bunyodkor Arena', 'stadium', '15 Bunyodkor Street, Chilanzar', 'Chilanzar', 41.2950, 69.2050,
        'State-of-the-art indoor arena for basketball, volleyball, boxing events, and entertainment shows.',
        null, 3, 4.3, 445,
        '["Parking", "Food Court", "VIP Lounge", "Disabled Access", "Indoor"]',
        '{"event_based":true}',
        '["/images/bunyodkor-arena-1.jpg"]', '+998712345007', null],
      ['FitLife Gym Yunusabad', 'fitness', '22 Amir Temur Street, Yunusabad', 'Yunusabad', 41.3400, 69.2810,
        'Premium fitness center with state-of-the-art equipment, Olympic-size pool, group classes, and personal training.',
        null, 3, 4.7, 312,
        '["Pool", "Sauna", "Parking", "Showers", "Lockers", "Personal Trainers", "Group Classes", "AC"]',
        '{"monday":{"open":"06:00","close":"23:00"},"tuesday":{"open":"06:00","close":"23:00"},"wednesday":{"open":"06:00","close":"23:00"},"thursday":{"open":"06:00","close":"23:00"},"friday":{"open":"06:00","close":"22:00"},"saturday":{"open":"07:00","close":"22:00"},"sunday":{"open":"08:00","close":"20:00"}}',
        '["/images/fitlife-1.jpg"]', '+998712345008', null],
      ['Workout Zone', 'fitness', '8 Mukimi Street, Mirzo Ulugbek', 'Mirzo Ulugbek', 41.3500, 69.2900,
        'Modern functional training center focused on CrossFit, martial arts, and HIIT classes.',
        null, 2, 4.5, 198,
        '["Showers", "Lockers", "Personal Trainers", "Group Classes", "Martial Arts"]',
        '{"monday":{"open":"06:00","close":"22:00"},"tuesday":{"open":"06:00","close":"22:00"},"wednesday":{"open":"06:00","close":"22:00"},"thursday":{"open":"06:00","close":"22:00"},"friday":{"open":"06:00","close":"21:00"},"saturday":{"open":"08:00","close":"20:00"},"sunday":{"open":"08:00","close":"18:00"}}',
        '["/images/workout-zone-1.jpg"]', '+998712345009', null],
      ['Iron Body Fitness', 'fitness', '90 Labzak Street, Yakkasaray', 'Yakkasaray', 41.3150, 69.2700,
        'Bodybuilding and powerlifting focused gym with competition-grade equipment.',
        null, 2, 4.4, 156,
        '["Showers", "Lockers", "Supplement Bar", "Personal Trainers", "Parking"]',
        '{"monday":{"open":"06:00","close":"23:00"},"tuesday":{"open":"06:00","close":"23:00"},"wednesday":{"open":"06:00","close":"23:00"},"thursday":{"open":"06:00","close":"23:00"},"friday":{"open":"06:00","close":"22:00"},"saturday":{"open":"07:00","close":"21:00"},"sunday":{"open":"08:00","close":"20:00"}}',
        '["/images/iron-body-1.jpg"]', '+998712345010', null],
      ['Sultan Barbershop', 'barbershop', '15 Amir Temur Square, Yunusabad', 'Yunusabad', 41.3360, 69.2790,
        'Premium men\'s grooming experience combining traditional Turkish barbering with modern techniques.',
        null, 3, 4.8, 234,
        '["WiFi", "AC", "Beverages", "Parking", "Online Booking", "Premium Products"]',
        '{"monday":{"open":"09:00","close":"21:00"},"tuesday":{"open":"09:00","close":"21:00"},"wednesday":{"open":"09:00","close":"21:00"},"thursday":{"open":"09:00","close":"21:00"},"friday":{"open":"09:00","close":"21:00"},"saturday":{"open":"09:00","close":"21:00"},"sunday":{"open":"10:00","close":"18:00"}}',
        '["/images/sultan-barber-1.jpg"]', '+998712345011', null],
      ['Classic Cuts Studio', 'barbershop', '42 Oybek Street, Mirzo Ulugbek', 'Mirzo Ulugbek', 41.3470, 69.2850,
        'Trendy barbershop for the modern man. Specializing in contemporary cuts, fades, and creative styling.',
        null, 2, 4.6, 178,
        '["WiFi", "AC", "Beverages", "Music", "Online Booking"]',
        '{"monday":{"open":"10:00","close":"20:00"},"tuesday":{"open":"10:00","close":"20:00"},"wednesday":{"open":"10:00","close":"20:00"},"thursday":{"open":"10:00","close":"20:00"},"friday":{"open":"10:00","close":"20:00"},"saturday":{"open":"10:00","close":"20:00"},"sunday":{"open":"closed","close":"closed"}}',
        '["/images/classic-cuts-1.jpg"]', '+998712345012', null],
      ['AquaShine Car Wash', 'carwash', '88 Buyuk Turon Street, Chilanzar', 'Chilanzar', 41.2920, 69.2150,
        'Full-service premium car wash and detailing center. From quick exterior washes to complete interior detailing.',
        null, 2, 4.5, 290,
        '["Waiting Lounge", "WiFi", "Cafe", "Detailing", "Interior Cleaning", "Wax Polish"]',
        '{"monday":{"open":"08:00","close":"20:00"},"tuesday":{"open":"08:00","close":"20:00"},"wednesday":{"open":"08:00","close":"20:00"},"thursday":{"open":"08:00","close":"20:00"},"friday":{"open":"08:00","close":"20:00"},"saturday":{"open":"08:00","close":"20:00"},"sunday":{"open":"09:00","close":"18:00"}}',
        '["/images/aquashine-1.jpg"]', '+998712345013', null],
      ['SparkleWash Express', 'carwash', '25 Nukus Street, Sergeli', 'Sergeli', 41.2480, 69.2300,
        'Fast, affordable, and thorough car cleaning. Automated wash lanes plus hand-wash options for premium care.',
        null, 1, 4.2, 145,
        '["Automated Wash", "Hand Wash", "Vacuum", "Air Freshener", "Loyalty Card"]',
        '{"monday":{"open":"07:00","close":"21:00"},"tuesday":{"open":"07:00","close":"21:00"},"wednesday":{"open":"07:00","close":"21:00"},"thursday":{"open":"07:00","close":"21:00"},"friday":{"open":"07:00","close":"21:00"},"saturday":{"open":"07:00","close":"21:00"},"sunday":{"open":"08:00","close":"19:00"}}',
        '["/images/sparklewash-1.jpg"]', '+998712345014', null],
    ];

    const venueIds = [];
    for (const v of venuesData) {
      const id = uuidv4();
      insertVenue.run(id, ...v);
      venueIds.push({ id, name: v[0], type: v[1] });
    }
    console.log(`Created ${venueIds.length} venues`);

    // Tables for restaurants/cafes
    const insertTable = db.prepare(
      `INSERT INTO venue_tables (id, venue_id, table_number, label, capacity, shape, position_x, position_y, position_z, is_vip, price_multiplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const cafeVenues = venueIds.filter(v => ['cafe', 'restaurant'].includes(v.type));
    for (const venue of cafeVenues) {
      const tableCount = venue.type === 'restaurant' ? 12 : 8;
      for (let i = 1; i <= tableCount; i++) {
        const capacity = i <= 4 ? 2 : i <= 8 ? 4 : 6;
        const shape = capacity === 2 ? 'round' : capacity === 4 ? 'square' : 'rectangular';
        const isVip = i > tableCount - 2 ? 1 : 0;
        const priceMult = isVip ? 1.5 : 1.0;
        const px = (i % 4) * 3 - 4.5;
        const py = 0;
        const pz = Math.floor(i / 4) * 3 - 4.5;
        insertTable.run(uuidv4(), venue.id, i, `Table ${i}`, capacity, shape, px, py, pz, isVip, priceMult);
      }
    }
    console.log('Created venue tables');

    // Bookings
    const insertBooking = db.prepare(
      `INSERT INTO bookings (id, user_id, venue_id, booking_date, start_time, end_time, guests_count, status, total_price, loyalty_points_earned, special_requests) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const today = new Date().toISOString().split('T')[0];
    const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

    insertBooking.run(uuidv4(), userIds[0], venueIds[0].id, addDays(today, 1), '19:00', '21:00', 4, 'confirmed', 450000, 45, 'Window table preferred');
    insertBooking.run(uuidv4(), userIds[0], venueIds[1].id, addDays(today, 3), '12:00', '14:00', 2, 'pending', 280000, 28, null);
    insertBooking.run(uuidv4(), userIds[1], venueIds[2].id, addDays(today, 2), '18:00', '20:30', 6, 'confirmed', 720000, 72, 'Birthday celebration');
    insertBooking.run(uuidv4(), userIds[2], venueIds[0].id, addDays(today, -2), '20:00', '22:00', 2, 'completed', 350000, 35, null);
    insertBooking.run(uuidv4(), userIds[3], venueIds[3].id, addDays(today, 5), '13:00', '15:00', 3, 'pending', 195000, 19, 'Quiet area please');
    insertBooking.run(uuidv4(), userIds[4], venueIds[4].id, addDays(today, 1), '19:30', '21:30', 4, 'confirmed', 520000, 52, null);
    console.log('Created sample bookings');

    // Reviews
    const insertReview = db.prepare(
      `INSERT INTO reviews (id, user_id, venue_id, rating, comment, is_verified) VALUES (?, ?, ?, ?, ?, 1)`
    );

    insertReview.run(uuidv4(), userIds[0], venueIds[0].id, 5, 'Best plov in Tashkent! The rice is perfectly cooked and the meat is tender.');
    insertReview.run(uuidv4(), userIds[1], venueIds[1].id, 4, 'Beautiful atmosphere and great coffee. The fusion menu is creative.');
    insertReview.run(uuidv4(), userIds[2], venueIds[2].id, 5, 'Absolutely stunning restaurant. The modern take on Uzbek cuisine is brilliant.');
    insertReview.run(uuidv4(), userIds[3], venueIds[3].id, 5, 'The kebabs here are incredible. Generous portions and very affordable.');
    insertReview.run(uuidv4(), userIds[4], venueIds[4].id, 4, 'Love the variety of samsa! The green tea is also excellent.');
    insertReview.run(uuidv4(), userIds[0], venueIds[2].id, 5, 'Went for my anniversary dinner. The private room was perfect.');
    insertReview.run(uuidv4(), userIds[2], venueIds[0].id, 4, 'Authentic taste, good portions. Can get crowded during lunch.');
    insertReview.run(uuidv4(), userIds[1], venueIds[5].id, 5, 'Great stadium experience! Excellent facilities.');
    insertReview.run(uuidv4(), userIds[3], venueIds[7].id, 5, 'FitLife is the best gym in Tashkent. Clean, well-maintained.');
    insertReview.run(uuidv4(), userIds[4], venueIds[10].id, 5, 'Sultan Barbershop provides a true gentleman\'s experience.');
    console.log('Created sample reviews');

    // Loyalty transactions
    const insertLoyalty = db.prepare(
      `INSERT INTO loyalty_transactions (id, user_id, points, transaction_type, description) VALUES (?, ?, ?, ?, ?)`
    );

    insertLoyalty.run(uuidv4(), userIds[0], 500, 'earned', 'Welcome bonus');
    insertLoyalty.run(uuidv4(), userIds[0], 45, 'earned', 'Booking at Plov Center');
    insertLoyalty.run(uuidv4(), userIds[0], 100, 'bonus', 'Premium subscriber monthly bonus');
    insertLoyalty.run(uuidv4(), userIds[1], 500, 'earned', 'Welcome bonus');
    insertLoyalty.run(uuidv4(), userIds[1], 72, 'earned', 'Booking at Afsona Restaurant');
    insertLoyalty.run(uuidv4(), userIds[2], 500, 'earned', 'Welcome bonus');
    insertLoyalty.run(uuidv4(), userIds[2], 200, 'bonus', 'VIP subscriber monthly bonus');
    insertLoyalty.run(uuidv4(), userIds[3], 350, 'earned', 'Welcome bonus');
    insertLoyalty.run(uuidv4(), userIds[4], 500, 'earned', 'Welcome bonus');
    console.log('Created loyalty transactions');
  });

  transaction();
  console.log('\nSeed data created successfully!');
  console.log('\nDemo Credentials:');
  console.log('  Email: demo@smartbooking.uz');
  console.log('  Password: demo123456');
}

try {
  seed();
} catch (err) {
  console.error('Seed error:', err);
  process.exit(1);
} finally {
  db.close();
}
