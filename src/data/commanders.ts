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
    id: "brody",
    name: "Brody",
    title: "The Lone Star",
    category: "Hero",
    avatar: `${BUCKET_URL}/brody.jpg`,
  },
  {
    id: "paquito",
    name: "Paquito",
    title: "Fists of light",
    category: "Hero",
    avatar: `${BUCKET_URL}/paquito.jpg`,
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
    id: "miya",
    name: "Miya",
    title: "Arrow of the Sun",
    category: "Hero",
    avatar: `${BUCKET_URL}/miya.jpg`,
  },
      {
    id: "aurora",
    name: "Aurora",
    title: "Frozen Queen",
    category: "Hero",
    avatar: `${BUCKET_URL}/aurora.jpg`,
  },
     {
    id: "freya",
    name: "Freya",
    title: "Valkyrie",
    category: "Hero",
    avatar: `${BUCKET_URL}/freya.jpg`,
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
    id: "vale",
    name: "Vale",
    title: "Windtalker",
    category: "Hero",
    avatar: `${BUCKET_URL}/vale.jpg`,
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
    id: "dyrroth",
    name: "Dyrroth",
    title: "Prince of the Abyss",
    category: "Hero",
    avatar: `${BUCKET_URL}/dyrroth.jpg`,
  },
   {
    id: "karina",
    name: "Karina",
    title: "SpiderLily",
    category: "Hero",
    avatar: `${BUCKET_URL}/karina.jpg`,
  },
  {
    id: "lukas",
    name: "Lukas",
    title: "Shadow Hunter",
    category: "Hero",
    avatar: `${BUCKET_URL}/lukas.jpg`,
  },
    {
    id: "kaleaa",
    name: "Kalea",
    title: "Jolly Sprite",
    category: "Classic",
    avatar: `${BUCKET_URL}/kaleaa.jpg`,
  },

  // ==========================================
  // 2. CLASSIC LITTLE COMMANDERS
  // ==========================================
  {
    id: "lylia",
    name: "Lylia",
    title: "Gourmand Demon",
    category: "Classic",
    avatar: `${BUCKET_URL}/lylia.jpg`,
  },
  {
    id: "louyi",
    name: "Louyi",
    title: "Siren Reverie",
    category: "Classic",
    avatar: `${BUCKET_URL}/louyi.jpg`,
  },
  {
    id: "harley",
    name: "Harley",
    title: "Meowgician",
    category: "Classic",
    avatar: `${BUCKET_URL}/harley.jpg`,
  },
  {
    id: "vexana",
    name: "Vexana",
    title: "Star Catcher",
    category: "Classic",
    avatar: `${BUCKET_URL}/vexana.jpg`,
  },
  {
    id: "yuzhong",
    name: "Yuzhong",
    title: "Naughty Dragonling",
    category: "Classic",
    avatar: `${BUCKET_URL}/yuzhong.jpg`,
  },
  {
    id: "lunox",
    name: "Lunox",
    title: "Sleeping Bud",
    category: "Classic",
    avatar: `${BUCKET_URL}/lunox.jpg`,
  },
  {
    id: "diggie",
    name: "Diggie",
    title: "Naughty Eggie",
    category: "Classic",
    avatar: `${BUCKET_URL}/diggie.jpg`,
  },
  {
    id: "cyclops",
    name: "Cyclops",
    title: "Clover Charm",
    category: "Classic",
    avatar: `${BUCKET_URL}/cyclops.jpg`,
  },
  {
    id: "aamon",
    name: "Aamon",
    title: "Shadow Judgement",
    category: "Classic",
    avatar: `${BUCKET_URL}/aamon.jpg`,
  },
  {
    id: "johnson",
    name: "Johnson",
    title: "Ultra Guardian",
    category: "Classic",
    avatar: `${BUCKET_URL}/johnson.jpg`,
  },
  {
    id: "alice",
    name: "Alice",
    title: "Vampire Countess",
    category: "Classic",
    avatar: `${BUCKET_URL}/alice.jpg`,
  },
  {
    id: "alucard",
    name: "Alucard",
    title: "Commander Alucard",
    category: "Classic",
    avatar: `${BUCKET_URL}/alucard.jpg`,
  },
];

export function findCommander(query: string): Commander | undefined {
  if (!query) return undefined;
  const clean = query.trim().toLowerCase();
  return MCGG_COMMANDERS.find(
    (c) => c.id === clean || c.name.toLowerCase() === clean,
  );
}
