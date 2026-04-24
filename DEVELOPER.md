# Developer Documentation: Elysian Dialogue

This document provides an overview of the architecture, core systems, and data structures of the **Elysian Dialogue** application to assist with future development and maintenance.

## 1. Project Overview

**Elysian Dialogue** is a cinematic RPG-style dialogue engine built with React, Vite, and Tailwind CSS. It focuses on a vertical-scrolling "thought stream" aesthetic where messages appear sequentially, and players interact via branching dialogue options and skill checks.

- **Primary Stack:** React 19, TypeScript, Vite.
- **Animation:** `motion` (formerly `framer-motion`).
- **Styling:** Tailwind CSS (v4).
- **Icons:** `lucide-react`.

---

## 2. Core Architecture

### State Management
- **Local State (`App.tsx`):** Maintains the `history` of the conversation, `currentStepId`, and UI states like `isTyping` or `currentCheck`.
- **Character Context (`CharacterContext.tsx`):** A React Context that stores the player's attributes (Logic, Rhetoric, etc.). This acts as the "Source of Truth" for skill bonuses during checks.

### Dialogue Loop
1. **Load Step:** `App` reads the `DialogueStep` from the data map.
2. **Display Messages:** Messages in the step are displayed sequentially with a calculated "typing" delay.
3. **Show Options:** Once messages are finished, `DialogueOptions` are rendered.
4. **Select Option:**
   - If a **Normal Transition** (`nextStepId`), jump to step 1.
   - If a **Skill Check** (`check`), trigger the `DiceRoller`.
5. **Skill Check Outcome:** `DiceRoller` calculates the result (Dice + Bonus vs Difficulty) and evaluates conditions to determine the `outcomeStepId`.

---

## 3. Data Structures

Defined in `src/types/dialogue.ts`.

### `DialogueStep`
The building block of the conversation.
```typescript
{
  id: "start_node",
  messages: [...], // Array of message objects
  options: [...]  // Array of player choices
}
```

### `DialogueOption`
Supports simple jumps or complex skill-gated transitions.
- **`nextStepId`**: Used for linear progression.
- **`check`**: Defines a skill check, difficulty, and branching `conditions`.

### `Message`
A single line of text in the history.
- **`type`**: `YOU`, `INNER_VOICE`, `CHARACTER`, `SYSTEM`, or `ROLL`. Determines styling.
- **`skillCheck`**: Visual hint attached to a message indicating it was the result of a check.

### Object Reference System
Dialogue messages support interactive object links using a custom markdown-like syntax:
`[Object Name](#object_id)`

- **WorldManager (`src/services/WorldManager.ts`)**: Central storage for all world entities (Objects, Locations, Characters).
- **LlmService (`src/services/LlmService.ts`)**: Handles dynamic AI dialogue using **Vercel AI SDK** with the **DeepSeek** model. This system uses `generateObject` with a **Zod schema** to ensure structured outputs for dialogue, world updates, and suggested options.
- **ObjectLink (`src/components/ObjectLink.tsx`)**: Handles the parsing and interaction of these links.
- **ObjectTooltip (`src/components/ObjectTooltip.tsx`)**: A cinematic pop-up showing object attributes, short descriptions, and expandable lore sections.

---

## 4. Key Systems

### Sequential Message Flow
Implemented in `App.tsx` using `displayMessages`. It uses an `async` loop with `setTimeout` to push messages into the `history` array one by one. The delay is dynamic based on text length.

### Skill Check Evaluator
Located in `App.tsx` (within `handleRollComplete`) and `DiceRoller.tsx`. It uses a safe `new Function()` evaluator to check player-defined expressions:
```javascript
const evaluator = new Function('dice', 'total', 'success', 'diceLen', `return ${condition.expression}`);
```
This allows for flexible logic like "Critical Success" (rolling double 6s) or "Partial Success" (meeting a separate threshold).

### The "Disco" Aesthetic
- **Fonts:** Serif for narrative text, Sans/Mono for system info.
- **Colors:** Specific hex codes for inner voices (`#9081e3`) and player actions (`#ff6b35`).
- **Texture:** A custom SVG noise filter is applied globally in `index.css` via `.bg-texture`.

---

## 5. How to Extend

### Adding New Dialogue
Navigate to `src/data/sampleDialogue.ts` and add a new entry to the `sampleDialogue` object.
1. Define a unique ID.
2. Add messages with appropriate `speaker` and `type`.
3. Add options that link back to existing steps or new ones.

### Adding New Skills
1. Update the `CharacterStats` interface in `src/context/CharacterContext.tsx`.
2. Update the `defaultCharacter` object with a base value.
3. Update the `CharacterPanel.tsx` visual if needed.

### Adding New World Entities
1. Open `src/services/WorldManager.ts`.
2. Add a new entry to the appropriate initial state object (Objects, Locations, or Characters).
3. Characters have an `opinions` field which tracks their relationship with other entities.
4. Reference entities in dialogue using `[Display Name](#entity_id)`.

---

## 6. Component Breakdown

- `App.tsx`: The orchestrator.
- `CharacterPanel.tsx`: Slidable sidebar for attributes.
- `DiceRoller.tsx`: Logic and animation for the 2D6 rolling system.
- `DialogueMessage.tsx`: Handles message types and "Tooltips" for past roll results.
- `DialogueOptions.tsx`: Maps choices to interaction events.
- `TypingIndicator.tsx`: The "..." animated feedback.
- `ObjectLink.tsx`: Parses object references and manages the hover-persistent state.
- `ObjectTooltip.tsx`: Renders the detailed object lore and allows interaction via a "hover-bridge" padding technique.

---

## 7. Maintenance Log

### 2026-04-24
- **Scrollbar Fix**: Resolved issue where the internal scroll container (`main`) was not correctly established due to a `min-h-screen` layout constraint on both the parent and the child. Standardized the hierarchy to use `h-screen overflow-hidden` on the layout root and `h-full overflow-y-auto` on the scrollable main container. Fixed custom scrollbar visibility on smaller viewports.

### 2026-04-23
- **LLM Upgrade**: Migrated from Google Generative AI SDK to **Vercel AI SDK** (`ai`).
- **Model Switch**: Now using **DeepSeek-V3** (`deepseek-chat`) for narratively rich and structured RPG responses.
- **Type Safety**: Integrated **Zod** in `LlmService.ts` for automated schema validation of AI responses.
- **UI Polish**: Applied global scrollbar hiding in `index.css` to enhance cinematic immersion while preserving scroll functionality.
- **Instruction Refinement**: Hardened the system prompt and Zod schema to prevent "response did not match schema" errors (using `.nullish()` and objective-oriented prompting).

---

## 8. Visual & Narrative Roadmap

The following features were identified as missing based on target visual references and are queued for implementation:

### 1. Narrative & Interaction Polish
- [ ] **Continue Button:** Cinematic large pink/red "CONTINUE" button for dialogue flow instead of standard numbered options.
- [ ] **Notification Messages:** Specialized styling for `XP_GAIN`, `TASK_UPDATE`, and `ITEM_GAIN` (muted green text, distinct spacing).
- [ ] **Scroll Indicator:** Vertical line with circle markers indicating dialogue progression.

### 2. Skill Check Enhancements
- [ ] **Red Checks:** Specialized high-stakes UI for non-repeatable checks with probability percentages.
- [ ] **Result Overlays:** Painterly "SUCCEEDED/FAILED" result cards with textured backgrounds.
- [ ] **Probability Preview:** Calculated chance of success shown on options before committing.

### 3. Atmospheric Effects
- [ ] **Side Text:** Vertical character/state indicators on screen edges.
- [ ] **Dynamic Backgrounds:** Support for scene-specific isometric backgrounds.

---
