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

- **ObjectRegistry (`src/services/ObjectManager.ts`)**: Central storage for all world objects.
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

---

## 6. Component Breakdown

- `App.tsx`: The orchestrator.
- `CharacterPanel.tsx`: Slidable sidebar for attributes.
- `DiceRoller.tsx`: Logic and animation for the 2D6 rolling system.
- `DialogueMessage.tsx`: Handles message types and "Tooltips" for past roll results.
- `DialogueOptions.tsx`: Maps choices to interaction events.
- `TypingIndicator.tsx`: The "..." animated feedback.
