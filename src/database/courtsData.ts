// src/database/courtsData.ts
// Seed data for the courts table. Edit this file to add or fix venues.
// After editing, bump the database name in db.ts (courtbooking_v4 -> v5)
// so the app re-seeds on the next launch.

export type CourtSeed = {
  name: string;
  sport_type: string;
  location: string;
  description: string;
  price_from: number | null; // starting price in PHP, null = not listed
  price_unit: "hour" | "person";
  price_note: string | null;
  booking_url: string | null; // Facebook page, booking site, or sheet
};

// [name, sport, location, description, price, url, note?, unit?]
// price: number = starting price, [low, high] = range, null = not listed
type Row = [
  string,
  string,
  string,
  string,
  number | [number, number] | null,
  string | null,
  string?,
  ("hour" | "person")?
];

const PH = (slug: string) => `https://picklehub.ph/${slug}`;
const FB = (id: string) => `https://www.facebook.com/profile.php?id=${id}`;

const rows: Row[] = [
  // ---------------- PICKLEBALL ----------------
  ["3M's Pickle", "Pickleball", "Visayan Village", "1 court · Indoor", [210, 260], "https://3mspickle.dinkhubs.com/"],
  ["929 Pickleyard", "Pickleball", "Purok 3A, Dagohoy, Canocotan", "5 courts · Indoor", [115, 315], PH("929-pickleyard?tab=home")],
  ["AP Grounds", "Pickleball", "Harbco Purok 4, Gumamela Drive, Apokon", "2 courts · Indoor", 315, PH("ap-grounds?tab=home")],
  ["Big J Paddlegrounds (Apokon)", "Pickleball", "SJ Building, Apokon Road", "2 courts · Indoor", 315, PH("big-j-paddle-grounds-apokon?tab=book")],
  ["Big J Paddlegrounds (Mankilam)", "Pickleball", "BN Space Rental Bldg, Purok Caimito, Mankilam", "5 courts · Indoor and outdoor", 315, PH("big-j-paddlegrounds-mankilam?tab=book")],
  ["Casa Dink", "Pickleball", "Purok 3-A, Canocotan", "1 court · Outdoor", null, null],
  ["CHINO Pickleball Courts", "Pickleball", "Purok Bautista, Mankilam", "4 courts · Outdoor", [265, 315], FB("61594193192095")],
  ["City Pickle Grounds", "Pickleball", "JV Ayala Avenue, Purok 1B", "6 courts · Indoor", [265, 365], PH("city-pickle-grounds?tab=book")],
  ["Court Uno - Pickleball Club", "Pickleball", "Back of Pan Corner, Purok 6, Campo 4, San Miguel", "Indoor", 190, "https://courtunopickleballclubtagum.dinkhubs.com/"],
  ["CW Pickleball", "Pickleball", "Purok 6, San Miguel, Camp 4", "1 court · Indoor", [200, 300], FB("61594041310092")],
  ["Dink Avenue", "Pickleball", "Purok Bayabas, Baysa, Visayan Village", "2 courts · Indoor", [265, 315], "https://www.facebook.com/Dinkavenuetagum"],
  ["Dinker's Hide", "Pickleball", "Purok Pag-asa", "1 court · Outdoor", null, "https://dinkers-hide.web.app/book"],
  ["Eloisa's Events Pickleball", "Pickleball", "Purok Pag-asa", "2 courts · Indoor", 175, "https://book.insta-courts.com/eloisapickleball"],
  ["Ground Zero Pickleball Tagum", "Pickleball", "4th Ave., Misa District, Magugpo South", "1 court · Indoor", [225, 300], "https://groundzerotagum.dulaco.net/"],
  ["Happy Paddle", "Pickleball", "Durian West, San Miguel", "1 court · Outdoor", [200, 300], FB("61590407214149")],
  ["Hideaway Pickleball Club", "Pickleball", "Purok Talisay II, Visayan Village", "2 courts · Indoor", [215, 265], PH("hideaway-pickleball-hub?tab=book")],
  ["Hideout Tagum", "Pickleball", "Purok Abaca, Mankilam", "4 courts · Indoor", [150, 200], "https://picklepro.club/facilities/hideout"],
  ["House of Dinks Pickleball", "Pickleball", "Purok Margarette, Visayan Village", "1 court · Outdoor", 200, FB("61592048884184")],
  ["JD Pickle Hub", "Pickleball", "Capitol Rd, Magugpo West (beside Oro Fuel)", "2 courts · Indoor", [180, 250], "https://jd-pickle-hub.vercel.app/book"],
  ["Josie's Pickleball Haus", "Pickleball", "Domingo Village", "1 court · Indoor", [200, 300], FB("61593104931757")],
  ["LYR Pickleball Club", "Pickleball", "LYR (A.I.R.) Agro Inland Resort", "5 courts · Outdoor", 300, FB("61570191183759")],
  ["M Central Pickleball Club", "Pickleball", "M Central, Dalisay Gante Road", "4 courts · Indoor", [208, 300], PH("m-central-pickleball-club?tab=book")],
  ["myPickle Yard", "Pickleball", "Timog, Madaum", "1 court · Outdoor", [120, 200], "https://mypickleyard.dinkhubs.com/"],
  ["MZ Racquet Zone", "Pickleball", "Rabe Compound", "1 court · Indoor", null, FB("100054434082010")],
  ["Net N' Paddle", "Pickleball", "1485 Mirafuentes Street, Suaybaguio District", "3 courts · Outdoor", [200, 250], FB("61590451320145")],
  ["Nico-Shann Pickleball Hub", "Pickleball", "FQ8X+8JF", "1 court · Indoor", [200, 250], FB("61593878233024")],
  ["Paddle Arena", "Pickleball", "Purok Cogon, Visayan Village", "4 courts · Indoor", [315, 365], PH("paddle-arena?tab=home")],
  // CHECK: same address and link as Paddle Arena in the source list, link left empty
  ["Paddle Hideout", "Pickleball", "Purok Cogon, Visayan Village", "4 courts · Indoor", [315, 365], null],
  ["Paddle Hour", "Pickleball", "Daang Maharlika Highway, behind TireSmart", "6 courts · Indoor", [265, 365], PH("paddle-hour?tab=book")],
  ["Paddle Point (GMALL)", "Pickleball", "National Highway, Briz District, Magugpo East", "3 courts · Indoor", [365, 415], PH("paddle-point-gmall-tagum?tab=home")],
  ["Paddle Point Tagum", "Pickleball", "Door 6 Limcore Warehouse, Mabini St", "5 courts · Indoor", [250, 300], PH("paddle-point-tagum?tab=book")],
  ["Paddle Spot - Pickleball Hub", "Pickleball", "Purok 5A, Canocotan, behind Hazza's Crabbylicious", "2 courts · Indoor", [150, 200], "https://002.fairplaypickleball.app/courts/paddle-spot"],
  ["Paddle Yard Tagum", "Pickleball", "Purok A, Suaybaguio District, Magugpo North", "2 courts · Outdoor", [200, 250], "https://paddleyardtagum.com/"],
  ["Pickle Ball Corner", "Pickleball", "P-3 La Filipina", "2 courts · Indoor", [250, 300], "https://pickleballcorner.playpicklebuddy.com/?book=true"],
  ["Pickle Forest", "Pickleball", "Purok Timog, Visayan Village", "5 courts · Indoor", [250, 300], "https://pickleforest.com/"],
  ["Pickle Village", "Pickleball", "Purok Bunga, Visayan Village", "6 courts · Indoor", [265, 365], "https://www.facebook.com/picklevillagetagum"],
  ["Pickleballers Space", "Pickleball", "Jalandoni Road, Purok Macopa, Visayan Village", "1 court · Indoor", [200, 250], "https://pickleballers.space/"],
  ["PickleCity Tagum", "Pickleball", "Purok Galingan", "3 courts · Indoor", [200, 300], "https://picklecitytagum.com/"],
  ["Picklezone Tagum", "Pickleball", "Purok Dela Cruz, Mankilam", "5 courts · Indoor", [250, 300], PH("picklezone-tagum?tab=book")],
  ["Pikol sa Paayo", "Pickleball", "National Highway, Purok Lansonez, Visayan Village", "2 courts · Outdoor", [215, 265], "https://www.facebook.com/paayocafetgm"],
  ["Play 77 Dink and Dine Hub", "Pickleball", "Mirafuentes Street", "2 courts · Indoor", [165, 265], PH("play-77-sports-court?tab=book")],
  ["PMAX", "Pickleball", "Tan Building, Gazmen Road, Purok Bayanihan, Magugpo West", "6 courts · Indoor", [265, 315], PH("pmax?tab=book")],
  ["RPG Pickleball Grounds", "Pickleball", "Purok 1B, Apokon", "2 courts · Outdoor", null, FB("61593121611197")],
  ["Sam's Pickleball Court", "Pickleball", "Purok Tandang Sora 2-A, Canocotan", "3 courts · Indoor", [245, 290], PH("sam-s-pickleball-court?tab=home")],
  ["SmashZone Pickleball Tagum", "Pickleball", "Purok Malinawon, La Filipina", "2 courts · Indoor", [160, 290], "https://smashzone.dinkhubs.com/"],
  ["Spin & Smash", "Pickleball", "Rufina's Leisure Center, Visayan Village", "3 courts · Indoor", 365, "https://app.sports360.ph/sportshub/spin-smash-pickleball-pavillion"],
  ["Sports Cave Tagum", "Pickleball", "Osmeña Ext., Magugpo West", "3 courts · Indoor", 250, "https://book.duladula.app/venue/sports-cave"],
  ["TFBC Pickleball Court", "Pickleball", "Purok 2, San Miguel", "3 courts · Indoor · Booking sheet", null, "https://docs.google.com/spreadsheets/d/11lrRa4BK9ACn9tNMwYaREgsCb1HKGD_DDkEyyNY0AHQ/edit?gid=900971734#gid=900971734"],
  ["The Classic Court", "Pickleball", "Purok 3D, Domingo Compound, Banana St., San Miguel", "2 courts · Outdoor", [100, 200], FB("61593433319205")],
  ["The LOB", "Pickleball", "1099 Purok Talisay, Magugpo West", "4 courts · Indoor", [265, 315], PH("the-lob?tab=home")],
  ["The Palm Court", "Pickleball", "Purok Caimito, Mankilam", "4 courts · Indoor", [300, 325], "https://app.sports360.ph/sportshub/the-palm-court"],
  ["The Pinkle Zone", "Pickleball", "Mankilam", "3 courts · Indoor", [215, 315], PH("the-pinkle-zone?tab=home")],
  ["The Rally Point", "Pickleball", "FQ5M+9Q", "4 courts · Outdoor", [215, 265], PH("the-rally-point?tab=home")],
  ["The South Court", "Pickleball", "Magugpo South", "2 courts · Outdoor", 100, "https://thesouthcourt.com/", "Starts at ₱100/hr"],
  ["USEP Balay PickleYard", "Pickleball", "USeP Balay Alumni, Apokon", "2 courts · Outdoor", [150, 200], FB("61587136798172")],
  ["Williams Pickle Hub", "Pickleball", "Pioneer Avenue, Mankilam", "2 courts · Indoor", [365, 415], PH("williams-tagum?tab=home")],

  // ---------------- BASKETBALL ----------------
  ["Sports Cave Tagum", "Basketball", "Osmeña Extension, Magugpo West", "1 full court · Indoor", 280, "https://book.duladula.app/venue/sports-cave", "Price shown when picking a slot in the booking app"],
  ["Big 8 Corporate Hotel Multi-purpose Gym", "Basketball", "National Highway, Visayan Village", "1 court · Indoor, FIBA-standard gear", null, "https://www.facebook.com/p/Big-8-Corporate-Hotel-Multi-purpose-Gym-61563802500778/"],
  ["Davao del Norte Gymnasium (RDR Gym)", "Basketball", "Capitol Road", "1 main court · Indoor, air-conditioned, wooden floor · Inquire at the Provincial Sports Division Office", null, null],
  ["Skydeck Basketball Court at Robinsons Place Tagum", "Basketball", "Level 4 Skydeck, Robinsons Place Tagum, National Highway", "1 half-court · Outdoor rooftop deck · Or visit the Admin Office, Level 4", 250, "tel:0842188520"],
  ["Villa Cacacho Basketball Court", "Basketball", "Villa Cacacho", "1 court · Covered outdoor", null, null],
  ["Rotary Gym", "Basketball", "Poblacion", "1 court · Indoor gymnasium", null, "https://www.facebook.com/TCYSDOfficial"],
  ["Barangay Mankilam Multi-Purpose Gym", "Basketball", "Capitol Road, Mankilam", "1 court · Covered indoor/outdoor", null, FB("61553998101858"), "Barangay council standard rates apply"],
  ["Apokon Covered Court", "Basketball", "Apokon", "1 court · Covered outdoor", null, null],
  ["Dara Village Gym", "Basketball", "Dara Village, Visayan Village", "1 covered court · Indoor gym with stage and bleachers", null, FB("61585758017152")],
  ["Lynville Covered Court", "Basketball", "Lynville Subdivision", "1 court · Covered outdoor", null, null],

  // ---------------- BADMINTON ----------------
  ["JB Smashville and Fitness Center", "Badminton", "Osmeña Street", "Multiple indoor courts with fitness facilities", 200, "https://www.facebook.com/p/JB-Smashville-and-Fitness-Center-100071642150100/"],
  ["MZ Racquet Zone", "Badminton", "Rabe Compound, Everlasting, Visayan Village", "Multiple indoor courts", 180, "https://www.facebook.com/p/MZ-Racquet-Zone-100054434082010/"],
  ["Play 77 Sports Venue", "Badminton", "Mirafuentes Street", "Indoor courts for casual play and training", 250, "https://www.facebook.com/Play77Tagum/"],
  ["The Playground Badminton Court Tagum", "Badminton", "CRQ3+MJ9", "Indoor courts", null, FB("61580319818354")],

  // ---------------- TENNIS ----------------
  ["Tagum City Lawn Tennis Club", "Tennis", "153 Pioneer Ave", "Multiple outdoor hard courts", 100, null],
  ["EPark Lawn Tennis Courts", "Tennis", "Energy Park, Apokon", "Outdoor courts", 0, null, "Free in the daytime; ₱100/hr at night (lighting fee)"],
  ["DNSTC Lawn Tennis Facility", "Tennis", "Mankilam", "2 outdoor hard courts with bleachers", 100, null],

  // ---------------- VOLLEYBALL ----------------
  ["Tagum Beach Volleyball Court", "Volleyball", "Quezon St", "Outdoor sand court", 150, null],
  ["DNSTC Indoor Volleyball Courts", "Volleyball", "Mankilam", "Indoor courts inside the RDR gym hall", 300, null],
  ["Rotary Park Volleyball Court", "Volleyball", "Rotary Park", "Covered outdoor court", 150, null],

  // ---------------- FOOTBALL ----------------
  ["Tagum City Artificial Football Turf (PFF-AFF Center)", "Football", "Tagum City", "1 artificial turf pitch · Outdoor", 800, null],
  ["DNSTC Grandstand Football Pitch 1", "Football", "Mankilam", "Regulation natural grass pitch · Outdoor", 500, null],
  ["DNSTC Football Pitch 2", "Football", "Mankilam", "Natural grass training field · Outdoor", 400, null],

  // ---------------- FUTSAL ----------------
  ["Suaybaguio-Rina Indoor Arena", "Futsal", "Suaybaguio-Rina", "1 indoor concrete court", 250, null],
  ["Barangay Mankilam Multi-Purpose Gym", "Futsal", "Capitol Road, Mankilam", "1 covered court", 150, null],
  ["Villa Cacacho Covered Arena", "Futsal", "Villa Cacacho", "1 covered outdoor court", 150, null],

  // ---------------- SWIMMING ----------------
  ["Davao del Norte Aquatic Center", "Swimming", "Capitol Circumferential Rd", "50m 10-lane pool plus 12m warm-up pool · Outdoor", 30, null, "Walk-in rate per person; ₱1,500/hr for full lane rental", "person"],
  ["Rufina's Leisure Center Pools", "Swimming", "Purok Cacao, National Highway", "Multiple outdoor pools", 100, "https://www.facebook.com/lakans.place", "Day pool access per person", "person"],
  ["The Palm Court Pool Space", "Swimming", "Dela Cruz Rd, Purok Carig II, Mankilam", "Outdoor pool courtyard", 120, null, undefined, "person"],

  // ---------------- TABLE TENNIS ----------------
  ["Robinsons Place Tagum Activity Decks", "Table Tennis", "National Highway, Visayan Village", "Indoor air-conditioned space", 0, "https://www.facebook.com/RobinsonsTagum", "Free public exhibition play; event floor fees apply"],
  ["Gaisano Mall of Tagum Recreation Hub", "Table Tennis", "National Highway, Briz District", "Indoor air-conditioned space", 0, "https://www.facebook.com/gaisano.mall.tagum", "Free; subject to mall management"],
  ["NCCC Mall Tagum Event Enclosure", "Table Tennis", "National Highway, Magugpo East", "Indoor air-conditioned space", 0, "https://www.facebook.com/NCCCMallTagum", "Free for mall tournament participants"],

  // ---------------- ATHLETICS ----------------
  ["DNSTC Athletics Oval", "Athletics", "Capitol Circumferential Rd, Mankilam", "8-lane rubberized oval · Outdoor", 0, null, "Free for public joggers; ₱1,000/hr for exclusive event block-outs"],
  ["UM Track Grounds", "Athletics", "UM Campus, Mankilam", "Natural dirt/grass track · Outdoor", 150, null],
  ["Energy Park Running & Exercise Tracks", "Athletics", "Energy Park, Apokon", "Paved outdoor loop", 0, null, "Free public access"],

  // ---------------- MARTIAL ARTS & COMBAT ----------------
  ["Rotary Multipurpose Gym", "Martial Arts", "Poblacion", "Arnis, martial arts · 1 indoor multipurpose floor", 150, null],
  ["Freedom Park Sports Zone", "Martial Arts", "Freedom Park, Downtown", "Arnis, combative sports · Outdoor", 0, null, "Free public open space"],
  ["Energy Park Central Pavilion", "Martial Arts", "Energy Park, Apokon", "Arnis · Covered open-air pavilion", 50, null],
  ["RDR Gym Combative Boxing Hub", "Martial Arts", "Rodolfo P. Del Rosario Gym Grounds, Mankilam", "Boxing · Indoor ringside space", 100, null],
  ["Tagum Trade Center Boxing Ring Arena", "Martial Arts", "Trade Center Pavilions", "Boxing · Covered indoor ring", 150, null],
  ["Freedom Park Combat Area", "Martial Arts", "Freedom Park", "Boxing · Covered outdoor training area", 0, null, "Free public training area"],
  ["Sports Cave Tagum (VIP Mat Spaces)", "Martial Arts", "Heroben Compound, Osmeña Extension, Magugpo West", "Brazilian Jiu-Jitsu, grappling · Indoor air-conditioned", 300, "https://www.facebook.com/p/Sports-Cave-Tagum-100064303230773/"],
  ["RDR Gymnasium Combat Mats Sector", "Martial Arts", "Capitol Road, Mankilam", "BJJ, grappling · Indoor mat rooms", 150, null],
  ["Rotary Gym Combat Zone", "Martial Arts", "Poblacion", "BJJ, combative arts · Indoor hall", 100, null],
  ["Energy Park Gymnasium Pavilions", "Martial Arts", "Energy Park, Apokon", "Karatedo, martial arts · Covered open-air pavilion", 50, null],
  ["Rotary Park Karatedo Spot", "Martial Arts", "Rotary Park", "Karatedo · Open-air practice space", 0, null, "Free public practice space"],
  ["RDR Gymnasium Multi-Purpose Room B", "Martial Arts", "Capitol Road, Mankilam", "Karatedo mat training · Indoor", 100, null],
  ["MZ Racquet Zone Combat Spaces", "Martial Arts", "Rabe Compound, Visayan Village", "Muay Thai, striking · Indoor", 200, null],
  ["Sports Cave Tagum Workout Hub", "Martial Arts", "Heroben Compound, Osmeña Extension, Magugpo West", "Muay Thai conditioning · Indoor", 250, null],
  ["Freedom Park Training Hub", "Martial Arts", "Freedom Park", "Muay Thai · Covered outdoor", 0, null, "Free community weekend classes"],
  ["Riverside Covered Training Court", "Martial Arts", "Riverside", "Taekwondo · 1 large covered outdoor space", 100, null],
  ["Rodolfo P. Del Rosario Gymnasium Arena", "Martial Arts", "Capitol Road, Mankilam", "Taekwondo · Indoor air-conditioned arena", 500, null],
  ["Freedom Park Taekwondo Zone", "Martial Arts", "Freedom Park, Downtown", "Taekwondo · Covered outdoor", 0, null, "Free public grassroots program"],
  ["RDR Gymnasium Multi-Purpose Rooms", "Martial Arts", "Capitol Road, Mankilam", "Wrestling · Indoor rooms with safety mats", 100, null],
  ["Trade Center Pavilion Section W", "Martial Arts", "Trade Center", "Wrestling, grappling · Covered indoor pavilion", 150, null],
  ["Energy Park Covered Pavilion Section B", "Martial Arts", "Energy Park, Apokon", "Wrestling, conditioning · Covered open-air pavilion", 50, null],

  // ---------------- SEPAK TAKRAW ----------------
  ["Barangay Mankilam Multi-Purpose Gym", "Sepak Takraw", "Capitol Road, Mankilam", "1 covered court", 150, null],
  ["Apokon Covered Court", "Sepak Takraw", "Apokon", "1 court · Covered outdoor", 100, null],
  ["Dara Village Gym Court", "Sepak Takraw", "Dara Village, Visayan Village", "1 covered court", 150, FB("61585758017152")],

  // ---------------- ARCHERY ----------------
  ["DNSTC Archery Range Zone", "Archery", "Davao del Norte Sports and Tourism Complex, Mankilam", "Outdoor archery range", 150, null],
  ["UM Tagum Campus Sports Grounds", "Archery", "National Highway, Mabini", "Outdoor multi-purpose campus field", 200, null],

  // ---------------- GYMNASTICS & DANCE ----------------
  ["Rodolfo P. Del Rosario Gymnasium (Main Arena Floor)", "Gymnastics & Dance", "Sports Complex Grounds, Mankilam", "Gymnastics · Indoor air-conditioned", 500, null],
  ["Freedom Park Gymnastics Area", "Gymnastics & Dance", "Freedom Park", "Gymnastics floor training · Covered outdoor", 0, null, "Free public open space"],
  ["Rotary Gym Floor Zone", "Gymnastics & Dance", "Poblacion", "Gymnastics conditioning · Indoor", 150, null],
  ["Big 8 Corporate Hotel Ballroom Arena", "Gymnastics & Dance", "National Highway, Visayan Village", "Dancesport · Indoor wooden floor, air-conditioned", 1500, null],
  ["Rodolfo P. Del Rosario Gymnasium Main Floor", "Gymnastics & Dance", "Capitol Road, Mankilam", "Dancesport · Indoor stadium floor", 500, null, "₱500/hr non-aircon; ₱1,500/hr aircon"],
  ["Tagum City New Sports Center Stage Zone", "Gymnastics & Dance", "New Sports Center", "Dancesport · Indoor staging floor", 250, null],

  // ---------------- CHESS ----------------
  ["NCCC Mall Tagum Activity Hub", "Chess", "National Highway, Magugpo East", "Indoor air-conditioned space", 0, null, "Free public open play; commercial event rates apply"],
  ["Robinsons Place Tagum Indoor Commons", "Chess", "National Highway, Visayan Village", "Indoor tournament-ready space", 0, "https://www.facebook.com/RobinsonsTagum/", "Free community meets; event booking fees apply"],
  ["Rotary Park Open Chess Benches", "Chess", "Rotary Park", "Casual chess, board games · Outdoor tables", 0, null, "Free public benches"],
];

export const COURTS_SEED: CourtSeed[] = rows.map(
  ([name, sport_type, location, description, price, url, note, unit]) => {
    const isRange = Array.isArray(price);
    return {
      name,
      sport_type,
      location,
      description,
      price_from: isRange ? price[0] : price,
      price_unit: unit ?? "hour",
      price_note: note ?? (isRange ? `Range: ₱${price[0]}–${price[1]}/hr` : null),
      booking_url: url,
    };
  }
);