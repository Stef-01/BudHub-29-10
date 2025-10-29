# Project Management & AI Collaboration Log

This document serves as a central hub for project information, architecture notes, and a chronological log of all changes made by the AI assistant.

## App Overview

Vibe-Coded Garden is a smart gardening assistant tailored for the subtropical climate of Logan, Queensland. It aims to make gardening more accessible and enjoyable by providing timely, weather-aware tasks and a vibrant community connection.

### Core Features
- **Dynamic Task Generation**: Creates a weekly to-do list based on the user's specific plants and real-time weather forecasts.
- **Gamification**: Users earn XP for completing tasks, level up, and receive positive reinforcement.
- **Personalized Garden**: Users can add and remove plants from their personal garden patch, which is saved locally.
- **Recipe Discovery**: A smart recipe book that suggests meals based on harvestable produce, with the ability to save favorites.
- **Community Events**: A curated list of local gardening events.
- **AI-Powered Tips**: Integration with Gemini to provide creative, context-aware gardening advice.

### Tech Stack
- **Frontend**: React with TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Context API
- **Local Persistence**: `localStorage` (via `useLocalStorage` hook)
- **AI Integration**: Google Gemini API

---

## Architectural Notes & Principles

1.  **Data Firewall**: A strict separation is maintained between the application's static "Catalog" data (`PLANT_CATALOG`, `RECIPE_CATALOG`) and the user's dynamic, personal data (`myPlants`, `myRecipes`). User data is sacred and must never be overwritten by application updates.
2.  **Context over Prop-Drilling**: State is managed through scoped React Contexts (`UserGardenContext`, `UserCookbookContext`, `GamificationContext`) to avoid complex prop-drilling and to logically group related state and actions.
3.  **Centralized Configuration**: Tweakable values (e.g., XP points, temperature thresholds) are stored in `config.ts` to provide a single, safe place for adjustments.
4.  **Component Modularity**: Components are designed to be as self-contained as possible, consuming data from contexts where appropriate, making them easier to maintain and refactor.
5.  **Service Layer**: Business logic (e.g., task generation, API calls) is abstracted into a `services` directory to keep components focused on the UI.

---

## AI Update Log

This log is updated by the AI assistant with every significant change, providing a transparent history of development.

### **Update: 2024-07-28**
- **Feature**: UI/UX Fix: Relocate Task Dismiss Button
- **Description**: Moved the dismiss (trash) icon on the `TaskCard` component from the top-right to the bottom-right corner. This resolves a UI issue where the button could overlap with the completion checkbox, improving usability and aesthetics.
- **Impacted Files**:
    - `components/TaskCard.tsx`: Updated button positioning.
    - `PROJECT_MANAGEMENT.md`: Logged this UI fix.

### **Update: 2024-07-27**
- **Feature**: Critical Fix: Comprehensive Recipe Database Integration
- **Description**: Fixed a recurring critical bug where the new, rich recipe database was not being displayed. This update **correctly** replaces the placeholder recipe data with the full CSV-based catalog of 100+ recipes. The `constants.ts` file is now populated with the complete, structured data, including matched images, resolving the issue where users could not see the new recipes.
- **Impacted Files**:
    - `constants.ts`: Replaced placeholder `RECIPE_CATALOG` with full CSV data and matched images.
    - `PROJECT_MANAGEMENT.md`: Logged this critical fix.

### **Update: 2024-07-26**
- **Feature**: Critical Fix: Comprehensive Recipe Database UI Integration
- **Description**: Fixed a critical bug where the new, rich recipe database was not being displayed in the UI. This update completely replaces the old recipe data with the new CSV-based catalog of 100+ recipes, updates the data types, and overhauls the `RecipeDetailModal` to display all the new information, including health tags, cooking times, and spice levels.
- **Impacted Files**:
    - `types.ts`: Overhauled `Recipe` type.
    - `constants.ts`: Replaced `RECIPE_CATALOG` with full CSV data and matched images.
    - `components/icons/Icons.tsx`: Added new icons for recipe details.
    - `components/RecipeDetailModal.tsx`: Rewrote component to display all new data fields.
    - `PROJECT_MANAGEMENT.md`: Logged this fix.

### **Update: 2024-07-25**
- **Feature**: Advanced Seasonal Task Engine & Dynamic Regeneration
- **Description**: Overhauled the task generation engine to be more intelligent and dynamic. The new engine is based on a scientific analysis of Logan's subtropical seasons and generates a large pool of over 15 varied tasks per day. The UI was updated so that dismissing a task now dynamically reveals a new one from the daily pool. The dismiss icon was moved to the bottom right of task cards.
- **Impacted Files**:
    - `types.ts`: Added new task categories.
    - `services/taskService.ts`: Completely rewrote the task generation engine.
    - `components/icons/Icons.tsx`: Added new icons for new task categories.
    - `components/TaskCard.tsx`: Relocated dismiss icon.
    - `components/TaskBoard.tsx`: Implemented "See More" and new filters.
    - `PROJECT_MANAGEMENT.md`, `PLANNING.md`: Logged feature completion.

### **Update: 2024-07-24**
- **Feature**: Dynamic Task Dismissal
- **Description**: Enhanced the task dismissal feature. When a user clicks the trash icon on a task, a new task from the daily pool is now revealed, creating a more interactive experience.
- **Impacted Files**:
    - `App.tsx`: Delegated filtering logic to `TaskBoard`.
    - `components/TaskBoard.tsx`: Refactored to handle filtering internally to support dynamic replacement.
    - `PROJECT_MANAGEMENT.md`: Logged this feature enhancement.

### **Update: 2024-07-23**
- **Feature**: Architectural Refactor for Data Integrity and Modularity
- **Description**: Performed a major architectural refactor to create a "firewall" between static app data and user data, preventing data loss during updates. Moved state management for the garden, cookbook, and gamification into separate React Contexts, breaking up the monolithic `App.tsx` component. Centralized configuration values into a new `config.ts` file.
- **Impacted Files**:
    - `App.tsx`: Refactored to use Context providers.
    - `constants.ts`: Separated "Catalog" data from "Initial" user data.
    - `config.ts`: New file for configuration.
    - `contexts/`: New directory with `GamificationContext`, `UserGardenContext`, `UserCookbookContext`.
    - `components/`: Updated multiple components to consume from contexts instead of props.
    - `PROJECT_MANAGEMENT.md`: Logged this critical architectural change.

### **Update: 2024-07-22**
- **Feature**: Persistent User Garden Data
- **Description**: Implemented a critical fix to prevent the user's plant list from being wiped during AI updates. The user's garden (`myPlants`) is now managed exclusively in `localStorage` and is completely decoupled from the application's static `PLANT_CATALOG`. Introduced an "Add Plant" feature to allow users to manage their garden.
- **Impacted Files**:
    - `App.tsx`, `constants.ts`, `contexts/UserGardenContext.tsx`, `components/AddPlantModal.tsx`
    - `PROJECT_MANAGEMENT.md`: Logged this critical data integrity fix.