import { eq } from "drizzle-orm";
import { db } from "./db";
import { events, campusLocations, eventTags, users } from "./schema";

const LOCATIONS = [
  // Central campus
  {
    id: "nassau-hall",
    name: "Nassau Hall",
    latitude: 40.3487,
    longitude: -74.6593,
    category: "administrative" as const,
  },
  {
    id: "frist-campus-center",
    name: "Frist Campus Center",
    latitude: 40.3465,
    longitude: -74.6553,
    category: "social" as const,
  },
  {
    id: "chancellor-green",
    name: "Chancellor Green",
    latitude: 40.3491,
    longitude: -74.6586,
    category: "library" as const,
  },
  {
    id: "whig-hall",
    name: "Whig Hall",
    latitude: 40.3482,
    longitude: -74.6579,
    category: "social" as const,
  },
  {
    id: "clio-hall",
    name: "Clio Hall",
    latitude: 40.3485,
    longitude: -74.6582,
    category: "social" as const,
  },
  {
    id: "mccosh-hall",
    name: "McCosh Hall",
    latitude: 40.348,
    longitude: -74.6568,
    category: "academic" as const,
  },
  {
    id: "alexander-hall",
    name: "Alexander Hall",
    latitude: 40.3478,
    longitude: -74.6591,
    category: "academic" as const,
  },
  {
    id: "richardson-auditorium",
    name: "Richardson Auditorium",
    latitude: 40.3477,
    longitude: -74.6589,
    category: "academic" as const,
  },
  {
    id: "robertson-hall",
    name: "Robertson Hall",
    latitude: 40.3468,
    longitude: -74.657,
    category: "academic" as const,
  },
  {
    id: "prospect-house",
    name: "Prospect House",
    latitude: 40.3473,
    longitude: -74.6555,
    category: "social" as const,
  },

  // East campus
  {
    id: "friend-center",
    name: "Friend Center",
    latitude: 40.3503,
    longitude: -74.6522,
    category: "academic" as const,
  },
  {
    id: "computer-science",
    name: "Computer Science Building",
    latitude: 40.3502,
    longitude: -74.6518,
    category: "academic" as const,
  },
  {
    id: "engineering-quad",
    name: "Engineering Quadrangle",
    latitude: 40.3505,
    longitude: -74.6514,
    category: "academic" as const,
  },
  {
    id: "bloomberg-hall",
    name: "Bloomberg Hall",
    latitude: 40.3509,
    longitude: -74.6508,
    category: "residential" as const,
  },

  // West campus
  {
    id: "wu-hall",
    name: "Wu Hall",
    latitude: 40.3448,
    longitude: -74.6612,
    category: "residential" as const,
  },
  {
    id: "forbes-college",
    name: "Forbes College",
    latitude: 40.3438,
    longitude: -74.6635,
    category: "residential" as const,
  },

  // South campus / Athletic
  {
    id: "jadwin-gymnasium",
    name: "Jadwin Gymnasium",
    latitude: 40.3445,
    longitude: -74.653,
    category: "athletic" as const,
  },
  {
    id: "princeton-stadium",
    name: "Princeton Stadium",
    latitude: 40.3433,
    longitude: -74.6506,
    category: "athletic" as const,
  },
  {
    id: "dillon-gymnasium",
    name: "Dillon Gymnasium",
    latitude: 40.346,
    longitude: -74.6545,
    category: "athletic" as const,
  },

  // Libraries
  {
    id: "firestone-library",
    name: "Firestone Library",
    latitude: 40.3493,
    longitude: -74.6579,
    category: "library" as const,
  },
  {
    id: "lewis-library",
    name: "Lewis Library",
    latitude: 40.3462,
    longitude: -74.6535,
    category: "library" as const,
  },
  {
    id: "mudd-library",
    name: "Mudd Manuscript Library",
    latitude: 40.347,
    longitude: -74.6549,
    category: "library" as const,
  },

  // North campus
  {
    id: "graduate-college",
    name: "Graduate College",
    latitude: 40.3418,
    longitude: -74.666,
    category: "residential" as const,
  },
  {
    id: "lawrence-apartments",
    name: "Lawrence Apartments",
    latitude: 40.353,
    longitude: -74.651,
    category: "residential" as const,
  },

  // Dining
  {
    id: "rocky-mathey",
    name: "Rocky/Mathey Dining Hall",
    latitude: 40.351,
    longitude: -74.66,
    category: "dining" as const,
  },
  {
    id: "whitman-dining",
    name: "Whitman Dining Hall",
    latitude: 40.3455,
    longitude: -74.66,
    category: "dining" as const,
  },
  {
    id: "butler-dining",
    name: "Butler Dining Hall",
    latitude: 40.344,
    longitude: -74.652,
    category: "dining" as const,
  },

  // Other
  {
    id: "woolworth-center",
    name: "Woolworth Center of Musical Studies",
    latitude: 40.3475,
    longitude: -74.6543,
    category: "academic" as const,
  },
  {
    id: "mccarter-theatre",
    name: "McCarter Theatre",
    latitude: 40.3442,
    longitude: -74.6572,
    category: "social" as const,
  },
  {
    id: "terrace-club",
    name: "Terrace Club",
    latitude: 40.3468,
    longitude: -74.6546,
    category: "social" as const,
  },
] as const;

async function seed() {
  console.log("Seeding campus locations...");

  for (const location of LOCATIONS) {
    await db
      .insert(campusLocations)
      .values(location)
      .onConflictDoNothing({ target: campusLocations.id });
  }

  console.log(`Seeded ${LOCATIONS.length} campus locations.`);

  // ── Sample Events ─────────────────────────────────────
  // Use the first user in the DB as the creator (the one who signed in)
  const [firstUser] = await db.select().from(users).limit(1);
  if (!firstUser) {
    console.log("No users found — skipping event seeding. Sign in first, then re-run.");
    process.exit(0);
  }

  const creatorId = firstUser.id;
  console.log(`Seeding sample events for user "${firstUser.displayName}"...`);

  const now = new Date();
  const day = (offset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return d;
  };
  const at = (offset: number, hour: number, minute = 0) => {
    const d = day(offset);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const SAMPLE_EVENTS: {
    title: string;
    description: string;
    datetime: Date;
    endDatetime: Date | null;
    locationId: string;
    tags: (
      | "free-food"
      | "workshop"
      | "performance"
      | "speaker"
      | "social"
      | "career"
      | "sports"
      | "music"
      | "art"
      | "academic"
      | "cultural"
      | "community-service"
      | "religious"
      | "political"
      | "tech"
      | "gaming"
      | "outdoor"
      | "wellness"
    )[];
  }[] = [
    {
      title: "Intro to Taiko Drumming",
      description:
        "Want to learn taiko — the art of Japanese drumming? Come to our beginner workshop! No musical experience required. We'll provide all the drums and sticks. Just bring your energy and enthusiasm!",
      datetime: at(1, 19, 0),
      endDatetime: at(1, 21, 0),
      locationId: "woolworth-center",
      tags: ["cultural", "music", "workshop"],
    },
    {
      title: "CS Club: Intro to Rust",
      description:
        "Learn the basics of Rust programming — ownership, borrowing, and why systems programmers love it. Bring your laptop with Rust installed (rustup.rs). Beginners welcome!",
      datetime: at(2, 16, 30),
      endDatetime: at(2, 18, 0),
      locationId: "friend-center",
      tags: ["tech", "academic", "workshop"],
    },
    {
      title: "Free Pizza & Board Games Night",
      description:
        "Take a study break! Drop by for free pizza, snacks, and board games. We've got Catan, Codenames, Ticket to Ride, and more. Come solo or bring friends.",
      datetime: at(1, 20, 0),
      endDatetime: at(1, 23, 0),
      locationId: "frist-campus-center",
      tags: ["free-food", "social", "gaming"],
    },
    {
      title: "Princeton Women in STEM Panel",
      description:
        "Hear from four Princeton alumnae working in tech, biotech, and finance. They'll share career advice, answer questions, and stick around for networking after. Light refreshments provided.",
      datetime: at(3, 17, 0),
      endDatetime: at(3, 19, 0),
      locationId: "robertson-hall",
      tags: ["career", "speaker", "academic"],
    },
    {
      title: "Spring Intramural Soccer Kickoff",
      description:
        "The spring intramural soccer season starts this weekend! Come to the kickoff match and sign up for a team. All skill levels welcome. Cleats recommended but not required.",
      datetime: at(4, 14, 0),
      endDatetime: at(4, 16, 0),
      locationId: "princeton-stadium",
      tags: ["sports", "social", "outdoor"],
    },
    {
      title: "Open Mic Night at Terrace",
      description:
        "Sing, rap, play an instrument, do stand-up, read poetry — whatever you want. Sign up at the door or just come to watch. Snacks and drinks provided.",
      datetime: at(2, 21, 0),
      endDatetime: at(2, 23, 30),
      locationId: "terrace-club",
      tags: ["performance", "music", "social"],
    },
    {
      title: "Meditation & Mindfulness Workshop",
      description:
        "A guided meditation session followed by a discussion on incorporating mindfulness into your daily routine. Perfect for beginners. Mats and cushions provided.",
      datetime: at(5, 8, 0),
      endDatetime: at(5, 9, 30),
      locationId: "prospect-house",
      tags: ["wellness"],
    },
    {
      title: "Hackathon Info Session",
      description:
        "HackPrinceton is coming up! Learn about this year's theme, prizes, sponsors, and how to register. Form teams on the spot or come with your crew.",
      datetime: at(3, 19, 30),
      endDatetime: at(3, 20, 30),
      locationId: "computer-science",
      tags: ["tech", "career", "academic"],
    },
    {
      title: "Art Studio Open House",
      description:
        "The Visual Arts program is opening its studios to the public. See student work in progress, try your hand at printmaking, and enjoy free coffee.",
      datetime: at(6, 13, 0),
      endDatetime: at(6, 16, 0),
      locationId: "lewis-library",
      tags: ["art", "free-food", "cultural"],
    },
    {
      title: "Outdoor Yoga on the Lawn",
      description:
        "Join us for a relaxing outdoor yoga session on the main lawn. All levels welcome. Bring a mat or towel. In case of rain, we'll move to Dillon Gym.",
      datetime: at(7, 10, 0),
      endDatetime: at(7, 11, 0),
      locationId: "nassau-hall",
      tags: ["wellness", "outdoor", "social"],
    },
    {
      title: "Documentary Screening: Coded Bias",
      description:
        "Screening of 'Coded Bias' followed by a panel discussion on AI ethics, algorithmic fairness, and what technologists can do about it. Free popcorn!",
      datetime: at(4, 19, 0),
      endDatetime: at(4, 21, 30),
      locationId: "mccarter-theatre",
      tags: ["tech", "academic", "speaker", "free-food"],
    },
    {
      title: "Volunteer: Campus Garden Cleanup",
      description:
        "Help us get the community garden ready for spring planting. Gloves and tools provided. Meet at the garden behind Forbes College. All welcome!",
      datetime: at(8, 9, 0),
      endDatetime: at(8, 12, 0),
      locationId: "forbes-college",
      tags: ["community-service", "outdoor"],
    },
    {
      title: "Mock Interview Prep with Goldman Sachs",
      description:
        "Practice behavioral and technical interviews with Goldman Sachs recruiters. Bring your resume. Business casual recommended. Slots fill up fast — RSVP now.",
      datetime: at(5, 15, 0),
      endDatetime: at(5, 18, 0),
      locationId: "robertson-hall",
      tags: ["career"],
    },
    {
      title: "A Cappella Jam",
      description:
        "Princeton's a cappella groups perform back-to-back in a friendly showcase. Come hear the Nassoons, Tigerlilies, Footnotes, and more!",
      datetime: at(6, 20, 0),
      endDatetime: at(6, 22, 0),
      locationId: "richardson-auditorium",
      tags: ["music", "performance", "social"],
    },
    {
      title: "Debate Watch Party",
      description:
        "Watch the presidential debate live on the big screen with fellow students. Snacks provided. Moderated discussion afterwards.",
      datetime: at(9, 20, 0),
      endDatetime: at(9, 22, 30),
      locationId: "whig-hall",
      tags: ["political", "social", "free-food"],
    },
  ];

  for (const evt of SAMPLE_EVENTS) {
    // Check if event with same title already exists
    const [existing] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.title, evt.title))
      .limit(1);

    if (existing) continue;

    const [inserted] = await db
      .insert(events)
      .values({
        title: evt.title,
        description: evt.description,
        datetime: evt.datetime,
        endDatetime: evt.endDatetime,
        locationId: evt.locationId,
        creatorId: creatorId,
        isPublic: true,
      })
      .returning({ id: events.id });

    if (inserted && evt.tags.length > 0) {
      await db.insert(eventTags).values(
        evt.tags.map((tag) => ({
          eventId: inserted.id,
          tag,
        })),
      );
    }
  }

  console.log(`Seeded ${SAMPLE_EVENTS.length} sample events.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
