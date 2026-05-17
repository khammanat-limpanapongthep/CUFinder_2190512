import type { Item, Location, User } from "../../types";

const SEED_LOCATION_NAMES = [
  "Mahachakri Sirindhorn Building",
  "Maha Vajiravudh Building",
  "Boromratchakumari Building",
  "Chamchuri 5",
  "Chamchuri 9",
  "Chaloem Rajakumari 60 Building",
  "Mahitaladhibesra Building",
  "Office of Academic Resources (Central Library)",
  "Faculty of Commerce & Accountancy",
  "Faculty of Engineering",
  "Faculty of Science",
  "Faculty of Arts",
  "Faculty of Law",
  "Faculty of Medicine",
  "Sala Phra Kiao",
  "MBK Center",
  "Siam Square",
  "CU Sports Complex",
  "Cafeteria (Sasa Patasala)",
  "CU Dorm",
];

export interface MockState {
  users: Map<string, User>;
  locations: Map<string, Location>;
  items: Map<string, Item>;
  images: Map<string, string>; // id -> data url
  session: { userId: string | null };
}

let counter = 0;
export function newId(prefix = "id"): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}

function seedLocations(): Map<string, Location> {
  const map = new Map<string, Location>();
  const now = new Date().toISOString();
  for (const name of SEED_LOCATION_NAMES) {
    const id = newId("loc");
    map.set(id, {
      id,
      name,
      is_dropoff: true,
      is_active: true,
      created_at: now,
    });
  }
  return map;
}

function locByName(locations: Map<string, Location>, name: string): Location | undefined {
  for (const loc of locations.values()) if (loc.name === name) return loc;
  return undefined;
}

function seedUsers(locations: Map<string, Location>): Map<string, User> {
  const map = new Map<string, User>();
  const libLoc = locByName(locations, "Office of Academic Resources (Central Library)");
  const engLoc = locByName(locations, "Faculty of Engineering");
  const list: User[] = [
    {
      id: newId("usr"),
      email: "library.admin@chula.ac.th",
      display_name: "Library Admin",
      role: "location_admin",
      admin_location_id: libLoc?.id ?? null,
    },
    {
      id: newId("usr"),
      email: "eng.admin@chula.ac.th",
      display_name: "Engineering Admin",
      role: "location_admin",
      admin_location_id: engLoc?.id ?? null,
    },
    {
      id: newId("usr"),
      email: "web.admin@chula.ac.th",
      display_name: "Web Admin",
      role: "web_admin",
      admin_location_id: null,
    },
  ];
  for (const u of list) map.set(u.id, u);
  return map;
}

function seedItems(locations: Map<string, Location>, users: Map<string, User>): Map<string, Item> {
  const map = new Map<string, Item>();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString();

  const arts = locByName(locations, "Faculty of Arts");
  const lib = locByName(locations, "Office of Academic Resources (Central Library)");
  const eng = locByName(locations, "Faculty of Engineering");
  const sport = locByName(locations, "CU Sports Complex");
  const cafe = locByName(locations, "Cafeteria (Sasa Patasala)");

  const firstAdmin = [...users.values()].find((u) => u.role === "location_admin")!;
  const samplePoster = {
    id: newId("usr"),
    display_name: "Anon Student",
  };

  const examples: Item[] = [
    {
      id: newId("itm"),
      type: "lost",
      title: "Black AirPods Pro case",
      description: "Lost my AirPods Pro case near the Faculty of Arts building. Has a small scratch on the back.",
      category: "Electronics",
      image_id: null,
      status: "open",
      posted_by: samplePoster,
      posted_at: yesterday,
      last_seen_location_id: arts?.id ?? null,
      last_seen_location_text: arts ? null : "Faculty of Arts",
      last_seen_date: yesterday,
      contact_info: "DM @anon.cu on IG",
    },
    {
      id: newId("itm"),
      type: "found",
      title: "Blue Hydroflask water bottle",
      description: "Found at the central library on the 3rd floor study area.",
      category: "Water Bottles",
      image_id: null,
      status: "open",
      posted_by: { id: firstAdmin.id, display_name: firstAdmin.display_name },
      posted_at: yesterday,
      found_location_id: lib?.id ?? null,
      found_location_text: lib ? null : "Library",
      found_date: yesterday,
      held_admin_location_id: lib?.id ?? null,
      held_freetext: null,
    },
    {
      id: newId("itm"),
      type: "lost",
      title: "Student ID card — name redacted",
      description: "Lost my CU student ID near the engineering building cafe. Please help if you find it.",
      category: "ID Cards",
      image_id: null,
      status: "open",
      posted_by: samplePoster,
      posted_at: twoDaysAgo,
      last_seen_location_id: eng?.id ?? null,
      last_seen_location_text: null,
      last_seen_date: twoDaysAgo,
      contact_info: null,
    },
    {
      id: newId("itm"),
      type: "found",
      title: "Set of keys with red keychain",
      description: "Three keys on a red carabiner keychain. Found near the basketball court.",
      category: "Keys",
      image_id: null,
      status: "open",
      posted_by: samplePoster,
      posted_at: threeDaysAgo,
      found_location_id: sport?.id ?? null,
      found_location_text: null,
      found_date: threeDaysAgo,
      held_admin_location_id: null,
      held_freetext: "Currently with me. Will bring to CU Sports Complex front desk this Friday.",
    },
    {
      id: newId("itm"),
      type: "found",
      title: "Black umbrella",
      description: "Plain black umbrella left in the cafeteria.",
      category: "Other",
      image_id: null,
      status: "open",
      posted_by: { id: firstAdmin.id, display_name: firstAdmin.display_name },
      posted_at: threeDaysAgo,
      found_location_id: cafe?.id ?? null,
      found_location_text: null,
      found_date: threeDaysAgo,
      held_admin_location_id: cafe?.id ?? null,
      held_freetext: null,
    },
  ];
  for (const it of examples) map.set(it.id, it);
  return map;
}

export function createInitialState(): MockState {
  const locations = seedLocations();
  const users = seedUsers(locations);
  const items = seedItems(locations, users);
  return {
    locations,
    users,
    items,
    images: new Map(),
    session: { userId: null },
  };
}

export const SESSION_STORAGE_KEY = "cufinder.mock.session";
