# NutriServe Feature Plan: Dish Photo on Score Screen + Image Storage Verification

## Executive Summary

**Goal 1**: Display the requested dish's recipe image on the NutriServe result/scoring page when the customer receives their plate.

**Goal 2**: Verify and ensure the image storage database is working properly so AI-generated images persist permanently and don't regenerate, even if the IndexedDB cache is cleared.

---

## Part 1: Display Dish Photo on NutriServe Score Screen

### Challenge: Mapping Food Items to Recipe Images

The NutriServe game uses **`FoodItem`** objects, but the image database stores images based on **`Recipe`** IDs. A bridge is needed to link game items to their corresponding recipe images.

**Solution**: A mapping system (`nutriserveFoodMap.ts`) will be created to link food item IDs to recipe IDs. This will allow the `ResultModal` to fetch and display the correct image using a new `DishImageDisplay` component.

### Implementation Steps

1.  **Create Food-to-Recipe Mapping**: A new file, `services/nutriserveFoodMap.ts`, will define a constant mapping `FOOD_TO_RECIPE_MAP` and helper functions.
2.  **Extend Utilities**: The `services/nutriserveUtils.ts` file will be extended with a `getMainDishFromOrder` function to extract the primary dish from a customer's order.
3.  **Create `DishImageDisplay` Component**: A new reusable component, `components/games/nutriserve-ui/DishImageDisplay.tsx`, will be created to handle the logic of fetching an image from storage and displaying it, with appropriate loading and fallback states.
4.  **Integrate into `ResultModal`**: The `DishImageDisplay` component will be integrated into `components/games/nutriserve-ui/ResultModal.tsx` to show the prepared dish's image.

---

## Part 2: Image Storage Verification & Permanent Storage

### Challenge: Redundant Image Generation

Currently, the image generation service might re-generate an image if it's missing from IndexedDB, even if it already exists in the permanent SQLite store. This is inefficient and costly.

**Solution**: The image generation and storage services will be enhanced to check for an image's existence in **both** IndexedDB and SQLite before triggering a new AI generation request.

### Implementation Steps

1.  **Audit `imageService.ts`**: The `generateAndStoreRecipeImage` function will be modified to add a check against the SQLite database. If an image key exists in SQLite but not in IndexedDB, the generation will be skipped, and the system will rely on the read-through cache to repopulate IndexedDB.
2.  **Audit `imageStoreService.ts`**: The `saveImageArtifacts` function will be improved to check if an image key already exists in SQLite before attempting a write. This avoids redundant blob conversions and database operations.
3.  **Verify `ImageGenerationContext.tsx`**: The `enqueueRecipe` function will be enhanced to not only check the recipe's metadata but also perform a check against the actual storage (`getRecipeImageState`) to more robustly prevent enqueueing already-generated images.

---

## Part 3: Success Criteria

### Functional
-   The dish photo for the customer's required item appears on the NutriServe result screen.
-   If an image does not exist, a graceful fallback (emoji or placeholder) is shown.
-   Clearing the browser's IndexedDB cache does **not** trigger a re-generation of existing images.
-   New images are still generated correctly and saved to both IndexedDB and SQLite.

### Technical
-   The dual-write and read-through cache patterns are correctly implemented.
-   No breaking changes are introduced to existing APIs or component signatures.
-   The system remains performant, with image loading from SQLite being fast and not blocking the UI.
-   The solution is fully backward-compatible.
