/**
 * MyPrincetonU Club Officers Scraper
 *
 * Scrapes all club/org officer data from my.princeton.edu's CampusGroups API.
 *
 * Usage:
 *   1. Export your browser cookies to apps/mpu-scraper/cookies.json
 *      (only CG.SessionID and cg_uid are required)
 *   2. bun run scrape
 *
 * Output: apps/mpu-scraper/data/club_officers.json
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CookieEntry {
  name: string;
  value: string;
  domain?: string;
  path?: string;
}

interface ClubListItem {
  id: number;
  name: string;
  email: string | null;
  groupTypeValue: string;
  categoryTagIds: string[];
  published: boolean;
  countMembers: number;
  countOfficers: number;
}

interface ClubAboutOfficer {
  position: string;
  student: {
    id: number;
    firstName: string;
    lastName: string;
    profilePhotoFileName: string | null;
    profilePhotoSubFolder: string;
    uid: string;
  };
}

interface ClubAboutResponse {
  club: {
    id: number;
    name: string;
    email: string | null;
    mission: string | null;
    whatWeDo: string | null;
    goals: string | null;
    websiteUrl: string | null;
    instagram: string | null;
    facebook: string | null;
    twitter: string | null;
    youtube: string | null;
    linkedin: string | null;
    discord: string | null;
    groupTypeValue: string;
    categories: { name: string }[];
    officers: ClubAboutOfficer[] | null;
  };
}

interface UserProfile {
  email: string | null;
  accountType: string | null;
  yearOfGraduation: string | null;
}

interface OfficerEntry {
  position: string;
  first_name: string;
  last_name: string;
  student_id: number;
  uid: string;
  email: string | null;
  net_id: string | null;
}

interface MemberEntry {
  first_name: string;
  last_name: string;
  email: string;
  student_type: string;
  year_of_graduation: string;
  student_id: string;
  uid: string;
}

interface ClubOfficerRecord {
  club_id: number;
  club_name: string;
  club_email: string | null;
  group_type: string;
  categories: string[];
  mission: string | null;
  website: string | null;
  instagram: string | null;
  member_count: number;
  officer_count: number;
  officers: OfficerEntry[];
  president: (OfficerEntry & { email: string | null }) | null;
  members: MemberEntry[];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE = "https://my.princeton.edu";
const ROOT_DIR = join(import.meta.dir, "..");
const COOKIE_FILE = join(ROOT_DIR, "cookies.json");
const DATA_DIR = join(ROOT_DIR, "data");
const OUTPUT_FILE = join(DATA_DIR, "club_officers.json");
const PAGE_SIZE = 50;
const DELAY_MS = 200;

// ---------------------------------------------------------------------------
// Cookie loading
// ---------------------------------------------------------------------------

function loadCookieString(): string {
  if (!existsSync(COOKIE_FILE)) {
    console.error(`ERROR: Cookie file not found at ${COOKIE_FILE}`);
    console.error("Export your my.princeton.edu cookies from the browser and save them there.");
    process.exit(1);
  }

  const raw: CookieEntry[] = JSON.parse(readFileSync(COOKIE_FILE, "utf-8"));
  const essential = new Set(["CG.SessionID", "cg_uid", "AWSALB", "AWSALBCORS"]);
  return raw
    .filter((c) => essential.has(c.name))
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

const cookies = loadCookieString();

async function fetchJson<T>(path: string): Promise<T | null> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        Cookie: cookies,
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// LDAP lookup — resolves email → Princeton netID
// ---------------------------------------------------------------------------

function ldapLookupNetId(email: string): string | null {
  try {
    const result = execSync(
      `ldapsearch -x -H ldaps://ldap.princeton.edu -b "o=Princeton University,c=US" "(mail=${email})" uid`,
      { timeout: 10_000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    const match = result.match(/^uid:\s*(\S+)/m);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Scraping logic
// ---------------------------------------------------------------------------

async function verifySession(): Promise<boolean> {
  const data = await fetchJson<{ jwt: string; csrf_token: string }>(
    "/mobile_ws/v18/mobile_session",
  );
  return data !== null && "jwt" in data;
}

async function fetchAllClubs(): Promise<ClubListItem[]> {
  const clubs: ClubListItem[] = [];
  let page = 1;

  while (true) {
    const data = await fetchJson<{
      data: ClubListItem[];
      _metadata: { total: number };
    }>(`/mobile_ws/v18/mobile_clubs_listing?page=${page}&pageSize=${PAGE_SIZE}`);

    if (!data?.data) {
      console.error(`  ERROR: unexpected response on page ${page}`);
      break;
    }

    const total = data._metadata.total;
    clubs.push(...data.data);
    console.log(`  Page ${page}: got ${data.data.length} clubs (${clubs.length}/${total})`);

    if (data.data.length < PAGE_SIZE || clubs.length >= total) break;
    page++;
    await sleep(DELAY_MS);
  }

  return clubs;
}

async function fetchClubOfficers(club: ClubListItem): Promise<ClubOfficerRecord | null> {
  const about = await fetchJson<ClubAboutResponse>(
    `/mobile_ws/v18/mobile_club_about?id=${club.id}`,
  );

  if (!about?.club) return null;

  const info = about.club;
  const officers = info.officers ?? [];

  const president = officers.find((o) => o.position?.toLowerCase() === "president");

  return {
    club_id: club.id,
    club_name: info.name.trim(),
    club_email: info.email,
    group_type: info.groupTypeValue,
    categories: (info.categories ?? []).map((c) => c.name),
    mission: info.mission,
    website: info.websiteUrl,
    instagram: info.instagram,
    member_count: club.countMembers ?? 0,
    officer_count: club.countOfficers ?? 0,
    officers: officers.map((o) => ({
      position: o.position,
      first_name: o.student.firstName,
      last_name: o.student.lastName,
      student_id: o.student.id,
      uid: o.student.uid,
      email: null, // populated in email resolution pass
      net_id: null, // populated in LDAP resolution pass
    })),
    president: president
      ? {
          first_name: president.student.firstName,
          last_name: president.student.lastName,
          student_id: president.student.id,
          uid: president.student.uid,
          email: null,
          net_id: null,
          position: president.position,
        }
      : null,
    members: [], // populated in member fetching pass
  };
}

interface MemberListingItem {
  fields: string;
  counter: string;
  [key: `p${number}`]: string;
}

async function fetchClubMembers(clubId: number): Promise<MemberEntry[]> {
  const data = await fetchJson<MemberListingItem[]>(
    `/mobile_ws/v17/mobile_group_page_members?range=0&limit=5000&param=${clubId}`,
  );

  if (!data || !Array.isArray(data) || data.length === 0) return [];

  const fields = data[0].fields.replace(/,$/, "").split(",");
  const idx = (name: string) => fields.indexOf(name);

  return data.map((item) => ({
    first_name: item[`p${idx("firstName")}`] ?? "",
    last_name: item[`p${idx("lastName")}`] ?? "",
    email: item[`p${idx("student_email")}`] ?? "",
    student_type: item[`p${idx("studentType")}`] ?? "",
    year_of_graduation: item[`p${idx("yearOfGraduation")}`] ?? "",
    student_id: item[`p${idx("studentId")}`] ?? "",
    uid: item[`p${idx("studentUid")}`] ?? "",
  }));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("MyPrincetonU Club Officers Scraper");
  console.log("==================================\n");

  // 1. Verify session
  console.log("Verifying session...");
  const alive = await verifySession();
  if (!alive) {
    console.error("Session invalid or expired. Re-export your cookies.");
    process.exit(1);
  }
  console.log("  Session OK\n");

  // 2. Fetch all clubs
  console.log("Fetching club list...");
  const clubs = await fetchAllClubs();
  console.log(`\nTotal clubs: ${clubs.length}\n`);

  // 3. Fetch officers for each club
  console.log(`Fetching officer details for ${clubs.length} clubs...`);
  const results: ClubOfficerRecord[] = [];
  const errors: { id: number; name: string }[] = [];

  for (let i = 0; i < clubs.length; i++) {
    const club = clubs[i];
    const record = await fetchClubOfficers(club);

    if (record) {
      results.push(record);
    } else {
      errors.push({ id: club.id, name: club.name.trim() });
    }

    if ((i + 1) % 50 === 0 || i === clubs.length - 1) {
      const withPres = results.filter((r) => r.president).length;
      console.log(
        `  [${i + 1}/${clubs.length}] ${results.length} ok, ${withPres} have president, ${errors.length} errors`,
      );
    }

    await sleep(DELAY_MS);
  }

  // 4. Fetch member lists for each club
  console.log(`\nFetching member lists for ${results.length} clubs...`);
  let totalMembers = 0;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    r.members = await fetchClubMembers(r.club_id);
    totalMembers += r.members.length;

    if ((i + 1) % 50 === 0 || i === results.length - 1) {
      console.log(`  [${i + 1}/${results.length}] ${totalMembers} total members scraped`);
    }

    await sleep(DELAY_MS);
  }

  // 5. Resolve officer emails via profile endpoint
  // Deduplicate by uid so we don't fetch the same person multiple times
  const uniqueUids: string[] = [];
  const seen = new Set<string>();

  for (const r of results) {
    for (const o of r.officers) {
      if (o.uid && !seen.has(o.uid)) {
        seen.add(o.uid);
        uniqueUids.push(o.uid);
      }
    }
  }

  const uidToEmail = new Map<string, string | null>();

  console.log(`\nResolving emails for ${uniqueUids.length} unique officers...`);

  let resolved = 0;
  let emailErrors = 0;

  for (let i = 0; i < uniqueUids.length; i++) {
    const uid = uniqueUids[i];

    const profile = await fetchJson<UserProfile>(
      `/mobile_ws/v18/mobile_profile2?uid=${uid}&view=full`,
    );

    if (profile?.email) {
      uidToEmail.set(uid, profile.email);
      resolved++;
    } else {
      emailErrors++;
    }

    if ((i + 1) % 100 === 0 || i === uniqueUids.length - 1) {
      console.log(
        `  [${i + 1}/${uniqueUids.length}] ${resolved} emails resolved, ${emailErrors} failed`,
      );
    }

    await sleep(DELAY_MS);
  }

  // Populate emails back into all officer records
  for (const r of results) {
    for (const o of r.officers) {
      o.email = uidToEmail.get(o.uid) ?? null;
    }
    if (r.president) {
      r.president.email = uidToEmail.get(r.president.uid) ?? null;
    }
  }

  // 6. Resolve netIDs via Princeton LDAP
  // Deduplicate emails so we don't query the same one twice
  const emailToNetId = new Map<string, string | null>();
  const uniqueEmails: string[] = [];

  for (const r of results) {
    for (const o of r.officers) {
      if (o.email && !emailToNetId.has(o.email)) {
        emailToNetId.set(o.email, null);
        uniqueEmails.push(o.email);
      }
    }
  }

  console.log(`\nResolving netIDs via LDAP for ${uniqueEmails.length} unique emails...`);

  let netIdResolved = 0;
  let netIdFailed = 0;

  for (let i = 0; i < uniqueEmails.length; i++) {
    const email = uniqueEmails[i];
    const netId = ldapLookupNetId(email);

    if (netId) {
      emailToNetId.set(email, netId);
      netIdResolved++;
    } else {
      netIdFailed++;
    }

    if ((i + 1) % 100 === 0 || i === uniqueEmails.length - 1) {
      console.log(
        `  [${i + 1}/${uniqueEmails.length}] ${netIdResolved} resolved, ${netIdFailed} failed`,
      );
    }
  }

  // Populate netIDs back into all officer records
  for (const r of results) {
    for (const o of r.officers) {
      if (o.email) {
        o.net_id = emailToNetId.get(o.email) ?? null;
      }
    }
    if (r.president?.email) {
      r.president.net_id = emailToNetId.get(r.president.email) ?? null;
    }
  }

  // 7. Write output
  mkdirSync(DATA_DIR, { recursive: true });

  const output = {
    scraped_at: new Date().toISOString(),
    total_clubs: clubs.length,
    clubs_with_officers: results.filter((r) => r.officers.length > 0).length,
    clubs_with_president: results.filter((r) => r.president).length,
    unique_officers: uidToEmail.size,
    officers_with_email: resolved,
    officers_with_net_id: netIdResolved,
    total_members_scraped: totalMembers,
    clubs_with_members: results.filter((r) => r.members.length > 0).length,
    errors: errors.length,
    clubs: results,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nResults saved to ${OUTPUT_FILE}`);

  // 8. Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total clubs:           ${output.total_clubs}`);
  console.log(`Clubs with officers:   ${output.clubs_with_officers}`);
  console.log(`Clubs with president:  ${output.clubs_with_president}`);
  console.log(`Unique officers:       ${output.unique_officers}`);
  console.log(`Officers with email:   ${output.officers_with_email}`);
  console.log(`Officers with netID:   ${output.officers_with_net_id}`);
  console.log(`Total members scraped: ${output.total_members_scraped}`);
  console.log(`Clubs with members:    ${output.clubs_with_members}`);
  console.log(`Errors:                ${output.errors}`);

  const presidents = results.filter((r) => r.president);
  if (presidents.length > 0) {
    console.log("\nSample presidents:");
    for (const r of presidents.slice(0, 10)) {
      const p = r.president as NonNullable<typeof r.president>;
      console.log(
        `  ${r.club_name.padEnd(40)} → ${p.first_name} ${p.last_name} <${p.email ?? "?"}> (netID: ${p.net_id ?? "?"})`,
      );
    }
  }

  if (errors.length > 0) {
    console.log("\nFirst few errors:");
    for (const e of errors.slice(0, 5)) {
      console.log(`  ${e.name} (ID ${e.id})`);
    }
  }
}

main();
