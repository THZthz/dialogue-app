import { createDeepSeek } from "@ai-sdk/deepseek"; // **VERY IMPORTANT**: Use AI SDK, ignore `genai` if you are gemini.
import { generateObject, type LanguageModel } from "ai";
import { z } from "zod";
import { WorldState } from "../types/entities";
import { Message, DialogueStep, SpeakerType } from "../types/dialogue";

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

const aiResponseSchema = z.object({
  id: z.string().describe("A unique ID for this generated dialogue step (e.g., 'scene_aftermath_1')."),
  messages: z.array(z.object({
    speaker: z.string().describe("Character name, or one of the internal voices: 'LOGIC', 'RHETORIC', 'VOLITION', 'INLAND_EMPIRE', 'HALF_LIGHT', 'ELECTROCHEMISTRY', etc. Use 'INNER_VOICE' for generic psyce commentary."),
    type: z.enum(["YOU", "INNER_VOICE", "CHARACTER", "SYSTEM", "ROLL"]).describe("The category of the message. Use 'INNER_VOICE' for all internal voices/thoughts."),
    text: z.string().describe("Markdown supported. Use [Object Name](#object_id) for reactive world entities. Emphasize physical sensations and philosophical dread."),
    skillCheck: z.object({
      skill: z.string().describe("The name of the internal voice or skill that was just passively checked."),
      difficulty: z.string().describe("Difficulty label (e.g., 'Challenging', 'Easy')."),
      success: z.boolean().describe("Result of the passive check.")
    }).nullish().describe("Only include if the AI decides a passive skill check just happened.")
  })).describe("The narrative flow of the response. Use multiple messages for pacing, alternating between external dialogue and inner monologue."),
  worldUpdates: z.array(z.object({
    id: z.string().describe("The unique ID of the entity to update (e.g., 'madam_vespera')."),
    longDescription: z.string().nullish().describe("New detailed observation."),
    shortDescription: z.string().nullish().describe("New concise label."),
    attributes: z.record(z.string(), z.string()).nullish().describe("Physical or mental traits."),
    opinions: z.record(z.string(), z.string()).nullish().describe("How they feel about YOU (the player) or others.")
  })).describe("State changes to persist in the world memory."),
  options: z.array(z.object({
    id: z.string().describe("Unique option ID (e.g., 'opt_demand_truth')."),
    text: z.string().describe("User-facing label. Include [Skill: Difficulty] prefix if it's a skill-gated action."),
    isAiTrigger: z.boolean().describe("Set to TRUE to continue the dynamic AI conversation loop. Set to FALSE to jump to static content."),
    nextStepId: z.string().nullish().describe("Required if isAiTrigger is FALSE. Must match a static scene ID like 'start' or 'leave'."),
    check: z.object({
      skill: z.string().describe("The internal name of the skill used for the active check."),
      difficulty: z.number().describe("The numeric target to roll (e.g., 10, 15)."),
      difficultyText: z.string().describe("The flavor name for the difficulty (e.g., 'Hard')."),
      diceCount: z.number().describe("Usually 2 (rolling 2d6)."),
      conditions: z.array(z.object({
        expression: z.string().describe("JS condition: 'total' (dice sum), 'success' (total >= difficulty), and 'dice' (array). Example: 'success', 'dice[0] === 1 && dice[1] === 1'."),
        stepId: z.string().describe("The ID of the generated step to move to if met."),
        label: z.string().nullish().describe("Label for the roll outcome."),
        color: z.string().nullish().describe("Tailwind color class (e.g., 'text-red-500').")
      }))
    }).nullish().describe("Active skill checks the player must roll for.")
  })).describe("Suggestions for the player's next move.")
});

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
      
      INTERNAL VOICES: Use internal voices to represent the player's fractured psyche. 
      - LOGIC: Cold, deductive, often arrogant.
      - RHETORIC: Political, manipulative, loves complex words.
      - VOLITION: The player's willpower and sanity. Encouraging or stern.
      - INLAND EMPIRE: Imagination, supra-natural hunches, weirdness.
      - HALF LIGHT: Pure lizard-brain fear and aggression. Adrenaline.
      - ELECTROCHEMISTRY: Hedonism, desire, addiction.
      
      CONTEXT:
      Current World State:
      ${JSON.stringify(worldState, null, 2)}
20: 
      Dialogue History:
      ${history.slice(-10).map(m => `${m.speaker} (${m.type}): ${m.text}`).join('\n')}
20: 
      MISSION:
      The user (YOU) has just said/done: "${userInput}"
20: 
      Your task:
      1. Provide a narrative response. Use multiple messages.
      2. Intersperse the dialogue with 1-2 INTERNAL VOICE interjections that react to the situation or the player's choice.
      3. Use 'ObjectLink' style if you mention any world objects (e.g., [Name](#id)).
      4. If the player learns something new about a person or place, update the 'worldUpdate' array.
      5. Provide 3-4 dialogue options. At least one should be an active skill check (using 'check' property).
      
      CRITICAL: You MUST return a JSON object with "id", "messages", "worldUpdates", and "options". 
      Use Speaker Types: "YOU", "INNER_VOICE", "CHARACTER", "SYSTEM", "ROLL". 
      Internal voices MUST have type "INNER_VOICE" but their speaker name should be the skill (e.g., "LOGIC").
    `;

    try {
      const { object } = await generateObject({
        model: this.getModel(),
        system: systemInstruction,
        prompt: `The player says: "${userInput}". Generate the GM response as structured JSON.`,
        schema: aiResponseSchema,
      });

      return object as AIResponse;
    } catch (error) {
      console.error("AIService Error:", error);
      throw error;
    }
  }
}

export const aiService = new AIService();
