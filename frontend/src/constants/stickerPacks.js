// WhatsApp-Style Production Sticker Packs & Search Engine
// 100% Transparent HD Graphics (Zero broken external CDNs, Local SVGs + Microsoft Fluent 3D Assets)

export const STICKER_PACKS = [
  { id: "recents", name: "Recents", icon: "Clock", isSpecial: true },
  { id: "favorites", name: "Favorites", icon: "Star", isSpecial: true },
  {
    id: "memes",
    name: "Viral Memes",
    icon: "Smile",
    avatar: "/stickers/popcat.svg",
  },
  {
    id: "fluent_3d",
    name: "3D Reactions",
    icon: "Sparkles",
    avatar:
      "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Party%20popper/3D/party_popper_3d.png",
  },
  {
    id: "expressions",
    name: "Faces & Moods",
    icon: "Laugh",
    avatar:
      "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Rolling%20on%20the%20floor%20laughing/3D/rolling_on_the_floor_laughing_3d.png",
  },
  {
    id: "cats_pets",
    name: "Cute Cats & Pets",
    icon: "Cat",
    avatar:
      "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Cat%20face/3D/cat_face_3d.png",
  },
  {
    id: "love",
    name: "Hearts & Love",
    icon: "Heart",
    avatar:
      "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Heart%20with%20ribbon/3D/heart_with_ribbon_3d.png",
  },
];

export const CURATED_STICKERS = [
  // =======================================================
  // --- Pack 1: Viral Memes (Guaranteed Local SVGs) ---
  // =======================================================
  {
    id: "meme-popcat",
    packId: "memes",
    name: "Pop Cat",
    tags: ["popcat", "cat", "meme", "mouth", "pop", "open", "cute"],
    url: "/stickers/popcat.svg",
    favorite: true,
  },
  {
    id: "meme-pepe-cool",
    packId: "memes",
    name: "Cool Pepe",
    tags: ["pepe", "cool", "sunglasses", "swag", "deal with it", "frog", "meme"],
    url: "/stickers/pepe-cool.svg",
    favorite: true,
  },
  {
    id: "meme-crying-cat",
    packId: "memes",
    name: "Crying Cat Thumbs Up",
    tags: ["crying", "cat", "thumbs up", "sad", "pain", "ok", "meme", "tears"],
    url: "/stickers/crying-cat.svg",
    favorite: true,
  },
  {
    id: "meme-doge",
    packId: "memes",
    name: "Doge Shiba",
    tags: ["doge", "shiba", "dog", "wow", "much happy", "meme"],
    url: "/stickers/doge.svg",
    favorite: true,
  },
  {
    id: "meme-anya-smug",
    packId: "memes",
    name: "Anya Smug Heh",
    tags: ["anya", "spy x family", "heh", "smug", "anime", "smile", "meme"],
    url: "/stickers/anya-smug.svg",
    favorite: true,
  },
  {
    id: "meme-mochi-cat",
    packId: "memes",
    name: "Mochi Peach Cat",
    tags: ["mochi", "peach", "cat", "happy", "cute", "sparkle"],
    url: "/stickers/mochi-cat.svg",
  },
  {
    id: "meme-milk-mocha",
    packId: "memes",
    name: "Milk & Mocha Hug",
    tags: ["milk", "mocha", "hug", "love", "bears", "cuddle"],
    url: "/stickers/milk-mocha.svg",
  },
  {
    id: "meme-gigachad",
    packId: "memes",
    name: "Gigachad Sigma",
    tags: ["gigachad", "chad", "sigma", "jawline", "meme", "buff", "male"],
    url: "/stickers/gigachad.svg",
  },
  {
    id: "meme-capybara",
    packId: "memes",
    name: "Chill Capybara",
    tags: ["capybara", "chill", "orange", "relax", "ok i pull up", "meme"],
    url: "/stickers/capybara.svg",
  },

  // =======================================================
  // --- Pack 2: 3D Reactions & Gestures (Fluent HD) ---
  // =======================================================
  {
    id: "fluent-party-popper",
    packId: "fluent_3d",
    name: "Party Popper",
    tags: ["party", "popper", "confetti", "celebrate", "yay", "congrats"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Party%20popper/3D/party_popper_3d.png",
    favorite: true,
  },
  {
    id: "fluent-heart-fire",
    packId: "fluent_3d",
    name: "Heart on Fire",
    tags: ["heart", "fire", "passion", "flame", "love", "hot"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Heart%20on%20fire/3D/heart_on_fire_3d.png",
    favorite: true,
  },
  {
    id: "fluent-fire",
    packId: "fluent_3d",
    name: "Fire Flame",
    tags: ["fire", "flame", "hot", "lit", "burn", "trending"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Fire/3D/fire_3d.png",
  },
  {
    id: "fluent-thumbs-up",
    packId: "fluent_3d",
    name: "Thumbs Up",
    tags: ["thumbs up", "like", "good", "approved", "ok", "yes"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Thumbs%20up/Default/3D/thumbs_up_3d_default.png",
    favorite: true,
  },
  {
    id: "fluent-clapping-hands",
    packId: "fluent_3d",
    name: "Clapping Applause",
    tags: ["clapping", "hands", "applause", "bravo", "respect", "great"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Clapping%20hands/Default/3D/clapping_hands_3d_default.png",
  },
  {
    id: "fluent-victory-hand",
    packId: "fluent_3d",
    name: "Victory Peace",
    tags: ["victory", "peace", "two", "hand", "v", "win"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Victory%20hand/Default/3D/victory_hand_3d_default.png",
  },
  {
    id: "fluent-ok-hand",
    packId: "fluent_3d",
    name: "OK Hand",
    tags: ["ok", "perfect", "nice", "good", "hand", "zero"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Ok%20hand/Default/3D/ok_hand_3d_default.png",
  },
  {
    id: "fluent-folded-hands",
    packId: "fluent_3d",
    name: "Folded Hands Pray",
    tags: ["folded", "hands", "pray", "please", "thanks", "namaste", "hope"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Folded%20hands/Default/3D/folded_hands_3d_default.png",
  },
  {
    id: "fluent-hundred-points",
    packId: "fluent_3d",
    name: "100 Points",
    tags: ["100", "hundred", "score", "perfect", "full", "points"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Hundred%20points/3D/hundred_points_3d.png",
  },
  {
    id: "fluent-rocket",
    packId: "fluent_3d",
    name: "Rocket Launch",
    tags: ["rocket", "launch", "space", "fast", "moon", "up"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Rocket/3D/rocket_3d.png",
  },
  {
    id: "fluent-birthday-cake",
    packId: "fluent_3d",
    name: "Birthday Cake",
    tags: ["birthday", "cake", "candles", "celebrate", "party"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Birthday%20cake/3D/birthday_cake_3d.png",
  },
  {
    id: "fluent-collision-boom",
    packId: "fluent_3d",
    name: "Boom Explosion",
    tags: ["collision", "boom", "explosion", "bang", "pow", "hit"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Collision/3D/collision_3d.png",
  },

  // =======================================================
  // --- Pack 3: Faces & Moods (Fluent HD) ---
  // =======================================================
  {
    id: "fluent-rofl",
    packId: "expressions",
    name: "ROFL Laughing",
    tags: ["rofl", "laugh", "lol", "funny", "rolling", "haha"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Rolling%20on%20the%20floor%20laughing/3D/rolling_on_the_floor_laughing_3d.png",
    favorite: true,
  },
  {
    id: "fluent-tears-of-joy",
    packId: "expressions",
    name: "Tears of Joy",
    tags: ["laugh", "crying", "joy", "tears", "lol", "happy"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Face%20with%20tears%20of%20joy/3D/face_with_tears_of_joy_3d.png",
  },
  {
    id: "fluent-sunglasses-cool",
    packId: "expressions",
    name: "Cool Sunglasses",
    tags: ["cool", "sunglasses", "swag", "chill", "awesome"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Smiling%20face%20with%20sunglasses/3D/smiling_face_with_sunglasses_3d.png",
    favorite: true,
  },
  {
    id: "fluent-heart-eyes",
    packId: "expressions",
    name: "Heart Eyes",
    tags: ["heart", "eyes", "love", "crush", "in love", "beautiful"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Smiling%20face%20with%20heart-eyes/3D/smiling_face_with_heart-eyes_3d.png",
  },
  {
    id: "fluent-star-struck",
    packId: "expressions",
    name: "Star Struck",
    tags: ["star", "struck", "wow", "amazing", "excited", "fan"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Star-struck/3D/star-struck_3d.png",
  },
  {
    id: "fluent-mind-blown",
    packId: "expressions",
    name: "Mind Blown",
    tags: ["mind blown", "exploding", "head", "shocked", "omg", "boom"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Exploding%20head/3D/exploding_head_3d.png",
  },
  {
    id: "fluent-partying-face",
    packId: "expressions",
    name: "Partying Face",
    tags: ["party", "horn", "celebrate", "birthday", "fun"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Partying%20face/3D/partying_face_3d.png",
  },
  {
    id: "fluent-melting-face",
    packId: "expressions",
    name: "Melting Face",
    tags: ["melting", "hot", "sarcastic", "shame", "heat", "disappear"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Melting%20face/3D/melting_face_3d.png",
  },
  {
    id: "fluent-saluting-face",
    packId: "expressions",
    name: "Saluting Face",
    tags: ["salute", "respect", "yes sir", "captain", "duty"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Saluting%20face/Default/3D/saluting_face_3d_default.png",
  },
  {
    id: "fluent-zany-face",
    packId: "expressions",
    name: "Zany Crazy Tongue",
    tags: ["zany", "crazy", "tongue", "wild", "silly", "goofy"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Zany%20face/3D/zany_face_3d.png",
  },
  {
    id: "fluent-enraged-face",
    packId: "expressions",
    name: "Enraged Red Anger",
    tags: ["enraged", "angry", "mad", "furious", "red"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Enraged%20face/3D/enraged_face_3d.png",
  },
  {
    id: "fluent-skull",
    packId: "expressions",
    name: "Skull Dead",
    tags: ["skull", "dead", "i'm dead", "skeleton", "rip", "funny"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Skull/3D/skull_3d.png",
  },
  {
    id: "fluent-ghost",
    packId: "expressions",
    name: "Ghost Spooky",
    tags: ["ghost", "spooky", "boo", "halloween", "scary", "fun"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Ghost/3D/ghost_3d.png",
  },
  {
    id: "fluent-poop",
    packId: "expressions",
    name: "Pile of Poo",
    tags: ["poop", "poo", "funny", "crap", "smile"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Pile%20of%20poo/3D/pile_of_poo_3d.png",
  },

  // =======================================================
  // --- Pack 4: Cute Cats & Pets (Fluent HD) ---
  // =======================================================
  {
    id: "cat-face-base",
    packId: "cats_pets",
    name: "Cute Cat Face",
    tags: ["cat", "kitty", "cute", "pet", "meow"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Cat%20face/3D/cat_face_3d.png",
    favorite: true,
  },
  {
    id: "cat-grinning",
    packId: "cats_pets",
    name: "Grinning Cat",
    tags: ["cat", "grin", "smile", "happy", "meow"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Grinning%20cat/3D/grinning_cat_3d.png",
  },
  {
    id: "cat-tears-joy",
    packId: "cats_pets",
    name: "Cat Laughing Tears",
    tags: ["cat", "laugh", "tears", "joy", "lol"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Cat%20with%20tears%20of%20joy/3D/cat_with_tears_of_joy_3d.png",
  },
  {
    id: "cat-heart-eyes",
    packId: "cats_pets",
    name: "Cat Heart Eyes",
    tags: ["cat", "heart", "eyes", "love", "crush"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Smiling%20cat%20with%20heart-eyes/3D/smiling_cat_with_heart-eyes_3d.png",
  },
  {
    id: "cat-wry-smile",
    packId: "cats_pets",
    name: "Cat Wry Smug",
    tags: ["cat", "smug", "wry", "heh", "cunning"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Cat%20with%20wry%20smile/3D/cat_with_wry_smile_3d.png",
  },
  {
    id: "cat-kissing",
    packId: "cats_pets",
    name: "Kissing Cat",
    tags: ["cat", "kiss", "love", "mwah", "smooch"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Kissing%20cat/3D/kissing_cat_3d.png",
  },
  {
    id: "cat-crying",
    packId: "cats_pets",
    name: "Crying Cat",
    tags: ["cat", "cry", "sad", "tears", "pain"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crying%20cat/3D/crying_cat_3d.png",
  },
  {
    id: "cat-pouting",
    packId: "cats_pets",
    name: "Pouting Mad Cat",
    tags: ["cat", "pout", "mad", "angry", "grumpy"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Pouting%20cat/3D/pouting_cat_3d.png",
  },
  {
    id: "pet-teddy-bear",
    packId: "cats_pets",
    name: "Teddy Bear",
    tags: ["teddy", "bear", "cute", "toy", "cuddle"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Teddy%20bear/3D/teddy_bear_3d.png",
  },
  {
    id: "pet-dog-face",
    packId: "cats_pets",
    name: "Dog Face Puppy",
    tags: ["dog", "puppy", "woof", "pet", "cute"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Dog%20face/3D/dog_face_3d.png",
  },
  {
    id: "pet-panda",
    packId: "cats_pets",
    name: "Panda Bear",
    tags: ["panda", "bear", "bamboo", "cute", "animal"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Panda/3D/panda_3d.png",
  },
  {
    id: "pet-hamster",
    packId: "cats_pets",
    name: "Hamster Cheeks",
    tags: ["hamster", "rodent", "cute", "cheeks", "pet"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Hamster/3D/hamster_3d.png",
  },
  {
    id: "pet-rabbit",
    packId: "cats_pets",
    name: "Bunny Rabbit",
    tags: ["rabbit", "bunny", "ears", "cute", "hop"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Rabbit%20face/3D/rabbit_face_3d.png",
  },

  // =======================================================
  // --- Pack 5: Hearts & Love (Fluent HD) ---
  // =======================================================
  {
    id: "love-red-heart",
    packId: "love",
    name: "Red Heart",
    tags: ["heart", "red", "love", "like", "care"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Red%20heart/3D/red_heart_3d.png",
    favorite: true,
  },
  {
    id: "love-heart-ribbon",
    packId: "love",
    name: "Heart with Ribbon",
    tags: ["heart", "ribbon", "gift", "box", "present", "love"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Heart%20with%20ribbon/3D/heart_with_ribbon_3d.png",
  },
  {
    id: "love-sparkling-heart",
    packId: "love",
    name: "Sparkling Heart",
    tags: ["sparkling", "heart", "shine", "pink", "love", "glitter"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sparkling%20heart/3D/sparkling_heart_3d.png",
  },
  {
    id: "love-growing-heart",
    packId: "love",
    name: "Growing Beating Heart",
    tags: ["growing", "heart", "beat", "pulse", "love"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Growing%20heart/3D/growing_heart_3d.png",
  },
  {
    id: "love-broken-heart",
    packId: "love",
    name: "Broken Heart",
    tags: ["broken", "heart", "sad", "pain", "heartbreak"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Broken%20heart/3D/broken_heart_3d.png",
  },
  {
    id: "love-kiss-mark",
    packId: "love",
    name: "Kiss Mark Lips",
    tags: ["kiss", "mark", "lips", "lipstick", "mwah"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Kiss%20mark/3D/kiss_mark_3d.png",
  },
  {
    id: "love-letter",
    packId: "love",
    name: "Love Letter Envelope",
    tags: ["love", "letter", "envelope", "mail", "heart"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Love%20letter/3D/love_letter_3d.png",
  },
  {
    id: "love-two-hearts",
    packId: "love",
    name: "Two Hearts",
    tags: ["two", "hearts", "couple", "together", "love"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Two%20hearts/3D/two_hearts_3d.png",
  },
  {
    id: "love-sparkles",
    packId: "love",
    name: "Sparkles Stars",
    tags: ["sparkles", "stars", "shine", "magic", "clean"],
    url: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sparkles/3D/sparkles_3d.png",
  },
];

// Live GIPHY Sticker Search Engine (Returns guaranteed transparent web stickers)
const GIPHY_API_KEY = "sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh";

export async function searchLiveStickers(query) {
  if (!query || !query.trim()) return [];
  try {
    const res = await fetch(
      `https://api.giphy.com/v1/stickers/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
        query.trim()
      )}&limit=24&rating=g`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((item) => ({
      id: `giphy-${item.id}`,
      name: item.title || "Sticker",
      url:
        item.images?.fixed_height?.url ||
        item.images?.fixed_width?.url ||
        item.images?.original?.url,
      tags: [query.toLowerCase()],
      isLive: true,
    }));
  } catch (error) {
    console.error("Giphy sticker search error:", error);
    return [];
  }
}
