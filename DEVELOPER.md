# Developer Documentation: Elysian Dialogue

This document provides an overview of the architecture, core systems, and data structures of the **Elysian Dialogue** application to assist with future development and maintenance.

## 1. Project Overview

**Elysian Dialogue** is a cinematic RPG-style dialogue engine built with React, Vite, and Tailwind CSS. It focuses on a vertical-scrolling "thought stream" aesthetic where messages appear sequentially, and players interact via branching dialogue options and skill checks.

- **Primary Stack:** React 19, TypeScript, Vite.
- **Animation:** `motion` (formerly `framer-motion`).
- **Styling:** Tailwind CSS (v4).
- **Icons:** `lucide-react`.

---

## 2. Project Structure

The project follows a full-stack structure with React on the frontend and an Express server on the backend.

```text
.
├── DEVELOPER.md             # Technical documentation and maintenance logs
├── game.db                  # SQLite database for world state and history
├── game.db-shm / game.db-wal # SQLite temporary files
├── index.html               # Entry HTML for Vite
├── metadata.json            # AI Studio app metadata
├── package.json             # Project dependencies and scripts
├── server.ts                # Backend entry point (Express + Vite middleware)
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
├── src/
│   ├── main.tsx             # Frontend entry point
│   ├── App.tsx              # Main application component/orchestrator
│   ├── index.css            # Global styles and Tailwind imports
│   ├── components/          # React UI Components
│   │   ├── CharacterPanel.tsx   # Sidebar for character stats and world registered entities
│   │   ├── DebugPanel.tsx       # Overlay for LLM request/response debugging. Displays transmission logs and JSON payloads.
│   │   ├── DialogueMessage.tsx  # Individual message styling. Handles message types and "Tooltips" for past roll results.
│   │   ├── DialogueOptions.tsx  # List of player choices
│   │   ├── DiceRoller.tsx       # Skill check simulation
│   │   ├── ObjectLink.tsx       # Interactive links in text. Parses object references and manages the hover-persistent state.
│   │   ├── ObjectTooltip.tsx    # Content for hovered links. Renders the detailed object lore and allows interaction via a "hover-bridge" padding technique.
│   │   └── TypingIndicator.tsx  # NPC character typing status, "..." animated feedback
│   ├── context/             # Global State
│   │   └── CharacterContext.tsx # Player attributes and bonuses
│   ├── data/                # Static assets/initial states
│   │   └── sampleDialogue.ts    # Seed dialogue data
│   ├── server/              # Backend Logic
│   │   ├── api.ts               # Express route handlers
│   │   ├── database.ts          # Database connection/initialization
│   │   ├── LlmServiceBackend.ts # Server-side AI orchestration
│   │   └── models/              # DB interactions
│   │       ├── debug.ts         # LLM interaction logging
│   │       ├── history.ts       # Conversation history queries
│   │       ├── plot.ts          # Story progression queries
│   │       └── world.ts         # Entities and world state queries
│   ├── services/            # Frontend Core Logic
│   │   ├── LlmService.ts        # AI communication client
│   │   ├── WorldManager.ts      # Global world state tracker
│   │   └── tools/               # LLM Function Calling implementations
│   │       ├── addDialogueStep.ts # Adds new dialogue nodes
│   │       ├── addPlot.ts         # Add new plot triggers
│   │       ├── updatePlotStatus.ts# Update plot state
│   │       └── updateWorldState.ts # State synchronization
│   └── types/               # Shared Type Definitions
│       ├── dialogue.ts          # Dialogue system interfaces
│       ├── entities.ts          # Character and object interfaces
│       └── worldObject.ts       # Specific object properties
```

---

## 3. Core Architecture

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

## 4. Data Structures

Defined in `src/types/dialogue.ts`.

### `DialogueStep`
The building block of the conversation.
```typescript
{
  id: "start_node",
  messages: [...], // Array of message objects
  options: [...]  // Array of player choices, appear only after all `messages` appear
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
- **LlmServiceBackend (`src/server/LlmServiceBackend.ts`)**: Handles dynamic AI dialogue using the **Vercel AI SDK**. It prefers **Gemini** models (e.g., `gemini-3.1-flash-lite-preview`) and falls back to **DeepSeek-V3**. The system utilizes tool calling (function calling) to perform world updates, plot transitions, and generate narrative dialogue steps.
- **LlmService (`src/services/LlmService.ts`)**: A frontend client wrapper that proxies requests to the backend `/api/chat` route.
- **Debug System**:
  - **Database Logging**: LLM interactions are logged to the `llm_logs` table in SQLite via `src/server/models/debug.ts`.
  - **API Endpoints**: `/api/debug/logs` (GET) and `/api/debug/logs/clear` (POST) manage these logs.
  - **Debug Panel (`src/components/DebugPanel.tsx`)**: A multi-tab utility (Logs, History, World) for real-time application state management. It features a cinematic backdrop that allows closing the panel by clicking outside. The layout is modularized into dedicated sub-components within the file:
    - **Logs (`LlmTraceViewer`)**: Displays chronological LLM interactions with a read-only CodeMirror viewer for code blocks and a custom **One Dark** styled tree viewer (`JsonExplorer`) for JSON payloads.
    - **Console (`ConsoleViewer`)**: Real-time browser console log viewer with timestamp and log level filtering visualization. Captures `log`, `info`, `warn`, and `error`.
    - **History (`HistoryEditor`)**: Advanced JSON editor (via CodeMirror) for synchronizing the dialogue message buffer with schema validation.
    - **World (`WorldEditor`)**: Entity manifest editor powered by CodeMirror with schema-based hinting and validation.
- **ObjectLink (`src/components/ObjectLink.tsx`)**: Handles the parsing and interaction of these links.
- **ObjectTooltip (`src/components/ObjectTooltip.tsx`)**: A cinematic pop-up showing object attributes, short descriptions, and expandable lore sections.

---

## 5. Key Systems

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

## 6. How to Extend

### Adding New Dialogue
Navigate to `src/data/sampleDialogue.ts` and add a new entry to the `sampleDialogue` object.
1. Define a unique ID.
2. Add messages with appropriate `speaker` and `type`.
3. Add options that link back to existing steps or new ones.

### Adding New Skills
1. Update the `CharacterStats` interface in `src/types/entities.ts` (if applicable) and the `defaultCharacter` state in `src/context/CharacterContext.tsx`.
2. The current active skills are: `Logic`, `Rhetoric`, `Empathy`, `Perception`, `Volition`, `Endurance`, `Inland Empire`, `Suggestion`, `Half Light`, and `Physical Instrument`.
3. Update the `CharacterPanel.tsx` visual to display the new skill.

### Adding New World Entities
1. Open `src/services/WorldManager.ts`.
2. Add a new entry to the appropriate initial state object (Objects, Locations, or Characters).
3. Characters have an `opinions` field which tracks their relationship with other entities.
4. Reference entities in dialogue using `[Display Name](#entity_id)`.

---

## 7. Change History

All modifications to the codebase are tracked in [CHANGELOG.md](./CHANGELOG.md).
