# Cookventure India - Implementation Plan

## Overview
A regional Indian recipe discovery game that uses cultural intelligence to match users with authentic recipes based on region, pantry, and flavor preferences. 100% deterministic (no AI), fully interoperable with existing recipe schema.

---

## Core Innovation: The Indian Flavor System

Traditional "spiciness" split into authentic Indian taste dimensions:

- **Teekha (तीखा)** - Chili heat (0-3)
- **Masaledar (मसालेदार)** - Aromatic complexity from spices (0-3)
- **Khata (खट्टा)** - Tanginess (tamarind, kokum, amchur, yogurt) (0-3)
- **Meetha (मीठा)** - Sweetness (jaggery, caramelization) (0-3)

Maps to Ayurveda's six tastes while being practical for home cooks.

---

## Architecture

### 1. Data Layer

#### A. Recipe Schema Extensions (front-matter)

```yaml
# New optional fields
region_tags: ["South India", "Kerala"]
masala_profiles: ["sambar_powder", "rasam_powder"]
tadka_profiles: ["mustard_curry_leaf", "hing_jeera"]
taste_axes:
  heat: 2      # Teekha (0-3)
  masala: 2    # Masaledar (0-3)
  tangy: 1     # Khata (0-3)
  sweet: 0     # Meetha (0-3)
```

**Fallback:** If recipe lacks fields, infer from ingredients:
- curry leaf + mustard → `mustard_curry_leaf` tadka
- tamarind/kokum/amchur → higher `tangy`
- jaggery/dates → higher `sweet`

#### B. Taxonomy Files (JSON)

**File: `/data/cookventure/regions.json`**
```json
{
  "north": {
    "name": "North India",
    "states": ["Punjab", "Delhi", "Haryana", "UP", "Rajasthan"],
    "staple_packs": ["wheat", "dairy", "chickpea", "onion", "tomato", "ginger", "garlic"],
    "default_masalas": ["garam_masala", "chaat_masala"],
    "default_tadka": ["hing_jeera", "lehsun_lal_mirch"],
    "default_taste": { "heat": 2, "masala": 2, "tangy": 1, "sweet": 0 },
    "notes": "Garam masala, dairy gravies, tandoor, chaat",
    "emoji": "🫓"
  },
  "south": {
    "name": "South India",
    "states": ["Tamil Nadu", "Kerala", "Karnataka", "Andhra", "Telangana"],
    "staple_packs": ["rice", "coconut", "curry_leaves", "tamarind", "mustard_seeds", "urad_dal", "chana_dal"],
    "default_masalas": ["sambar_powder", "rasam_powder"],
    "default_tadka": ["mustard_curry_leaf"],
    "default_taste": { "heat": 2, "masala": 2, "tangy": 2, "sweet": 1 },
    "notes": "Curry leaves, coconut, tamarind, pepper; sambar & rasam",
    "emoji": "🥥"
  },
  "west": {
    "name": "West India",
    "states": ["Maharashtra", "Gujarat", "Goa"],
    "staple_packs": ["rice", "wheat", "coconut", "peanuts", "jaggery"],
    "default_masalas": ["goda_masala"],
    "default_tadka": ["hing_jeera"],
    "default_taste": { "heat": 1, "masala": 2, "tangy": 1, "sweet": 1 },
    "notes": "Goda masala; Gujarati meetha undertones",
    "emoji": "🌾"
  },
  "east": {
    "name": "East India",
    "states": ["West Bengal", "Odisha", "Bihar", "Jharkhand"],
    "staple_packs": ["rice", "mustard_oil", "mustard_seeds", "poppy_seeds", "fish"],
    "default_masalas": ["panch_phoron"],
    "default_tadka": ["panch_phoron"],
    "default_taste": { "heat": 1, "masala": 2, "tangy": 1, "sweet": 1 },
    "notes": "Mustard oil, panch phoron",
    "emoji": "🐟"
  },
  "northeast": {
    "name": "Northeast India",
    "states": ["Assam", "Meghalaya", "Manipur", "Nagaland", "Mizoram", "Tripura", "Arunachal", "Sikkim"],
    "staple_packs": ["rice", "bamboo_shoot", "fermented_fish", "herbs", "ginger", "chili"],
    "default_masalas": [],
    "default_tadka": ["hing_jeera"],
    "default_taste": { "heat": 2, "masala": 1, "tangy": 1, "sweet": 0 },
    "notes": "Bamboo shoot, herbs; light, fresh heat",
    "emoji": "🎋"
  },
  "deccan": {
    "name": "Deccan/Hyderabadi",
    "states": ["Telangana", "parts of Karnataka & Maharashtra"],
    "staple_packs": ["rice", "peanuts", "coconut", "tamarind", "curry_leaves"],
    "default_masalas": ["garam_masala"],
    "default_tadka": ["mustard_curry_leaf"],
    "default_taste": { "heat": 2, "masala": 3, "tangy": 1, "sweet": 0 },
    "notes": "Baghara tempering, biryani masalas",
    "emoji": "🍛"
  }
}
```

**File: `/data/cookventure/masalas.json`**
```json
{
  "garam_masala": {
    "name": "Garam Masala",
    "name_hi": "गरम मसाला",
    "region_hint": ["north"],
    "spices": ["coriander", "cumin", "cardamom", "cinnamon", "cloves", "black_pepper"],
    "aroma": ["warm", "sweet-spice"],
    "description": "Warming blend for North Indian curries",
    "refs": ["https://en.wikipedia.org/wiki/Garam_masala"]
  },
  "goda_masala": {
    "name": "Goda Masala",
    "name_hi": "गोडा मसाला",
    "region_hint": ["west", "maharashtra"],
    "spices": ["coriander", "cumin", "sesame", "coconut", "cinnamon", "cloves"],
    "aroma": ["sweet-aromatic", "toasty"],
    "description": "Sweet, aromatic Maharashtrian blend",
    "refs": ["https://www.vegrecipesofindia.com/goda-masala/", "https://twosleevers.com/goda-masala/"]
  },
  "panch_phoron": {
    "name": "Panch Phoron",
    "name_hi": "पंच फोरन",
    "region_hint": ["east", "bengal", "odisha"],
    "spices": ["cumin", "fennel", "mustard", "fenugreek", "nigella"],
    "aroma": ["toasty", "seeded", "complex"],
    "description": "Five-spice Bengali blend",
    "refs": ["https://www.daringgourmet.com/panch-phoron/"]
  },
  "sambar_powder": {
    "name": "Sambar Powder",
    "name_hi": "सांबर पाउडर",
    "region_hint": ["south"],
    "spices": ["coriander", "cumin", "red_chili", "fenugreek", "curry_leaves"],
    "aroma": ["curry-leaf", "lentil-toasty"],
    "description": "South Indian lentil stew spice",
    "refs": []
  },
  "rasam_powder": {
    "name": "Rasam Powder",
    "name_hi": "रसम पाउडर",
    "region_hint": ["south"],
    "spices": ["black_pepper", "coriander", "cumin", "red_chili", "curry_leaves"],
    "aroma": ["pepper", "sour-tomato"],
    "description": "Tangy South Indian soup spice",
    "refs": []
  },
  "chaat_masala": {
    "name": "Chaat Masala",
    "name_hi": "चाट मसाला",
    "region_hint": ["north"],
    "spices": ["amchur", "black_salt", "cumin", "coriander", "ginger"],
    "aroma": ["tangy", "salty", "fruity"],
    "description": "Tangy street food seasoning",
    "refs": []
  }
}
```

**File: `/data/cookventure/tadka.json`**
```json
{
  "hing_jeera": {
    "name": "Hing-Jeera",
    "name_hi": "हींग-जीरा",
    "seeds": ["cumin"],
    "aromatics": ["asafoetida"],
    "oil": "any",
    "aroma": "clean, light, aromatic",
    "heat": 1,
    "region_fit": ["north", "west"],
    "emoji": "🌾"
  },
  "lehsun_lal_mirch": {
    "name": "Lehsun-Lal Mirch",
    "name_hi": "लहसुन-लाल मिर्च",
    "seeds": [],
    "aromatics": ["garlic", "dry_red_chili"],
    "oil": "any",
    "aroma": "garlicky, smoky, robust",
    "heat": 2,
    "region_fit": ["north", "deccan"],
    "emoji": "🧄🌶️"
  },
  "mustard_curry_leaf": {
    "name": "Mustard-Curry Leaf",
    "name_hi": "राई-करी पत्ता",
    "seeds": ["mustard"],
    "aromatics": ["curry_leaves"],
    "oil": "any",
    "aroma": "nutty, crackly, South Indian",
    "heat": 2,
    "region_fit": ["south", "deccan"],
    "emoji": "🍃"
  },
  "panch_phoron": {
    "name": "Panch Phoron",
    "name_hi": "पंच फोरन",
    "seeds": ["cumin", "fennel", "mustard", "fenugreek", "nigella"],
    "aromatics": [],
    "oil": "mustard",
    "aroma": "complex, Bengali, toasty",
    "heat": 1,
    "region_fit": ["east"],
    "emoji": "⭐"
  }
}
```

**File: `/data/cookventure/souring_map.json`**
```json
{
  "tamarind": { "khata_boost": 2, "notes": "South staple" },
  "kokum": { "khata_boost": 2, "notes": "West/Konkan sour" },
  "amchur": { "khata_boost": 2, "notes": "Mango powder, North" },
  "lemon": { "khata_boost": 1, "notes": "Universal" },
  "lime": { "khata_boost": 1, "notes": "Universal" },
  "yogurt": { "khata_boost": 1, "notes": "Cooling tang" },
  "tomato": { "khata_boost": 1, "notes": "Mild acidity" }
}
```

**File: `/data/cookventure/sweeteners_map.json`**
```json
{
  "jaggery": {
    "meetha_boost": 2,
    "diabetic_friendly": false,
    "notes": "Unrefined cane sugar, mineral-rich"
  },
  "sugar": {
    "meetha_boost": 2,
    "diabetic_friendly": false,
    "notes": "Refined sweetener"
  },
  "dates": {
    "meetha_boost": 1,
    "diabetic_friendly": false,
    "notes": "Natural fruit sugar"
  },
  "caramelised_onion": {
    "meetha_boost": 1,
    "diabetic_friendly": true,
    "notes": "Perceived sweetness"
  },
  "roasted_pumpkin": {
    "meetha_boost": 1,
    "diabetic_friendly": true,
    "notes": "Natural vegetable sweetness"
  },
  "coconut": {
    "meetha_boost": 1,
    "diabetic_friendly": true,
    "notes": "Mild natural sweetness (watch sat fat)"
  },
  "cinnamon": {
    "meetha_boost": 1,
    "diabetic_friendly": true,
    "notes": "Warm spice gives perceived sweetness"
  }
}
```

---

### 2. Component Architecture

```
/components
  /cookventure
    CookventureIndiaTab.tsx          # Main container
    /survey
      RegionPicker.tsx                # Step 1: Region selection
      TimeCoursePicker.tsx            # Step 2: Time & course
      PantryBingo.tsx                 # Step 3: Ingredients
      FlavorDials.tsx                 # Step 4: Taste sliders
      DietAvoidsPicker.tsx            # Step 5: Dietary restrictions
      MasalaTadkaLocker.tsx          # Step 6: Spice blends & tadkas
    /results
      RecipeResultsGrid.tsx           # Recipe cards
      MatchExplanationChip.tsx        # "Matched because..."
      TadkaSwitcher.tsx               # Dynamic tadka toggle
      MasalaSwapper.tsx               # Masala swap options
    /shared
      RegionalStarterKit.tsx          # Quick presets
      FlavorAxisSlider.tsx            # Bilingual slider component
      MasalaCard.tsx                  # Masala info card
      TadkaCard.tsx                   # Tadka info card

/services
  /cookventure
    cookventureScoring.ts             # Scoring algorithm
    recipeInferencer.ts               # Infer missing fields
    regionalPresets.ts                # Region defaults
    tasteCalculator.ts                # Taste axes calculations
    tadkaSwapper.ts                   # Tadka switching logic

/data
  /cookventure
    regions.json
    masalas.json
    tadka.json
    souring_map.json
    sweeteners_map.json

/types
  cookventure.ts                      # TypeScript interfaces
```

---

### 3. Survey Flow (7 Steps)

#### Step 1: Region Selection
**UI:** Tiles with emoji, name, and micro-notes

```tsx
<RegionTile
  region="south"
  emoji="🥥"
  title="South India"
  notes="Curry leaves, coconut, tamarind, pepper"
  selected={selectedRegions.includes('south')}
  onClick={() => toggleRegion('south')}
/>
```

**Features:**
- Multi-select (user can pick multiple regions)
- Shows default staples below when selected
- Preloads masala & tadka suggestions

#### Step 2: Time & Course
- Time: ≤15 / 30 / 45 / 60+ min
- Course: breakfast / main / snack / dessert / beverage

#### Step 3: Pantry Bingo
**Region-aware ingredient chips:**
```tsx
<PantryBingo
  regionPacks={getRegionStagles(selectedRegions)}
  userIngredients={userIngredients}
  onToggle={(ingredient) => toggleIngredient(ingredient)}
/>
```

**Features:**
- Preload region staples (e.g., South adds curry leaves, tamarind, coconut)
- Search with synonyms (e.g., "tamatar" → tomato, "dhaniya" → coriander)
- Chips show badges for region fit

#### Step 4: Flavor Dials (The Innovation!)

```tsx
<FlavorAxisSlider
  label="Teekha (Heat)"
  labelHi="तीखा"
  emoji="🌶️"
  value={taste.heat}
  onChange={(v) => setTaste({ ...taste, heat: v })}
  min={0}
  max={3}
  help="Chili heat level"
/>

<FlavorAxisSlider
  label="Masaledar (Spice-rich)"
  labelHi="मसालेदार"
  emoji="🧄🧅🫚"
  value={taste.masala}
  onChange={(v) => setTaste({ ...taste, masala: v })}
  min={0}
  max={3}
  help="Aroma & warmth from spices (not just heat)"
/>

<FlavorAxisSlider
  label="Khata (Tangy)"
  labelHi="खट्टा"
  emoji="🍋"
  value={taste.tangy}
  onChange={(v) => setTaste({ ...taste, tangy: v })}
  min={0}
  max={3}
  help="Sourness from tamarind, kokum, amchur"
/>

<FlavorAxisSlider
  label="Meetha (Sweet)"
  labelHi="मीठा"
  emoji="🍯"
  value={taste.sweet}
  onChange={(v) => setTaste({ ...taste, sweet: v })}
  min={0}
  max={3}
  help="Sweetness or caramelization"
/>
```

**Educational Tooltip:**
> "In Indian cooking, 'spicy' can mean flavorful (masaledar) OR hot (teekha). We split them so you get exactly what you want!"

#### Step 5: Diet & Avoids
- Diet tags: vegetarian / vegan / gluten_free / diabetic_friendly / high_fiber / jain / no_onion_garlic
- Allergen avoids: nut / soy / dairy

#### Step 6: Masala & Tadka Locker (The Game-Changer!)

**Masala Locker:**
```tsx
<MasalaLocker
  availableMasalas={getRegionalMasalas(selectedRegions)}
  userMasalas={userMasalas}
  onToggle={(masala) => toggleMasala(masala)}
/>
```

Shows:
- Garam Masala (North)
- Goda Masala (West)
- Panch Phoron (East)
- Sambar Powder, Rasam Powder (South)
- Chaat Masala (North)

**Tadka Locker:**
```tsx
<TadkaLocker
  favouriteTadkas={userTadkas}
  onToggle={(tadka) => toggleTadka(tadka)}
/>
```

Shows:
- Hing-Jeera 🌾
- Lehsun-Lal Mirch 🧄🌶️
- Mustard-Curry Leaf 🍃
- Panch Phoron ⭐

---

### 4. Scoring Algorithm (Deterministic, Indian-first)

```typescript
// /services/cookventure/cookventureScoring.ts

interface ScoringWeights {
  pantry: 45;
  region: 15;
  masala_locker: 15;
  tadka: 10;
  flavor_axes: 10;
  health: 5;
}

function calculateCookventureScore(
  recipe: Recipe,
  userPrefs: UserPreferences
): ScoredRecipe {

  // 1. HARD FILTERS (binary pass/fail)
  if (!passesHardFilters(recipe, userPrefs)) {
    return { score: 0, recipe, explanation: [] };
  }

  let score = 0;
  const explanation: string[] = [];

  // 2. PANTRY COVERAGE (45 points)
  const pantryScore = calculatePantryCoverage(
    recipe.ingredients,
    userPrefs.pantry,
    userPrefs.selectedRegions // bonus for region staples
  );
  score += pantryScore;
  if (pantryScore > 35) {
    explanation.push(`✓ ${Math.round((pantryScore/45)*100)}% pantry match`);
  }

  // 3. REGION FIT (15 points)
  const regionScore = calculateRegionFit(
    recipe.region_tags,
    userPrefs.selectedRegions
  );
  score += regionScore;
  if (regionScore > 10) {
    explanation.push(`✓ Matches ${userPrefs.selectedRegions.join(', ')} region`);
  }

  // 4. MASALA LOCKER FIT (15 points)
  const masalaScore = calculateMasalaFit(
    recipe.masala_profiles,
    userPrefs.masalaLocker
  );
  score += masalaScore;
  if (masalaScore > 10) {
    const matched = recipe.masala_profiles.filter(m => userPrefs.masalaLocker.includes(m));
    explanation.push(`✓ Uses your ${matched.join(', ')}`);
  }

  // 5. TADKA FIT (10 points)
  const tadkaScore = calculateTadkaFit(
    recipe.tadka_profiles,
    userPrefs.favouriteTadkas
  );
  score += tadkaScore;
  if (tadkaScore > 5) {
    explanation.push(`✓ Favourite tadka: ${recipe.tadka_profiles[0]}`);
  }

  // 6. FLAVOR AXES FIT (10 points)
  const flavorScore = calculateFlavorAxesFit(
    recipe.taste_axes,
    userPrefs.tastePrefs
  );
  score += flavorScore;
  if (flavorScore > 7) {
    explanation.push(`✓ Matches your taste (heat:${userPrefs.tastePrefs.heat}, masala:${userPrefs.tastePrefs.masala})`);
  }

  // 7. HEALTH BONUS (5 points)
  const healthScore = calculateHealthBonus(recipe, userPrefs);
  score += healthScore;
  if (recipe.diabetic_friendly && userPrefs.diabetic_friendly) {
    explanation.push('✓ Diabetic-friendly');
  }

  return {
    score,
    recipe,
    explanation,
    missing_ingredients: getMissingIngredients(recipe, userPrefs.pantry),
    can_swap_tadka: recipe.tadka_profiles.length > 0,
    can_swap_masala: recipe.masala_profiles.length > 0
  };
}

// Detailed sub-scoring functions...

function calculatePantryCoverage(
  recipeIngredients: string[],
  userPantry: string[],
  selectedRegions: string[]
): number {
  const totalIngredients = recipeIngredients.length;
  const matchedIngredients = recipeIngredients.filter(i =>
    userPantry.includes(i)
  ).length;

  let coverage = (matchedIngredients / totalIngredients) * 40;

  // Bonus for region staples
  const regionStaples = getRegionStaples(selectedRegions);
  const stapleMatches = recipeIngredients.filter(i =>
    regionStaples.includes(i) && userPantry.includes(i)
  ).length;

  coverage += Math.min(5, stapleMatches);

  return Math.min(45, coverage);
}

function calculateFlavorAxesFit(
  recipeTaste: TasteAxes,
  userTaste: TasteAxes
): number {
  // Manhattan distance (L1 norm) - closer = better
  const distance =
    Math.abs(recipeTaste.heat - userTaste.heat) +
    Math.abs(recipeTaste.masala - userTaste.masala) +
    Math.abs(recipeTaste.tangy - userTaste.tangy) +
    Math.abs(recipeTaste.sweet - userTaste.sweet);

  // Max distance = 12 (3+3+3+3), convert to 0-10 scale
  return 10 * (1 - distance / 12);
}
```

**Tie-breakers (when scores equal):**
1. Fewer missing ingredients
2. Lower sodium
3. Higher fiber
4. Matches user's first-selected region

---

### 5. Dynamic Swapping (Post-match Customization)

#### A. Tadka Switcher

```tsx
<TadkaSwitcher
  currentTadka={recipe.tadka_profiles[0]}
  availableTadkas={['hing_jeera', 'mustard_curry_leaf', 'lehsun_lal_mirch', 'panch_phoron']}
  onSwitch={(newTadka) => {
    updateRecipeTadka(recipe.id, newTadka);
    // Show sizzling micro-animation
  }}
/>
```

**Backend logic:**
```typescript
function swapTadka(recipe: Recipe, newTadka: string): Recipe {
  const oldTadka = recipe.tadka_profiles[0];
  const tadkaData = getTadkaData(newTadka);

  return {
    ...recipe,
    tadka_profiles: [newTadka],
    taste_axes: {
      ...recipe.taste_axes,
      heat: adjustHeatForTadka(recipe.taste_axes.heat, oldTadka, newTadka)
    },
    instructions: replaceT adkaInstructions(recipe.instructions, oldTadka, newTadka),
    flavor_note: `Modified with ${tadkaData.name} (${tadkaData.aroma})`
  };
}
```

#### B. Masala Swapper

```typescript
function swapMasala(recipe: Recipe, oldMasala: string, newMasala: string): Recipe {
  // E.g., garam_masala ↔ goda_masala
  const newMasalaData = getMasalaData(newMasala);

  return {
    ...recipe,
    masala_profiles: recipe.masala_profiles.map(m => m === oldMasala ? newMasala : m),
    taste_axes: {
      ...recipe.taste_axes,
      masala: adjustMasalaComplexity(recipe.taste_axes.masala, oldMasala, newMasala),
      sweet: newMasala === 'goda_masala' ? Math.min(3, recipe.taste_axes.sweet + 1) : recipe.taste_axes.sweet
    }
  };
}
```

#### C. Diabetic-Friendly Sweetness Swaps

```typescript
function makeDiabeticFriendlySweetness(recipe: Recipe): Recipe {
  // Replace jaggery/sugar with perceived sweetness
  const swaps = {
    'jaggery': 'caramelised_onion',
    'sugar': 'roasted_pumpkin + cinnamon',
    'dates': 'coconut (watch portions)'
  };

  return {
    ...recipe,
    ingredients: replaceIngredients(recipe.ingredients, swaps),
    diabetic_friendly: true,
    taste_axes: {
      ...recipe.taste_axes,
      sweet: Math.max(0, recipe.taste_axes.sweet - 1) // Reduce slightly
    },
    flavor_note: 'Adapted for diabetes: natural sweetness from vegetables & spices'
  };
}
```

---

### 6. UI/UX Features

#### A. Regional Starter Kits

```tsx
<RegionalStarterKit region="south">
  <QuickPreset
    title="Classic Sambar"
    onClick={() => applyPreset({
      masalas: ['sambar_powder'],
      tadka: 'mustard_curry_leaf',
      taste: { heat: 1, masala: 2, tangy: 2, sweet: 1 },
      pantry: ['curry_leaves', 'tamarind', 'toor_dal', 'drumstick', 'tomato']
    })}
  />
  <QuickPreset title="Tangy Rasam" onClick={...} />
  <QuickPreset title="Coconut Chutney" onClick={...} />
</RegionalStarterKit>
```

#### B. Match Explanation Chips

```tsx
<MatchExplanationChip>
  <strong>Matched because:</strong> South India + Sambar powder + Teekha 2 + Khata 2 +
  you have tamarind & curry leaves (8/10 ingredients)
</MatchExplanationChip>
```

#### C. Bilingual Flavor Sliders

Visual design:
```
Teekha (Heat) 🌶️                    तीखा
[====|====|====|====] 2/3
Mild        Medium      High
```

Tooltip on hover:
> "Chili heat level. 0 = very mild, 3 = very hot"

#### D. Masala Learn Cards

When user hovers over a masala:
```tsx
<MasalaLearnCard masala="goda_masala">
  <h4>Goda Masala (गोडा मसाला)</h4>
  <p>Sweet, aromatic Maharashtrian blend</p>
  <p><strong>Key spices:</strong> Sesame, coconut, cinnamon</p>
  <p><strong>Use in:</strong> Bhaaji, varan, amti</p>
  <a href="..." target="_blank">Learn more →</a>
</MasalaLearnCard>
```

---

### 7. Implementation Sprints

#### Sprint A: Foundation & Region Brain (Week 1-2)
**Goal:** Core functionality working end-to-end

- [ ] Create data files (regions, masalas, tadka, taste maps)
- [ ] Build TypeScript types
- [ ] Region picker UI
- [ ] Flavor dials (4-axis system)
- [ ] Masala & Tadka locker UI
- [ ] Basic scoring algorithm (pantry + region + masala)
- [ ] Results grid with explanation chips
- [ ] Plug into existing recipes (add front-matter fields to 3-5 test recipes)

**Output:** Functional prototype with 5-10 recipes, basic matching works

#### Sprint B: Delight & Polish (Week 3)
**Goal:** Make it feel magical

- [ ] Tadka switcher with sizzle animation
- [ ] Regional starter kits (quick presets)
- [ ] Masala learn cards (hover tooltips)
- [ ] Bilingual labels (Hindi + English)
- [ ] Match explanation chips with icons
- [ ] Flavor axes distance visualization
- [ ] "Why this matched" detailed view

**Output:** Polished UX, users understand matches intuitively

#### Sprint C: Depth & Scale (Week 4)
**Goal:** Production-ready with state-specific features

- [ ] Sub-regional presets (Kerala coconut-pepper, Andhra gongura, etc.)
- [ ] Seasonal playlists (monsoon comfort foods, summer coolers)
- [ ] Masala swapper backend + UI
- [ ] Diabetic-friendly sweetness adapter
- [ ] Batch-tag existing recipes with region/masala/tadka fields
- [ ] A/B test scoring weights
- [ ] Analytics: track which regions/masalas users prefer

**Output:** 50+ recipes tagged, regional depth, ready for user testing

---

### 8. Example User Journey

**Priya from Bangalore wants quick South Indian breakfast:**

1. **Region:** Selects "South India" 🥥
   - Auto-loads: curry leaves, tamarind, coconut, mustard seeds, sambar powder

2. **Time & Course:** ≤15 min, Breakfast

3. **Pantry Bingo:** Has curry leaves, rice, urad dal, chana dal (8/10 South staples)

4. **Flavor Dials:**
   - Teekha: 1 (mild heat)
   - Masaledar: 2 (moderate spices)
   - Khata: 1 (slightly tangy)
   - Meetha: 0 (no sweetness)

5. **Diet:** Vegetarian, Gluten-free

6. **Masala Locker:** Has sambar powder, rasam powder
   **Tadka Locker:** Loves mustard-curry leaf

7. **Results:**
   - **#1: Ven Pongal (90 points)**
     - ✓ South India + uses your mustard-curry leaf tadka
     - ✓ 9/10 ingredients (missing cashews - suggested swap: roasted peanuts)
     - ✓ Teekha 1, Masala 2, Khata 0, Meetha 0 - perfect match!
     - ✓ Gluten-free, high-fiber (7g)

   - **#2: Upma (87 points)**
     - ✓ South India + 8/9 ingredients
     - ✓ Can switch tadka to panch phoron for East fusion 🎯

   - **#3: Idli with Coconut Chutney (85 points)**
     - ✓ Classic South + fermented for gut health

8. **Tadka Play:** Priya taps "Switch Tadka" on Upma → tries Panch Phoron version → bookmarks both!

---

### 9. Technical Details

#### TypeScript Interfaces

```typescript
// /types/cookventure.ts

export interface Region {
  id: string;
  name: string;
  name_hi?: string;
  states: string[];
  staple_packs: string[];
  default_masalas: string[];
  default_tadka: string[];
  default_taste: TasteAxes;
  notes: string;
  emoji: string;
}

export interface Masala {
  id: string;
  name: string;
  name_hi?: string;
  region_hint: string[];
  spices: string[];
  aroma: string[];
  description: string;
  refs: string[];
}

export interface Tadka {
  id: string;
  name: string;
  name_hi?: string;
  seeds: string[];
  aromatics: string[];
  oil: string;
  aroma: string;
  heat: number; // 0-3
  region_fit: string[];
  emoji: string;
}

export interface TasteAxes {
  heat: number;    // Teekha (0-3)
  masala: number;  // Masaledar (0-3)
  tangy: number;   // Khata (0-3)
  sweet: number;   // Meetha (0-3)
}

export interface RecipeCookventureData {
  region_tags?: string[];
  masala_profiles?: string[];
  tadka_profiles?: string[];
  taste_axes?: TasteAxes;
}

export interface UserPreferences {
  selectedRegions: string[];
  timeLimit?: number;
  course?: string[];
  pantry: string[];
  tastePrefs: TasteAxes;
  diet: string[];
  avoids: string[];
  masalaLocker: string[];
  favouriteTadkas: string[];
  diabetic_friendly?: boolean;
}

export interface ScoredRecipe {
  recipe: Recipe & RecipeCookventureData;
  score: number;
  explanation: string[];
  missing_ingredients: string[];
  can_swap_tadka: boolean;
  can_swap_masala: boolean;
}
```

#### Recipe Schema Update

```markdown
---
title: Ven Pongal
region_tags: ["South India", "Tamil Nadu"]
masala_profiles: ["cumin", "black_pepper"]
tadka_profiles: ["mustard_curry_leaf"]
taste_axes:
  heat: 1
  masala: 2
  tangy: 0
  sweet: 0
time: 20
course: ["breakfast"]
diet: ["vegetarian", "gluten_free"]
diabetic_friendly: true
high_fiber: true
ingredients:
  - rice
  - moong_dal
  - ghee
  - curry_leaves
  - mustard_seeds
  - ginger
  - black_pepper
  - cumin
  - cashews
---

## Ven Pongal

Comforting South Indian rice & lentil porridge...
```

---

### 10. Success Metrics

**User Engagement:**
- % of users completing survey (target: >80%)
- Average time to first recipe match (target: <2 min)
- % exploring tadka/masala swaps (target: >40%)

**Match Quality:**
- User rating of top 3 recipes (target: 4.2+/5)
- % clicking "Make This" (target: >25%)
- Repeat usage rate (target: >60% return within 7 days)

**Cultural Depth:**
- % users selecting 2+ regions (target: >35%)
- Most popular masala locker items
- Regional distribution of recipe matches

---

### 11. Future Enhancements (Post-Launch)

**Phase 2:**
- Voice input for ingredients (Hindi + regional languages)
- "Cook Along" mode with step-by-step photos
- Community masala swaps (user-submitted)
- Festival playlists (Diwali, Pongal, Durga Puja)

**Phase 3:**
- State-specific sub-cuisines (Chettinad, Awadhi, Goan, Assamese)
- AI-powered ingredient substitution (if user missing 1-2 key items)
- Video tutorials for complex tadkas
- Social sharing: "My Cookventure match!"

---

## Summary: Why This Wins

1. **Culturally Authentic:** Reflects how Indians actually think about flavor (teekha vs masaledar)
2. **Deterministic & Explainable:** No black-box AI; users understand every match
3. **Practical:** Masala locker = real kitchens; tadka swaps = real cooking
4. **Interoperable:** Works seamlessly with existing recipe schema
5. **Educational:** Users learn regional differences, masala uses, Ayurvedic tastes
6. **Scalable:** Easy to add states, sub-regions, seasonal playlists
7. **Fun:** Survey feels like a game; tadka switcher is delightful

---

## Getting Started

1. **Create data files** in `/data/cookventure/`
2. **Add TypeScript types** in `/types/cookventure.ts`
3. **Build RegionPicker** component (simplest starting point)
4. **Tag 5 test recipes** with new front-matter fields
5. **Implement scoring algorithm** core logic
6. **Wire up results grid**
7. **Iterate!**

**First commit goal:** User can pick South India → see 3 matching recipes with explanations

---

**Let's build Cookventure India! 🇮🇳🍛**
