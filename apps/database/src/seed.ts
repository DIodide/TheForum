/**
 * Seed script — populates the database with realistic Princeton demo data.
 *
 * Run: bun run db:seed   (from apps/database)
 */

import { db } from "./db";
import {
  events,
  campusLocations,
  eventTags,
  friendships,
  orgFollowers,
  orgMembers,
  organizations,
  rsvps,
  savedEvents,
  userInterests,
  users,
} from "./schema";

/* ── helpers ── */
function days(n: number) {
  return n * 24 * 60 * 60 * 1000;
}
function hours(n: number) {
  return n * 60 * 60 * 1000;
}
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

const now = Date.now();

async function seed() {
  console.log("Seeding database...");

  /* ═══ 1. Campus Locations ═══ */
  const locationData = [
    {
      id: "frist",
      name: "Frist Campus Center",
      latitude: 40.3469,
      longitude: -74.6551,
      category: "social" as const,
    },
    {
      id: "nassau",
      name: "Nassau Hall",
      latitude: 40.3487,
      longitude: -74.6593,
      category: "administrative" as const,
    },
    {
      id: "equad",
      name: "Engineering Quad (E-Quad)",
      latitude: 40.3502,
      longitude: -74.6498,
      category: "academic" as const,
    },
    {
      id: "bloomberg",
      name: "Bloomberg Hall",
      latitude: 40.3508,
      longitude: -74.6488,
      category: "academic" as const,
    },
    {
      id: "lewis",
      name: "Lewis Center for the Arts",
      latitude: 40.3452,
      longitude: -74.6605,
      category: "academic" as const,
    },
    {
      id: "mccarter",
      name: "McCarter Theatre",
      latitude: 40.3478,
      longitude: -74.6626,
      category: "social" as const,
    },
    {
      id: "jadwin",
      name: "Jadwin Gym",
      latitude: 40.3448,
      longitude: -74.6527,
      category: "athletic" as const,
    },
    {
      id: "dillon",
      name: "Dillon Gym",
      latitude: 40.3456,
      longitude: -74.6541,
      category: "athletic" as const,
    },
    {
      id: "butler",
      name: "Butler College",
      latitude: 40.3441,
      longitude: -74.6583,
      category: "residential" as const,
    },
    {
      id: "whitman",
      name: "Whitman College",
      latitude: 40.3438,
      longitude: -74.6568,
      category: "residential" as const,
    },
    {
      id: "yeh",
      name: "Yeh College",
      latitude: 40.3435,
      longitude: -74.6555,
      category: "residential" as const,
    },
    {
      id: "firestone",
      name: "Firestone Library",
      latitude: 40.3492,
      longitude: -74.6575,
      category: "library" as const,
    },
    {
      id: "friend",
      name: "Friend Center",
      latitude: 40.3505,
      longitude: -74.6515,
      category: "academic" as const,
    },
    {
      id: "prospect",
      name: "Prospect House",
      latitude: 40.3472,
      longitude: -74.6556,
      category: "dining" as const,
    },
    {
      id: "terrace",
      name: "Terrace Club",
      latitude: 40.3462,
      longitude: -74.656,
      category: "social" as const,
    },
    {
      id: "mccosh",
      name: "McCosh Hall",
      latitude: 40.3481,
      longitude: -74.657,
      category: "academic" as const,
    },
    {
      id: "robertson",
      name: "Robertson Hall (SPIA)",
      latitude: 40.3488,
      longitude: -74.6539,
      category: "academic" as const,
    },
    {
      id: "chapel",
      name: "Princeton University Chapel",
      latitude: 40.3482,
      longitude: -74.6586,
      category: "other" as const,
    },
    {
      id: "cst",
      name: "Computer Science Building (CS)",
      latitude: 40.35,
      longitude: -74.6523,
      category: "academic" as const,
    },
    {
      id: "wucox",
      name: "Wu & Wilcox Dining Hall",
      latitude: 40.3443,
      longitude: -74.6577,
      category: "dining" as const,
    },
  ];

  await db.insert(campusLocations).values(locationData).onConflictDoNothing();
  console.log(`  Locations: ${locationData.length}`);

  /* ═══ 2. Users ═══ */
  const userData = [
    {
      netId: "iamin",
      email: "iamin@princeton.edu",
      displayName: "Ibraheem Amin",
      classYear: "2026",
      major: "Computer Science",
      isOrgLeader: true,
      onboarded: true,
    },
    {
      netId: "ajiang",
      email: "ajiang@princeton.edu",
      displayName: "Angelina Jiang",
      classYear: "2027",
      major: "Operations Research",
      isOrgLeader: true,
      onboarded: true,
    },
    {
      netId: "arho",
      email: "arho@princeton.edu",
      displayName: "Albert Rho",
      classYear: "2029",
      major: "Mathematics",
      isOrgLeader: false,
      onboarded: true,
    },
    {
      netId: "pkap",
      email: "pkap@princeton.edu",
      displayName: "Prishaa Kapasi",
      classYear: "2029",
      major: "Electrical Engineering",
      isOrgLeader: false,
      onboarded: true,
    },
    {
      netId: "syou",
      email: "syou@princeton.edu",
      displayName: "Sophia You",
      classYear: "2029",
      major: "Computer Science",
      isOrgLeader: true,
      onboarded: true,
    },
    {
      netId: "cwang",
      email: "cwang@princeton.edu",
      displayName: "Claire Wang",
      classYear: "2027",
      major: "Economics",
      isOrgLeader: false,
      onboarded: true,
    },
    {
      netId: "gkash",
      email: "gkash@princeton.edu",
      displayName: "Gauri Kashyap",
      classYear: "2029",
      major: "Molecular Biology",
      isOrgLeader: false,
      onboarded: true,
    },
    {
      netId: "jlee",
      email: "jlee@princeton.edu",
      displayName: "James Lee",
      classYear: "2026",
      major: "Philosophy",
      isOrgLeader: true,
      onboarded: true,
    },
    {
      netId: "mkim",
      email: "mkim@princeton.edu",
      displayName: "Min-Jun Kim",
      classYear: "2028",
      major: "Physics",
      isOrgLeader: false,
      onboarded: true,
    },
    {
      netId: "rsingh",
      email: "rsingh@princeton.edu",
      displayName: "Riya Singh",
      classYear: "2027",
      major: "Neuroscience",
      isOrgLeader: true,
      onboarded: true,
    },
    {
      netId: "tchen",
      email: "tchen@princeton.edu",
      displayName: "Tiffany Chen",
      classYear: "2028",
      major: "Architecture",
      isOrgLeader: false,
      onboarded: true,
    },
    {
      netId: "dpatel",
      email: "dpatel@princeton.edu",
      displayName: "Dev Patel",
      classYear: "2026",
      major: "Computer Science",
      isOrgLeader: true,
      onboarded: true,
    },
  ];

  const insertedUsers = await db
    .insert(users)
    .values(userData)
    .onConflictDoNothing()
    .returning({ id: users.id, netId: users.netId });
  const userMap = new Map(insertedUsers.map((u) => [u.netId, u.id]));
  if (userMap.size < userData.length) {
    const existing = await db.select({ id: users.id, netId: users.netId }).from(users);
    for (const u of existing) userMap.set(u.netId, u.id);
  }
  console.log(`  Users: ${userMap.size}`);

  const uid = (netId: string) => userMap.get(netId) ?? "";

  /* ═══ 3. User Interests ═══ */
  const interestData: {
    userId: string;
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
    { userId: uid("iamin"), tags: ["tech", "career", "free-food", "social"] },
    { userId: uid("ajiang"), tags: ["art", "career", "social", "music"] },
    { userId: uid("arho"), tags: ["academic", "tech", "gaming", "free-food"] },
    { userId: uid("pkap"), tags: ["tech", "wellness", "social", "outdoor"] },
    { userId: uid("syou"), tags: ["tech", "art", "career", "free-food"] },
    { userId: uid("cwang"), tags: ["career", "social", "music", "cultural"] },
    { userId: uid("gkash"), tags: ["academic", "wellness", "community-service", "cultural"] },
    { userId: uid("jlee"), tags: ["performance", "social", "music", "art"] },
    { userId: uid("mkim"), tags: ["academic", "tech", "sports", "gaming"] },
    { userId: uid("rsingh"), tags: ["academic", "wellness", "career", "speaker"] },
    { userId: uid("tchen"), tags: ["art", "cultural", "social", "outdoor"] },
    { userId: uid("dpatel"), tags: ["tech", "career", "free-food", "gaming"] },
  ];

  for (const { userId, tags } of interestData) {
    await db
      .insert(userInterests)
      .values(tags.map((tag) => ({ userId, tag })))
      .onConflictDoNothing();
  }
  console.log("  User interests seeded");

  /* ═══ 4. Organizations ═══ */
  const orgData = [
    {
      name: "Princeton TigerApps",
      description: "Student-run apps for the Princeton community.",
      category: "academic" as const,
      creatorId: uid("iamin"),
    },
    {
      name: "Princeton ACM",
      description: "Talks, workshops, and socials for CS enthusiasts.",
      category: "academic" as const,
      creatorId: uid("dpatel"),
    },
    {
      name: "Princeton Entrepreneurship Club",
      description: "Fostering innovation through talks, competitions, and networking.",
      category: "career" as const,
      creatorId: uid("syou"),
    },
    {
      name: "Princeton Tigertones",
      description: "All-male a cappella group.",
      category: "performance" as const,
      creatorId: uid("jlee"),
    },
    {
      name: "Princeton BlockWarriors",
      description: "Web3 and blockchain education and hackathons.",
      category: "academic" as const,
      creatorId: uid("iamin"),
    },
    {
      name: "Princeton Bhangra",
      description: "Competitive South Asian dance team.",
      category: "cultural" as const,
      creatorId: uid("rsingh"),
    },
    {
      name: "Outdoor Action",
      description: "Princeton's premier outdoor adventure program.",
      category: "athletic" as const,
      creatorId: uid("pkap"),
    },
    {
      name: "Princeton Women in CS",
      description: "Community and mentorship for women in computer science.",
      category: "affinity" as const,
      creatorId: uid("ajiang"),
    },
    {
      name: "Princeton Investment Club",
      description: "Stock pitches, market analysis, and finance networking.",
      category: "career" as const,
      creatorId: uid("cwang"),
    },
    {
      name: "Princeton Art Museum Society",
      description: "Connecting students with the Princeton Art Museum.",
      category: "cultural" as const,
      creatorId: uid("tchen"),
    },
  ];

  const insertedOrgs = await db
    .insert(organizations)
    .values(orgData)
    .onConflictDoNothing()
    .returning({ id: organizations.id, name: organizations.name });
  const orgMap = new Map(insertedOrgs.map((o) => [o.name, o.id]));
  if (orgMap.size < orgData.length) {
    const existing = await db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations);
    for (const o of existing) orgMap.set(o.name, o.id);
  }
  console.log(`  Organizations: ${orgMap.size}`);

  const oid = (name: string) => orgMap.get(name) ?? "";

  /* ═══ 5. Org Members ═══ */
  await db
    .insert(orgMembers)
    .values([
      { orgId: oid("Princeton TigerApps"), userId: uid("iamin"), role: "owner" as const },
      { orgId: oid("Princeton TigerApps"), userId: uid("ajiang"), role: "officer" as const },
      { orgId: oid("Princeton TigerApps"), userId: uid("syou"), role: "officer" as const },
      { orgId: oid("Princeton TigerApps"), userId: uid("dpatel"), role: "member" as const },
      { orgId: oid("Princeton ACM"), userId: uid("dpatel"), role: "owner" as const },
      { orgId: oid("Princeton ACM"), userId: uid("iamin"), role: "member" as const },
      {
        orgId: oid("Princeton Entrepreneurship Club"),
        userId: uid("syou"),
        role: "owner" as const,
      },
      { orgId: oid("Princeton Tigertones"), userId: uid("jlee"), role: "owner" as const },
      { orgId: oid("Princeton BlockWarriors"), userId: uid("iamin"), role: "owner" as const },
      { orgId: oid("Princeton Bhangra"), userId: uid("rsingh"), role: "owner" as const },
      { orgId: oid("Outdoor Action"), userId: uid("pkap"), role: "owner" as const },
      { orgId: oid("Princeton Women in CS"), userId: uid("ajiang"), role: "owner" as const },
      { orgId: oid("Princeton Investment Club"), userId: uid("cwang"), role: "owner" as const },
      { orgId: oid("Princeton Art Museum Society"), userId: uid("tchen"), role: "owner" as const },
    ])
    .onConflictDoNothing();

  /* ═══ 6. Org Followers ═══ */
  await db
    .insert(orgFollowers)
    .values([
      { orgId: oid("Princeton TigerApps"), userId: uid("arho") },
      { orgId: oid("Princeton TigerApps"), userId: uid("pkap") },
      { orgId: oid("Princeton TigerApps"), userId: uid("mkim") },
      { orgId: oid("Princeton ACM"), userId: uid("arho") },
      { orgId: oid("Princeton ACM"), userId: uid("syou") },
      { orgId: oid("Princeton Entrepreneurship Club"), userId: uid("iamin") },
      { orgId: oid("Princeton Bhangra"), userId: uid("pkap") },
      { orgId: oid("Outdoor Action"), userId: uid("tchen") },
      { orgId: oid("Princeton Women in CS"), userId: uid("pkap") },
      { orgId: oid("Princeton Investment Club"), userId: uid("iamin") },
    ])
    .onConflictDoNothing();
  console.log("  Org members & followers seeded");

  /* ═══ 7. Friendships ═══ */
  await db
    .insert(friendships)
    .values([
      { userId: uid("iamin"), friendId: uid("ajiang"), status: "accepted" as const },
      { userId: uid("iamin"), friendId: uid("arho"), status: "accepted" as const },
      { userId: uid("iamin"), friendId: uid("pkap"), status: "accepted" as const },
      { userId: uid("iamin"), friendId: uid("syou"), status: "accepted" as const },
      { userId: uid("iamin"), friendId: uid("dpatel"), status: "accepted" as const },
      { userId: uid("iamin"), friendId: uid("gkash"), status: "accepted" as const },
      { userId: uid("ajiang"), friendId: uid("syou"), status: "accepted" as const },
      { userId: uid("ajiang"), friendId: uid("cwang"), status: "accepted" as const },
      { userId: uid("arho"), friendId: uid("pkap"), status: "accepted" as const },
      { userId: uid("arho"), friendId: uid("mkim"), status: "accepted" as const },
      { userId: uid("syou"), friendId: uid("dpatel"), status: "accepted" as const },
      { userId: uid("jlee"), friendId: uid("tchen"), status: "accepted" as const },
      { userId: uid("rsingh"), friendId: uid("gkash"), status: "accepted" as const },
      { userId: uid("cwang"), friendId: uid("tchen"), status: "accepted" as const },
      { userId: uid("mkim"), friendId: uid("dpatel"), status: "accepted" as const },
    ])
    .onConflictDoNothing();
  console.log("  Friendships seeded");

  /* ═══ 8. Events — -1 week to +2 weeks ═══ */
  type Tag =
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
    | "tech"
    | "gaming"
    | "outdoor"
    | "wellness";

  const eventList: {
    title: string;
    description: string;
    datetime: Date;
    endDatetime?: Date;
    locationId: string;
    orgId?: string;
    creatorId: string;
    tags: Tag[];
  }[] = [
    {
      title: "TigerApps Kickoff Social",
      description: "Meet the team behind TigerApps! Free boba and snacks provided.",
      datetime: new Date(now - days(6) + hours(18)),
      endDatetime: new Date(now - days(6) + hours(20)),
      locationId: "frist",
      orgId: oid("Princeton TigerApps"),
      creatorId: uid("iamin"),
      tags: ["social", "free-food", "tech"],
    },
    {
      title: "Intro to Rust Workshop",
      description: "Learn the basics of Rust. No prior experience needed.",
      datetime: new Date(now - days(5) + hours(16)),
      endDatetime: new Date(now - days(5) + hours(18)),
      locationId: "cst",
      orgId: oid("Princeton ACM"),
      creatorId: uid("dpatel"),
      tags: ["tech", "workshop"],
    },
    {
      title: "Tigertones Fall Concert",
      description: "Pop hits, jazz standards, and original arrangements. Free admission!",
      datetime: new Date(now - days(4) + hours(20)),
      locationId: "mccarter",
      orgId: oid("Princeton Tigertones"),
      creatorId: uid("jlee"),
      tags: ["music", "performance"],
    },
    {
      title: "Resume Workshop",
      description: "1-on-1 resume review with career advisors.",
      datetime: new Date(now - days(3) + hours(14)),
      locationId: "robertson",
      orgId: oid("Princeton Entrepreneurship Club"),
      creatorId: uid("syou"),
      tags: ["career", "workshop"],
    },
    {
      title: "Blockchain 101: What is Web3?",
      description: "A beginner-friendly talk on blockchain technology and smart contracts.",
      datetime: new Date(now + hours(3)),
      endDatetime: new Date(now + hours(5)),
      locationId: "friend",
      orgId: oid("Princeton BlockWarriors"),
      creatorId: uid("iamin"),
      tags: ["tech", "speaker", "academic"],
    },
    {
      title: "Free Pizza & Study Break",
      description: "Grab free pizza, chips, and drinks at Frist. Sponsored by USG.",
      datetime: new Date(now + hours(5)),
      endDatetime: new Date(now + hours(7)),
      locationId: "frist",
      creatorId: uid("arho"),
      tags: ["free-food", "social"],
    },
    {
      title: "Bhangra Practice (Open to All!)",
      description: "Try Bhangra! No experience needed — just bring energy.",
      datetime: new Date(now + days(1) + hours(19)),
      endDatetime: new Date(now + days(1) + hours(21)),
      locationId: "dillon",
      orgId: oid("Princeton Bhangra"),
      creatorId: uid("rsingh"),
      tags: ["cultural", "sports", "social"],
    },
    {
      title: "Intro to Taiko Drumming",
      description: "Learn Japanese taiko drumming. Drums provided!",
      datetime: new Date(now + days(1) + hours(16)),
      locationId: "lewis",
      creatorId: uid("tchen"),
      tags: ["cultural", "music", "workshop"],
    },
    {
      title: "Women in CS: Industry Panel",
      description: "Hear from alumnae at Google, Meta, and Jane Street.",
      datetime: new Date(now + days(2) + hours(17)),
      endDatetime: new Date(now + days(2) + hours(19)),
      locationId: "cst",
      orgId: oid("Princeton Women in CS"),
      creatorId: uid("ajiang"),
      tags: ["career", "tech", "speaker"],
    },
    {
      title: "Stock Pitch Night",
      description: "Present your best stock pitch! Pizza and drinks provided.",
      datetime: new Date(now + days(2) + hours(19)),
      locationId: "robertson",
      orgId: oid("Princeton Investment Club"),
      creatorId: uid("cwang"),
      tags: ["career", "free-food"],
    },
    {
      title: "Sourlands Hike",
      description: "Scenic 5-mile hike. Transportation provided. Bring water!",
      datetime: new Date(now + days(3) + hours(9)),
      endDatetime: new Date(now + days(3) + hours(15)),
      locationId: "frist",
      orgId: oid("Outdoor Action"),
      creatorId: uid("pkap"),
      tags: ["outdoor", "sports"],
    },
    {
      title: "Museum Late Night: Contemporary Art",
      description: "After-hours tour of the contemporary art wing + sketching session.",
      datetime: new Date(now + days(3) + hours(20)),
      locationId: "prospect",
      orgId: oid("Princeton Art Museum Society"),
      creatorId: uid("tchen"),
      tags: ["art", "cultural", "social"],
    },
    {
      title: "Competitive Programming Practice",
      description: "Weekly ICPC prep. All levels welcome.",
      datetime: new Date(now + days(4) + hours(18)),
      locationId: "cst",
      orgId: oid("Princeton ACM"),
      creatorId: uid("dpatel"),
      tags: ["tech", "academic"],
    },
    {
      title: "TigerApps All Hands",
      description: "Monthly all-hands. Project updates and new member onboarding.",
      datetime: new Date(now + days(7) + hours(18)),
      locationId: "frist",
      orgId: oid("Princeton TigerApps"),
      creatorId: uid("iamin"),
      tags: ["tech", "social"],
    },
    {
      title: "Jane Street Info Session",
      description: "Internship and full-time opportunities. Free dinner!",
      datetime: new Date(now + days(8) + hours(18)),
      locationId: "friend",
      creatorId: uid("cwang"),
      tags: ["career", "free-food", "tech"],
    },
    {
      title: "Princeton Poetry Slam",
      description: "Open mic poetry slam. Sign up to perform or just listen!",
      datetime: new Date(now + days(8) + hours(20)),
      locationId: "lewis",
      creatorId: uid("jlee"),
      tags: ["art", "performance", "social"],
    },
    {
      title: "Yoga on the Green",
      description: "Free outdoor yoga on Cannon Green. Mats provided. All levels.",
      datetime: new Date(now + days(9) + hours(8)),
      locationId: "nassau",
      creatorId: uid("gkash"),
      tags: ["wellness", "outdoor"],
    },
    {
      title: "E-Club Startup Showcase",
      description: "Five student startups pitch to VC judges and alumni entrepreneurs.",
      datetime: new Date(now + days(10) + hours(17)),
      locationId: "robertson",
      orgId: oid("Princeton Entrepreneurship Club"),
      creatorId: uid("syou"),
      tags: ["career", "tech", "speaker"],
    },
    {
      title: "GameDev Jam: 48-Hour Challenge",
      description: "Build a game in 48 hours! Prizes for best game, best art, most creative.",
      datetime: new Date(now + days(11) + hours(18)),
      endDatetime: new Date(now + days(13) + hours(18)),
      locationId: "cst",
      orgId: oid("Princeton ACM"),
      creatorId: uid("dpatel"),
      tags: ["tech", "gaming", "social"],
    },
    {
      title: "Spring Bhangra Watch Party",
      description: "Livestream of the national Bhangra competition. Snacks and chai!",
      datetime: new Date(now + days(12) + hours(15)),
      locationId: "frist",
      orgId: oid("Princeton Bhangra"),
      creatorId: uid("rsingh"),
      tags: ["cultural", "social", "free-food"],
    },
    {
      title: "Super Event",
      description: "A super interesting event that everyone should attend.",
      datetime: new Date(now + days(8) + hours(18)),
      locationId: "butler",
      creatorId: uid("arho"),
      tags: ["social"],
    },
  ];

  const insertedEvents = [];
  for (const e of eventList) {
    const { tags: tagList, ...vals } = e;
    const [inserted] = await db.insert(events).values(vals).returning({ id: events.id });
    if (inserted) {
      insertedEvents.push({ id: inserted.id, tags: tagList });
      if (tagList.length > 0) {
        await db
          .insert(eventTags)
          .values(tagList.map((tag) => ({ eventId: inserted.id, tag })))
          .onConflictDoNothing();
      }
    }
  }
  console.log(`  Events: ${insertedEvents.length}`);

  /* ═══ 9. RSVPs ═══ */
  const allUserIds = [...userMap.values()];
  for (const event of insertedEvents) {
    const attendees = pickN(allUserIds, 2 + Math.floor(Math.random() * 5));
    for (const userId of attendees) {
      await db.insert(rsvps).values({ userId, eventId: event.id }).onConflictDoNothing();
    }
  }
  console.log("  RSVPs seeded");

  /* ═══ 10. Saved Events ═══ */
  for (const userId of allUserIds) {
    const toSave = pickN(insertedEvents, 2 + Math.floor(Math.random() * 3));
    for (const event of toSave) {
      await db.insert(savedEvents).values({ userId, eventId: event.id }).onConflictDoNothing();
    }
  }
  console.log("  Saved events seeded");

  console.log("\nSeed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
