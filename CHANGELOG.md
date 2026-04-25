# Changelog: Elysian Dialogue

All notable changes to this project will be documented in this file.

### 2026-04-25
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
