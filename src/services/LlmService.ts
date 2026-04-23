import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateObject } from "ai";
import { z } from "zod";
import { WorldState } from "../types/entities";
import { Message } from "../types/dialogue";

export interface AIResponse {
  dialogue: {
    speaker: string;
    type: "YOU" | "INNER_VOICE" | "CHARACTER" | "SYSTEM" | "ROLL";
    text: string;
    skillCheck?: {
      skill: string;
      difficulty: string;
      success: boolean;
    };
  }[];
  worldUpdates: {
    id: string;
    longDescription?: string;
    shortDescription?: string;
    attributes?: Record<string, string>;
    opinions?: Record<string, string>;
  }[];
  suggestedOptions: {
    id: string;
    text: string;
    isAiTrigger: boolean;
    nextStepId?: string;
  }[];
}

const aiResponseSchema = z.object({
  dialogue: z.array(z.object({
    speaker: z.string(),
    type: z.enum(["YOU", "INNER_VOICE", "CHARACTER", "SYSTEM", "ROLL"]),
    text: z.string(),
    skillCheck: z.object({
      skill: z.string(),
      difficulty: z.string(),
      success: z.boolean()
    }).optional()
  })),
  worldUpdates: z.array(z.object({
    id: z.string(),
    longDescription: z.string().optional(),
    shortDescription: z.string().optional(),
    attributes: z.record(z.string(), z.string()).optional(),
    opinions: z.record(z.string(), z.string()).optional()
  })),
  suggestedOptions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isAiTrigger: z.boolean(),
    nextStepId: z.string().optional()
  }))
});

class AIService {
  async generateResponse(
    userInput: string,
    worldState: WorldState,
    history: Message[]
  ): Promise<AIResponse> {
    
    const systemInstruction = `
      You are the Game Master for a narrative-driven RPG in the style of Disco Elysium.
      The tone is noir, philosophical, gritty, and surreal. Use internal monologues (INNER_VOICE) frequently to reflect the character's psyche.

      CONTEXT:
      Current World State (Objects, Locations, Characters):
      ${JSON.stringify(worldState, null, 2)}

      Dialogue History:
      ${history.map(m => `${m.speaker} (${m.type}): ${m.text}`).join('\n')}

      MISSION:
      The user (YOU) has just said/done: "${userInput}"

      Your task:
      1. Provide a narrative response. Use multiple messages if needed. 
      2. Speakers should be characters from the world, 'INNER_VOICE' for the player's thoughts, or 'SYSTEM' for narration.
      3. Use 'ObjectLink' style if you mention any world objects known to the player (e.g., [[lickra_brand]]).
      4. If you add significant new details to an object, location, or character, include a 'worldUpdate' to persist that detail.
      5. Update character opinions if interactions warrant it.
      6. Provide 3-4 suggested dialogue options for the user to continue. 
         - Set 'isAiTrigger' to TRUE for these options to continue the AI conversation loop.
         - If you want to return to a static part of the narrative (e.g., 'start', 'tequila_sunset', 'leave'), provide the corresponding 'nextStepId'.
    `;

    try {
      const deepseek = createDeepSeek({
        apiKey: process.env.DEEPSEEK_API_KEY,
      });

      const { object } = await generateObject({
        model: deepseek("deepseek-chat"),
        system: systemInstruction,
        prompt: userInput,
        schema: aiResponseSchema,
      });

      return object as AIResponse;
    } catch (error) {
      console.error("AI Generation Error:", error);
      throw error;
    }
  }
}

export const aiService = new AIService();
