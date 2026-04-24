import { createDeepSeek } from "@ai-sdk/deepseek"; // **VERY IMPORTANT**: Use AI SDK, ignore `genai` if you are gemini.
import { generateText, type LanguageModel, tool } from "ai";
import { z } from "zod";
import { WorldState } from "../types/entities";
import { Message, DialogueStep, SpeakerType } from "../types/dialogue";
import { updateWorldState } from "./tools/updateWorldState";
import { addDialogueStep } from "./tools/addDialogueStep";

export interface AIResponse extends Omit<DialogueStep, 'messages'> {
  messages: {
    speaker: string;
    type: SpeakerType;
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
}



class AIService {
  private model: LanguageModel | null = null;

  private getModel(): LanguageModel {
    if (!this.model) {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new Error("DEEPSEEK_API_KEY is required but not provided in environment variables.");
      }
      const deepseek = createDeepSeek({ apiKey });
      this.model = deepseek("deepseek-chat");
    }
    return this.model;
  }

  async generateResponse(
    userInput: string,
    worldState: WorldState,
    history: Message[]
  ): Promise<AIResponse> {
    const systemInstruction = `
      You are the Game Master for a narrative-driven RPG. 
      SETTING: A dark, gritty medieval world. High-contrast noir aesthetic.
      TONE: Philosophical, cynical, and surreal. Mimic the writing style of Disco Elysium.
      
      ## INTERNAL VOICES
      Use internal voices to represent the player's fractured psyche. 
      - LOGIC: Cold, deductive, often arrogant.
      - RHETORIC: Political, manipulative, loves complex words.
      - VOLITION: The player's willpower and sanity. Encouraging or stern.
      - INLAND EMPIRE: Imagination, supra-natural hunches, weirdness.
      - HALF LIGHT: Pure lizard-brain fear and aggression. Adrenaline.
      - ELECTROCHEMISTRY: Hedonism, desire, addiction.

      ## CONTEXT
      Current World State:
      ${JSON.stringify(worldState, null, 2)}

      ## Dialogue History
      ${history.slice(-10).map(m => `${m.speaker} (${m.type}): ${m.text}`).join('\n')}

      ## MISSION
      The user (YOU) has just said/done: "${userInput}"

      ## Your task
      1. Provide a narrative response.
      2. Use 'updateWorldState' whenever character information, locations, or items change based on the interaction.
      3. Use 'addDialogueStep' to deliver the final response and next possible actions.
      
      CRITICAL: You MUST use the provided tools to interact.
    `;

    try {
      let finalResponse: AIResponse | null = null;
      const accumulatedUpdates: any[] = [];

      const result = await generateText({
        model: this.getModel(),
        system: systemInstruction,
        prompt: `The player says: "${userInput}". Process the turn.`,
        tools: {
          updateWorldState,
          addDialogueStep
        },
      });

      // Handle tool calls from the first turn
      if (result.toolCalls) {
        for (const call of result.toolCalls) {
          if (call.toolName === 'updateWorldState') {
            accumulatedUpdates.push(...(call as any).input.updates);
          } else if (call.toolName === 'addDialogueStep') {
            finalResponse = { ...(call as any).input, worldUpdates: [] };
          }
        }
      }

      if (!finalResponse) {
        throw new Error("The AI failed to generate a dialogue step. Ensure 'addDialogueStep' tool is called.");
      }

      // Re-attach the accumulated world updates
      (finalResponse as AIResponse).worldUpdates = accumulatedUpdates;

      return finalResponse as AIResponse;
    } catch (error) {
      console.error("AIService Error:", error);
      throw error;
    }
  }
}

export const aiService = new AIService();
