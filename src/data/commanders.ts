export interface Commander {
  id: string;
  name: string;
  title: string;
  category: "Hero" | "Classic";
  avatar: string;
}

// Your verified Supabase Storage public bucket base URL
const BUCKET_URL =
  "https://hjasxlveijbrhdzulzsc.supabase.co/storage/v1/object/public/commander";

export const MCGG_COMMANDERS: Commander[] = [
  // ==========================================
  // 1. HERO COMMANDERS
  // ==========================================
  {
    id: "chou",
    name: "Chou",
    title: "Kung Fu Boy",
    category: "Hero",
    avatar: `${BUCKET_URL}/chou.jpg`,
  },
  {
    id: "wanwan",
    name: "Wanwan",
    title: "Agile Tiger",
    category: "Hero",
    avatar: `${BUCKET_URL}/wanwan.jpg`,
  },
  {
    id: "ling",
    name: "Ling",
    title: "Cyan Finch",
    category: "Hero",
    avatar: `${BUCKET_URL}/ling.jpg`,
  },
  {
    id: "popolkupa",
    name: "Popol & Kupa",
    title: "Icefield Companions",
    category: "Hero",
    avatar: `${BUCKET_URL}/popolkupa.jpg`,
  },
  {
    id: "luoyi",
    name: "Luo Yi",
    title: "Yin Yang Geomancer",
    category: "Hero",
    avatar: `${BUCKET_URL}/luoyi.jpg`,
  },
  {
    id: "fanny",
    name: "Fanny",
    title: "Blade Dancer",
    category: "Hero",
    avatar: `${BUCKET_URL}/fanny.jpg`,
  },
  {
    id: "kagura",
    name: "Kagura",
    title: "Onmyouji Master",
    category: "Hero",
    avatar: `${BUCKET_URL}/kagura.jpg`,
  },
  {
    id: "minotaur",
    name: "Minotaur",
    title: "Son of Minos",
    category: "Hero",
    avatar: `${BUCKET_URL}/minotaur.jpg`,
  },
  {
    id: "ruby",
    name: "Ruby",
    title: "Little Red Hood",
    category: "Hero",
    avatar: `${BUCKET_URL}/ruby.jpg`,
  },
  {
    id: "guinevere",
    name: "Guinevere",
    title: "Ms. Violet",
    category: "Hero",
    avatar: `${BUCKET_URL}/guinevere.jpg`,
  },
  {
    id: "gusion",
    name: "Gusion",
    title: "Holy Blade",
    category: "Hero",
    avatar: `${BUCKET_URL}/gusion.jpg`,
  },
  {
    id: "valir",
    name: "Valir",
    title: "Son of Flames",
    category: "Hero",
    avatar: `${BUCKET_URL}/valir.jpg`,
  },
  {
    id: "lancelot",
    name: "Lancelot",
    title: "Blade of Roses",
    category: "Hero",
    avatar: `${BUCKET_URL}/lancelot.jpg`,
  },
  {
    id: "layla",
    name: "Layla",
    title: "Energy Gunner",
    category: "Hero",
    avatar: `${BUCKET_URL}/layla.jpg`,
  },
  {
    id: "zilong",
    name: "Zilong",
    title: "Spear of the Dragon",
    category: "Hero",
    avatar: `${BUCKET_URL}/zilong.jpg`,
  },
  {
    id: "moskov",
    name: "Moskov",
    title: "Spear of Quiescence",
    category: "Hero",
    avatar: `${BUCKET_URL}/moskov.jpg`,
  },
  {
    id: "angela",
    name: "Angela",
    title: "Bunnylove",
    category: "Hero",
    avatar: `${BUCKET_URL}/angela.jpg`,
  },
  {
    id: "nana",
    name: "Nana",
    title: "Sweet Leonin",
    category: "Hero",
    avatar: `${BUCKET_URL}/nana.jpg`,
  },
  {
    id: "franco",
    name: "Franco",
    title: "Frozen Warrior",
    category: "Hero",
    avatar: `${BUCKET_URL}/franco.jpg`,
  },
  {
    id: "luke",
    name: "Luke (Lukas)",
    title: "Shadow Hunter",
    category: "Hero",
    avatar: `${BUCKET_URL}/luke.jpg`,
  },

  // ==========================================
  // 2. CLASSIC LITTLE COMMANDERS
  // ==========================================
  {
    id: "tharz",
    name: "Tharz",
    title: "Gourmand Demon",
    category: "Classic",
    avatar: `${BUCKET_URL}/tharz.jpg`,
  },
  {
    id: "yuki",
    name: "Yuki",
    title: "Snow Witch",
    category: "Classic",
    avatar: `${BUCKET_URL}/yuki.jpg`,
  },
  {
    id: "eva",
    name: "Eva",
    title: "Mysterious Deer",
    category: "Classic",
    avatar: `${BUCKET_URL}/eva.jpg`,
  },
  {
    id: "buss",
    name: "Buss",
    title: "Meowgician",
    category: "Classic",
    avatar: `${BUCKET_URL}/buss.jpg`,
  },
  {
    id: "connie",
    name: "Connie",
    title: "Star Catcher",
    category: "Classic",
    avatar: `${BUCKET_URL}/connie.jpg`,
  },
  {
    id: "dubi",
    name: "Dubi",
    title: "Jolly Sprite",
    category: "Classic",
    avatar: `${BUCKET_URL}/dubi.jpg`,
  },
  {
    id: "pao",
    name: "Pao",
    title: "Naughty Dragonling",
    category: "Classic",
    avatar: `${BUCKET_URL}/pao.jpg`,
  },
  {
    id: "rya",
    name: "Rya",
    title: "Sleeping Bud",
    category: "Classic",
    avatar: `${BUCKET_URL}/rya.jpg`,
  },
  {
    id: "saki",
    name: "Saki",
    title: "Flora Butterfly",
    category: "Classic",
    avatar: `${BUCKET_URL}/saki.jpg`,
  },
  {
    id: "remy",
    name: "Remy",
    title: "Swordsman Remy",
    category: "Classic",
    avatar: `${BUCKET_URL}/remy.jpg`,
  },
  {
    id: "eggie",
    name: "Eggie",
    title: "Naughty Eggie",
    category: "Classic",
    avatar: `${BUCKET_URL}/eggie.jpg`,
  },
  {
    id: "asta",
    name: "Asta",
    title: "Astral Mage",
    category: "Classic",
    avatar: `${BUCKET_URL}/asta.jpg`,
  },
  {
    id: "austus",
    name: "Austus",
    title: "Shadow Judgement",
    category: "Classic",
    avatar: `${BUCKET_URL}/austus.jpg`,
  },
  {
    id: "bersi",
    name: "Bersi",
    title: "Death's Maw",
    category: "Classic",
    avatar: `${BUCKET_URL}/bersi.jpg`,
  },
  {
    id: "brown",
    name: "Brown",
    title: "Master Forger",
    category: "Classic",
    avatar: `${BUCKET_URL}/brown.jpg`,
  },
  {
    id: "kaboom",
    name: "Kaboom",
    title: "Ultra Guardian",
    category: "Classic",
    avatar: `${BUCKET_URL}/kaboom.jpg`,
  },
  {
    id: "mavis",
    name: "Mavis",
    title: "Vampire Countess",
    category: "Classic",
    avatar: `${BUCKET_URL}/mavis.jpg`,
  },
  {
    id: "abe",
    name: "Abe",
    title: "Kungfu Expert",
    category: "Classic",
    avatar: `${BUCKET_URL}/abe.jpg`,
  },
  {
    id: "benny",
    name: "Benny",
    title: "Panther Warrior",
    category: "Classic",
    avatar: `${BUCKET_URL}/benny.jpg`,
  },
  {
    id: "harper",
    name: "Harper",
    title: "Commander Harper",
    category: "Classic",
    avatar: `${BUCKET_URL}/harper.jpg`,
  },
  {
    id: "ragnar",
    name: "Ragnar",
    title: "Axeman Ragnar",
    category: "Classic",
    avatar: `${BUCKET_URL}/ragnar.jpg`,
  },
];

export function findCommander(query: string): Commander | undefined {
  if (!query) return undefined;
  const clean = query.trim().toLowerCase();
  return MCGG_COMMANDERS.find(
    (c) => c.id === clean || c.name.toLowerCase() === clean,
  );
}
