import { generateText, type LanguageModel, tool } from "ai";
import { z } from "zod";

export const updateWorldState = tool({
  title: "Update World State",
  description: "Updates the world state with new observations or character state changes. Call this to update opinions, descriptions, or attributes.",
  inputSchema: z.object({
    updates: z.array(z.object({
      id: z.string().describe("The unique ID of the entity to update (e.g., 'madam_vespera')."),
      longDescription: z.string().nullish().describe("New detailed observation."),
      shortDescription: z.string().nullish().describe("New concise label."),
      attributes: z.record(z.string(), z.string()).nullish().describe("Physical or mental traits."),
      opinions: z.record(z.string(), z.string()).nullish().describe("How they feel about YOU (the player) or others.")
    })).describe("State changes to persist in the world memory."),
  })
});