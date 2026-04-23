import { generateObject } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { z } from 'zod';
import { WorldState } from "../types/entities";
import { Message, SpeakerType } from "../types/dialogue";

// Define the schema using Zod for runtime validation and provider-agnostic structured output
const AIResponseSchema = z.object({
  dialogue: z.array(z.object({
    speaker: z.string(),
    type: z.enum(['YOU', 'INNER_VOICE', 'CHARACTER', 'SYSTEM', 'ROLL'] as const),
    text: z.string(),
    skillCheck: z.object({
      skill: z.string(),
      difficulty: z.string(),
      success: z.boolean(),
    }).optional(),
  })),
  worldUpdates: z.array(z.object({
    id: z.string(),
    longDescription: z.string().optional(),
    shortDescription: z.string().optional(),
    // Added z.string() as the first argument here
    attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
    // Added z.string() as the first argument here
    opinions: z.record(z.string(), z.string()).optional(),
  })),
  suggestedOptions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isAiTrigger: z.boolean(),
  })),
});

// Create a TypeScript type from the schema
export type AIResponse = z.infer<typeof AIResponseSchema>;

class AIService {
  private model;

  constructor() {
    // You can easily switch providers here or pass the model as a constructor param
    this.model = deepseek('deepseek-chat'); 
  }

  async generateResponse(
    userInput: string,
    worldState: WorldState,
    history: Message[]
  ): Promise<AIResponse> {
    
    const systemInstruction = `
      You are the Game Master for a narrative-driven RPG in the style of Disco Elysium.
      The tone is noir, philosophical, gritty, and surreal.

      CONTEXT:
      Current World State (Objects, Locations, Characters):
      ${JSON.stringify(worldState, null, 2)}

      Dialogue History:
      ${history.map(m => `${m.speaker} (${m.type}): ${m.text}`).join('\n')}

      MISSION:
      The user has just said/done: "${userInput}"

      Your task:
      1. Provide a narrative response. Use multiple messages if needed. 
      2. Speakers should be characters from the world, 'INNER_VOICE' for the player's thoughts, or 'SYSTEM' for narration.
      3. Use 'ObjectLink' style if you mention any world objects (e.g., [[lickra_brand]]).
      4. If you add significant new details to an object, location, or character, include a 'worldUpdate' to persist that detail.
      5. Update character opinions if interactions warrant it.
      6. Provide suggested dialogue options for the user to continue.
    `;

    try {
      const { object } = await generateObject({
        model: this.model,
        schema: AIResponseSchema,
        system: systemInstruction,
        prompt: userInput,
        // Optional: reduce temperature for more consistent structured results
        temperature: 0.7,
      });

      return object;
    } catch (error) {
      console.error("AI Generation Error:", error);
      throw new Error(`Failed to generate a valid game response. (${error})`);
    }
  }
}

export const aiService = new AIService();