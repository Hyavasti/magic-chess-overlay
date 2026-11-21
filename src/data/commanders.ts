export interface Commander {
  id: string;
  name: string;
  title: string;
  category: "Hero" | "Classic";
  avatar: string;
}

// Local public/commanders directory served directly by Vercel
const BUCKET_URL = "/commanders";

export const MCGG_COMMANDERS: Commander[] = [
  // ==========================================
  // 1. HERO COMMANDERS
  // ==========================================
  {
    id: "chou",
    name: "Chou",
    title: "Kung Fu Boy",
    category: "Hero",
    avatar: `${BUCKET_URL}/chou.png`,
  },
  {
    id: "brody",
    name: "Brody",
    title: "The Lone Star",
    category: "Hero",
    avatar: `${BUCKET_URL}/brody.png`,
  },
  {
    id: "paquito",
    name: "Paquito",
    title: "Fists of light",
    category: "Hero",
    avatar: `${BUCKET_URL}/paquito.png`,
  },
  {
    id: "wanwan",
    name: "Wanwan",
    title: "Agile Tiger",
    category: "Hero",
    avatar: `${BUCKET_URL}/wanwan.png`,
  },
  {
    id: "ling",
    name: "Ling",
    title: "Cyan Finch",
    category: "Hero",
    avatar: `${BUCKET_URL}/ling.png`,
  },
  {
    id: "popolkupa",
    name: "Popol & Kupa",
    title: "Icefield Companions",
    category: "Hero",
    avatar: `${BUCKET_URL}/popolkupa.png`,
  },
  {
    id: "luoyi",
    name: "Luo Yi",
    title: "Yin Yang Geomancer",
    category: "Hero",
    avatar: `${BUCKET_URL}/luoyi.png`,
  },
  {
    id: "fanny",
    name: "Fanny",
    title: "Blade Dancer",
    category: "Hero",
    avatar: `${BUCKET_URL}/fanny.png`,
  },
  {
    id: "kagura",
    name: "Kagura",
    title: "Onmyouji Master",
    category: "Hero",
    avatar: `${BUCKET_URL}/kagura.png`,
  },
  {
    id: "miya",
    name: "Miya",
    title: "Arrow of the Sun",
    category: "Hero",
    avatar: `${BUCKET_URL}/miya.png`,
  },
  {
    id: "aurora",
    name: "Aurora",
    title: "Frozen Queen",
    category: "Hero",
    avatar: `${BUCKET_URL}/aurora.png`,
  },
  {
    id: "freya",
    name: "Freya",
    title: "Valkyrie",
    category: "Hero",
    avatar: `${BUCKET_URL}/freya.png`,
  },
  {
    id: "minotaur",
    name: "Minotaur",
    title: "Son of Minos",
    category: "Hero",
    avatar: `${BUCKET_URL}/minotaur.png`,
  },
  {
    id: "ruby",
    name: "Ruby",
    title: "Little Red Hood",
    category: "Hero",
    avatar: `${BUCKET_URL}/ruby.png`,
  },
  {
    id: "guinevere",
    name: "Guinevere",
    title: "Ms. Violet",
    category: "Hero",
    avatar: `${BUCKET_URL}/guinevere.png`,
  },
  {
    id: "gusion",
    name: "Gusion",
    title: "Holy Blade",
    category: "Hero",
    avatar: `${BUCKET_URL}/gusion.png`,
  },
  {
    id: "valir",
    name: "Valir",
    title: "Son of Flames",
    category: "Hero",
    avatar: `${BUCKET_URL}/valir.png`,
  },
  {
    id: "vale",
    name: "Vale",
    title: "Windtalker",
    category: "Hero",
    avatar: `${BUCKET_URL}/vale.png`,
  },
  {
    id: "lancelot",
    name: "Lancelot",
    title: "Blade of Roses",
    category: "Hero",
    avatar: `${BUCKET_URL}/lancelot.png`,
  },
  {
    id: "layla",
    name: "Layla",
    title: "Energy Gunner",
    category: "Hero",
    avatar: `${BUCKET_URL}/layla.png`,
  },
  {
    id: "zilong",
    name: "Zilong",
    title: "Spear of the Dragon",
    category: "Hero",
    avatar: `${BUCKET_URL}/zilong.png`,
  },
  {
    id: "moskov",
    name: "Moskov",
    title: "Spear of Quiescence",
    category: "Hero",
    avatar: `${BUCKET_URL}/moskov.png`,
  },
  {
    id: "angela",
    name: "Angela",
    title: "Bunnylove",
    category: "Hero",
    avatar: `${BUCKET_URL}/angela.png`,
  },
  {
    id: "nana",
    name: "Nana",
    title: "Sweet Leonin",
    category: "Hero",
    avatar: `${BUCKET_URL}/nana.png`,
  },
  {
    id: "franco",
    name: "Franco",
    title: "Frozen Warrior",
    category: "Hero",
    avatar: `${BUCKET_URL}/franco.png`,
  },
  {
    id: "dyrroth",
    name: "Dyrroth",
    title: "Prince of the Abyss",
    category: "Hero",
    avatar: `${BUCKET_URL}/dyrroth.png`,
  },
  {
    id: "karina",
    name: "Karina",
    title: "SpiderLily",
    category: "Hero",
    avatar: `${BUCKET_URL}/karina.png`,
  },
  {
    id: "lukas",
    name: "Lukas",
    title: "Shadow Hunter",
    category: "Hero",
    avatar: `${BUCKET_URL}/lukas.png`,
  },
  {
    id: "kaleaa",
    name: "Kalea",
    title: "Jolly Sprite",
    category: "Classic",
    avatar: `${BUCKET_URL}/kaleaa.png`,
  },

  // ==========================================
  // 2. CLASSIC LITTLE COMMANDERS
  // ==========================================
  {
    id: "lylia",
    name: "Lylia",
    title: "Gourmand Demon",
    category: "Classic",
    avatar: `${BUCKET_URL}/lylia.png`,
  },
  {
    id: "louyi",
    name: "Louyi",
    title: "Siren Reverie",
    category: "Classic",
    avatar: `${BUCKET_URL}/louyi.png`,
  },
  {
    id: "harley",
    name: "Harley",
    title: "Meowgician",
    category: "Classic",
    avatar: `${BUCKET_URL}/harley.png`,
  },
  {
    id: "vexana",
    name: "Vexana",
    title: "Star Catcher",
    category: "Classic",
    avatar: `${BUCKET_URL}/vexana.png`,
  },
  {
    id: "yuzhong",
    name: "Yuzhong",
    title: "Naughty Dragonling",
    category: "Classic",
    avatar: `${BUCKET_URL}/yuzhong.png`,
  },
  {
    id: "lunox",
    name: "Lunox",
    title: "Sleeping Bud",
    category: "Classic",
    avatar: `${BUCKET_URL}/lunox.png`,
  },
  {
    id: "diggie",
    name: "Diggie",
    title: "Naughty Eggie",
    category: "Classic",
    avatar: `${BUCKET_URL}/diggie.png`,
  },
  {
    id: "cyclops",
    name: "Cyclops",
    title: "Clover Charm",
    category: "Classic",
    avatar: `${BUCKET_URL}/cyclops.png`,
  },
  {
    id: "aamon",
    name: "Aamon",
    title: "Shadow Judgement",
    category: "Classic",
    avatar: `${BUCKET_URL}/aamon.png`,
  },
  {
    id: "johnson",
    name: "Johnson",
    title: "Ultra Guardian",
    category: "Classic",
    avatar: `${BUCKET_URL}/johnson.png`,
  },
  {
    id: "alice",
    name: "Alice",
    title: "Vampire Countess",
    category: "Classic",
    avatar: `${BUCKET_URL}/alice.png`,
  },
  {
    id: "alucard",
    name: "Alucard",
    title: "Commander Alucard",
    category: "Classic",
    avatar: `${BUCKET_URL}/alucard.png`,
  },
];

export function findCommander(query: string): Commander | undefined {
  if (!query) return undefined;
  const clean = query.trim().toLowerCase();
  return MCGG_COMMANDERS.find(
    (c) => c.id === clean || c.name.toLowerCase() === clean,
  );
}