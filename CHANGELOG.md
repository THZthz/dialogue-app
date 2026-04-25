# Changelog: Elysian Dialogue

All notable changes to this project will be documented in this file.

### 2026-04-25
- **Feature**: Expanded Debug Panel with State Editors.
  - Added "History" tab to view and modify dialogue message buffers.
  - Added "World" tab to view and modify world entities (characters, locations, objects) via a manifest list and JSON editor.
  - Implemented backend synchronization for history and world entity updates.
- **Maintenance**: Fixed model name typo (`gemini-3.1-flash-lite-preview`).
- **Feature**: Enhanced LLM request logging.
  - Expanded `addLlmLog` payload to include full tool definitions (schemas), user input, and complete conversation history.
  - Ensured no simplification of debug data occurs during transmission.
- **Feature**: Added a full-stack LLM debug system.
  - Implemented `llm_logs` SQLite table for persistent request/response tracking.
  - Created `/api/debug/logs` endpoints to fetch and manage performance/interaction data.
  - Added `DebugPanel` UI component with real-time log viewing, JSON formatting, and error highlighting.
- **UI Enhancement**: Improved `DebugPanel` usability.
  - Added `ResizableContainer` for `Outgoing_Request` and `Incoming_Response` messages, allowing users to vertically scale boxes via a drag handle.
  - Added "Copy" buttons to both Request and Response sections for quick clipboard access with visual feedback.
  - Standardized custom `debug-scrollbar` styling for both vertical and horizontal axes.
  - Fixed horizontal scrollbar positioning and visibility during resizing by integrating styles directly into the syntax highlighter.
- **Documentation**: Corrected file paths (`datebase.ts`, `models/`, `tools/`) in `DEVELOPER.md` structure map.
- **Documentation**: Updated `DEVELOPER.md` with a comprehensive project structure breakdown, including detailed descriptions for key directories and files to improve onboarding and codebase navigation.
- **Project Maintenance**: Moved maintenance log from `DEVELOPER.md` to `CHANGELOG.md`.

### 2026-04-24
- **Scrollbar Fix**: Resolved issue where the internal scroll container (`main`) was not correctly established due to a `min-h-screen` layout constraint on both the parent and the child. Standardized the hierarchy to use `h-screen overflow-hidden` on the layout root and `h-full overflow-y-auto` on the scrollable main container. Fixed custom scrollbar visibility on smaller viewports.

### 2026-04-23
- **LLM Upgrade**: Migrated from Google Generative AI SDK to **Vercel AI SDK** (`ai`). `genai` will not work in the project.
- **Model Switch**: Now using **DeepSeek-V3** (`deepseek-chat`) for narratively rich and structured RPG responses.
- **Type Safety**: Integrated **Zod** in `LlmService.ts` for automated schema validation of AI responses.
- **UI Polish**: Applied global scrollbar hiding in `index.css` to enhance cinematic immersion while preserving scroll functionality.
- **Instruction Refinement**: Hardened the system prompt and Zod schema to prevent "response did not match schema" errors (using `.nullish()` and objective-oriented prompting).
