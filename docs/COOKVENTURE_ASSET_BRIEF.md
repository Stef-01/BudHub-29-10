# Cookventure India: Asset Brief

Artwork for Cookventure India is optional and drops in without code changes. Until a file exists, the app shows the emoji listed below, so assets can arrive one at a time.

## How to deliver

1. Save each file as `assets/cookventure/<category>/<id>.<ext>`, for example `assets/cookventure/regions/south.webp`.
2. Use **WebP** (or SVG for flat icons); PNG also works. Keep each file under 80 KB.
3. Rebuild or restart `npm run dev`. Files are discovered automatically (`services/cookventure/assets.ts`).
4. Filenames must match the ids below exactly: lowercase, underscores, no spaces.

## Style for every asset

- Flat vector illustration with soft shading, matching the app's fruit-illustration style.
- Transparent background, subject centred with about 8% padding, square canvas.
- Warm palette (turmeric yellow, chilli red, curry-leaf green, coconut cream); must look right on white and on light orange (`#fff7ed`).
- **No text or letters** in the image: the app renders English and Hindi labels itself.
- Culturally accurate: real ingredients, traditional vessels and plating for each region. Avoid caricatures and generic "Indian" clichés.
- Consistent light source (top-left) and line weight across a category.

## Regions (6)

- **Canvas:** 512×512
- **Where it appears:** Region picker tiles, shown at 48 px
- **What to draw:** A small scene or emblem for the region: a signature dish, ingredient or landscape. Bold silhouette that reads at 48 px.

| File | Name | Subject | Fallback |
|---|---|---|---|
| `regions/north.webp` | North India | Garam masala, dairy gravies, tandoor, chaat | 🫓 |
| `regions/south.webp` | South India | Curry leaves, coconut, tamarind, pepper; sambar & rasam | 🥥 |
| `regions/west.webp` | West India | Goda masala; Gujarati meetha undertones | 🌾 |
| `regions/east.webp` | East India | Mustard oil, panch phoron | 🐟 |
| `regions/northeast.webp` | Northeast India | Bamboo shoot, herbs; light, fresh heat | 🎋 |
| `regions/deccan.webp` | Deccan/Hyderabadi | Baghara tempering, biryani masalas | 🍛 |

## Subregions (12)

- **Canvas:** 256×256
- **Where it appears:** Sub-region chips, shown at 20 px
- **What to draw:** Icon-like: one simple object (e.g. a coconut palm for Kerala). Must read at 20 px, so no fine detail.

| File | Name | Subject | Fallback |
|---|---|---|---|
| `subregions/kerala.webp` | Kerala | Coconut oil, curry leaves, black pepper; thoran, avial, stews | 🌴 |
| `subregions/chettinad.webp` | Chettinad | Tamil Nadu's fiery pepper-and-fennel kitchens; kara kuzhambu | 🌶️ |
| `subregions/andhra.webp` | Andhra | Gongura (sorrel), fiery chillies and tamarind; pappu & pachadi | 🔥 |
| `subregions/udupi.webp` | Udupi | Karnataka temple cooking: no onion or garlic, coconut, a touch of jaggery | 🛕 |
| `subregions/punjabi.webp` | Punjabi | Dhaba-style dals, chole and sarson; ghee and garam masala | 🧈 |
| `subregions/rajasthani.webp` | Rajasthani | Desert kitchen of dried lentils, ghee and red chilli; dal-baati | 🏜️ |
| `subregions/gujarati.webp` | Gujarati | Khatta-meetha balance: jaggery with lemon or kokum; dal, kadhi, dhokla | 🍋 |
| `subregions/maharashtrian.webp` | Maharashtrian | Goda masala, peanuts and kokum; varan-bhaat, amti, usal | 🌾 |
| `subregions/goan.webp` | Goan | Kokum, coconut and vinegar; xacuti, ambot-tik, sol kadhi | 🏖️ |
| `subregions/bengali.webp` | Bengali | Mustard oil and paste, panch phoron, posto; shukto, cholar dal | 🪷 |
| `subregions/assamese.webp` | Assamese | Light, sour tenga curries in mustard oil; fresh herbs and fierce chillies | 🍵 |
| `subregions/hyderabadi.webp` | Hyderabadi | Baghaar tempering, peanut-sesame-coconut pastes, tamarind | 🕌 |

## Masalas (6)

- **Canvas:** 256×256
- **Where it appears:** Masala cards (32 px) and spice chips (16 px)
- **What to draw:** A small bowl or heap of the blend with one or two of its whole spices beside it. Colour should match the real blend.

| File | Name | Subject | Fallback |
|---|---|---|---|
| `masalas/garam_masala.webp` | Garam Masala | Warming blend for North Indian curries: coriander, cumin, cardamom, cinnamon, cloves, black pepper | 🫙 |
| `masalas/goda_masala.webp` | Goda Masala | Sweet, aromatic Maharashtrian blend: coriander, cumin, sesame, coconut, cinnamon, cloves | 🫙 |
| `masalas/panch_phoron.webp` | Panch Phoron | Five-spice Bengali blend: cumin, fennel, mustard, fenugreek, nigella | 🫙 |
| `masalas/sambar_powder.webp` | Sambar Powder | South Indian lentil stew spice: coriander, cumin, red chili, fenugreek, curry leaves | 🫙 |
| `masalas/rasam_powder.webp` | Rasam Powder | Tangy South Indian soup spice: black pepper, coriander, cumin, red chili, curry leaves | 🫙 |
| `masalas/chaat_masala.webp` | Chaat Masala | Tangy street food seasoning: amchur, black salt, cumin, coriander, ginger | 🫙 |

## Tadkas (4)

- **Canvas:** 512×512
- **Where it appears:** The tadka pan (44 px), tadka cards (36 px) and chips (16 px)
- **What to draw:** Top view of a small round tadka pan with the seeds and aromatics listed, mid-sizzle. Keep the pan the same size and angle across all four.

| File | Name | Subject | Fallback |
|---|---|---|---|
| `tadkas/hing_jeera.webp` | Hing-Jeera | Small tempering pan, top view: cumin, asafoetida sizzling in oil (clean, light, aromatic) | 🌾 |
| `tadkas/lehsun_lal_mirch.webp` | Lehsun-Lal Mirch | Small tempering pan, top view: garlic, dry red chili sizzling in oil (garlicky, smoky, robust) | 🧄🌶️ |
| `tadkas/mustard_curry_leaf.webp` | Mustard-Curry Leaf | Small tempering pan, top view: mustard, curry leaves sizzling in oil (nutty, crackly, South Indian) | 🍃 |
| `tadkas/panch_phoron.webp` | Panch Phoron | Small tempering pan, top view: cumin, fennel, mustard, fenugreek, nigella sizzling in mustard oil (complex, Bengali, toasty) | ⭐ |

## Kits (21)

- **Canvas:** 512×512
- **Where it appears:** Quick-start kit cards, shown at 48 px with rounded corners
- **What to draw:** The finished dish in a bowl or on a plate, three-quarter view, plated the traditional way (e.g. banana leaf for Kerala dishes).

| File | Name | Subject | Fallback |
|---|---|---|---|
| `kits/south_sambar.webp` | Classic Sambar | Tangy lentil stew with vegetables | 🍲 |
| `kits/south_rasam.webp` | Tangy Rasam | Peppery, sour tomato soup | 🍵 |
| `kits/south_coconut_chutney.webp` | Coconut Chutney | Creamy coconut condiment | 🥥 |
| `kits/north_dal_tadka.webp` | Dal Tadka | Tempered yellow lentils | 🍛 |
| `kits/north_chana_masala.webp` | Chana Masala | Spiced chickpea curry | 🫘 |
| `kits/west_varan.webp` | Maharashtrian Varan | Simple, sweet dal | 🍲 |
| `kits/east_shukto.webp` | Bengali Shukto | Bittersweet vegetable medley | 🥬 |
| `kits/northeast_aloo_pitika.webp` | Aloo Pitika | Assamese mash with raw mustard oil | 🥔 |
| `kits/deccan_bagara_baingan.webp` | Bagara Baingan | Hyderabadi eggplant in peanut-tamarind gravy | 🍆 |
| `kits/sub_kerala.webp` | Kerala Coconut-Pepper | Thoran, kootu & stews in coconut oil | 🥥 |
| `kits/sub_chettinad.webp` | Chettinad Kara Kuzhambu | Peppery tamarind-shallot gravy | 🫕 |
| `kits/sub_andhra.webp` | Gongura Pappu | Sour sorrel-leaf dal with garlic tadka | 🌿 |
| `kits/sub_udupi.webp` | Udupi Saaru | Sweet-sour temple-style rasam | 🍵 |
| `kits/sub_punjabi.webp` | Dhaba Rajma | Slow-simmered kidney beans in onion-tomato gravy | 🫘 |
| `kits/sub_rajasthani.webp` | Panchmel Dal | Five-lentil dal finished with ghee | 🍲 |
| `kits/sub_gujarati.webp` | Khatti-Meethi Dal | Sweet-sour Gujarati dal with peanuts | 🥜 |
| `kits/sub_maharashtrian.webp` | Amti | Tangy-sweet dal with goda masala & kokum | 🍛 |
| `kits/sub_goan.webp` | Sol Kadhi | Pink kokum & coconut-milk cooler | 🥛 |
| `kits/sub_bengali.webp` | Cholar Dal | Festive chana dal with coconut & raisins | 🥥 |
| `kits/sub_assamese.webp` | Tomato Tenga | Light, sour tomato curry | 🍅 |
| `kits/sub_hyderabadi.webp` | Mirchi ka Salan | Chillies in a nutty tamarind gravy | 🫑 |

## Playlists (4)

- **Canvas:** 128×128
- **Where it appears:** Playlist chips, shown at 16 px
- **What to draw:** A tiny symbol for the theme (rain cloud, sun, snowflake, flower). Simple and high-contrast.

| File | Name | Subject | Fallback |
|---|---|---|---|
| `playlists/monsoon_comfort.webp` | Monsoon comfort | Hot, peppery and soupy for rainy days | 🌧️ |
| `playlists/summer_coolers.webp` | Summer coolers | Yogurt, buttermilk, cucumber and gentle heat | ☀️ |
| `playlists/winter_warmers.webp` | Winter warmers | Warm spices, slow simmers and hot drinks | ❄️ |
| `playlists/onam_sadya.webp` | Onam sadya | Dishes of Kerala's harvest feast, served on a banana leaf | 🌸 |

**Total: 53 slots.** The admin dashboard's Cookventure tab shows which ones are filled.
