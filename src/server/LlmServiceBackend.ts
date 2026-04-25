import { createDeepSeek } from "@ai-sdk/deepseek";
// Try to use Google Gen AI for the plot writer, fallback to deepseek
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, type LanguageModel, tool } from "ai";
import { z } from "zod";
import { WorldState } from "@/types/entities";
import { Message } from "@/types/dialogue";
import { getAllEntities, updateEntity } from "@/server/models/world";
import { getHistory, addMessage, clearHistory } from "@/server/models/history";
import { getAllPlots, addPlot, updatePlotStatus } from "@/server/models/plot";
import { updateWorldStateTool } from "@/services/tools/updateWorldState";
import { addDialogueStepTool } from "@/services/tools/addDialogueStep";
import { addPlotTool } from "@/services/tools/addPlot";
import { updatePlotStatusTool } from "@/services/tools/updatePlotStatus";
import { addLlmLog, updateLlmLog } from "@/server/models/debug";

let googleModelInstance: LanguageModel | null = null;
let deepseekModelInstance: LanguageModel | null = null;

function getGoogleModel(): LanguageModel | null {
  if (!googleModelInstance && process.env.GEMINI_API_KEY) {
    try {
      googleModelInstance = createGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
      })('gemini-3.1-flash-lie-preview');
    } catch (e) {
      console.error("Failed to initialize Google model:", e);
    }
  }
  console.log("Get gemini model.");
  return googleModelInstance;
}

function getDeepSeekModel(): LanguageModel | null {
  if (!deepseekModelInstance && process.env.DEEPSEEK_API_KEY) {
    try {
      deepseekModelInstance = createDeepSeek({
        apiKey: process.env.DEEPSEEK_API_KEY,
      })('deepseek-chat');
    } catch (e) {
      console.error("Failed to initialize DeepSeek model:", e);
    }
  }
  console.log("Get deepseek model.");
  return deepseekModelInstance;
}

// The preferred model is Google if we are running in AI Studio with GEMINI_API_KEY, fallback to deepseek
function getModelInfo(): { model: LanguageModel; name: string } {
  const google = getGoogleModel();
  if (google) return { model: google, name: 'gemini-3.1-flash-lie-preview' };
  
  const deepseek = getDeepSeekModel();
  if (deepseek) return { model: deepseek, name: 'deepseek-chat' };
  
  throw new Error(
    "Missing API Key: Please set GEMINI_API_KEY or DEEPSEEK_API_KEY in the application settings or .env file."
  );
}

export async function generateAIResponse(
  userInput: string,
  history: Message[]
): Promise<any> {
  const worldState = getAllEntities();
  const plots = getAllPlots();

  const activePlots = plots.filter(p => p.status === 'PENDING' || p.status === 'IN_PROGRESS');
  
  const systemInstruction = `
    You are the Game Master for a narrative-driven RPG. 
    SETTING: A dark, gritty medieval world. High-contrast noir aesthetic.
    TONE: Philosophical, cynical, and surreal. Mimic the writing style of Disco Elysium.
    
    ## INTERNAL VOICES
    Use internal voices to represent the player's fractured psyche. 
    - LOGIC: Cold, deductive.
    - RHETORIC: Political, manipulative.
    - VOLITION: Willpower and sanity.
    - INLAND EMPIRE: Imagination, supra-natural hunches.
    - HALF LIGHT: Pure lizard-brain fear.
    - ELECTROCHEMISTRY: Hedonism, desire.

    ## CONTEXT (World State)
    ${JSON.stringify(worldState, null, 2)}
    
    ## PLOTS (Your master plan)
    ${JSON.stringify(activePlots, null, 2)}
    
    You MUST progress these plots. If an IN_PROGRESS plot's trigger condition is met, execute it narratively and change it to RESOLVED or progress it.
    If no plot is active or they are concluded, you can use the 'addPlot' tool to invent a new concrete scene-based plot in a different location.

    ## Dialogue History
    ${history.slice(-10).map(m => `${m.speaker} (${m.type}): ${m.text}`).join('\n')}

    ## MISSION
    The user (YOU) has just said/done: "${userInput}"

    ## Your tools
    1. 'updateWorldState': Use this to change character, location or item properties based on interactions.
    2. 'updatePlotStatus': Use this to advance a plot to IN_PROGRESS or RESOLVED.
    3. 'addPlot': Use this to create a new, concrete plot centered on a specific scene/location, with clear trigger conditions.
    4. 'addDialogueStep': Use this to deliver the final response narratively and present options to the player.

    CRITICAL: You MUST process the story and ultimately call 'addDialogueStep' to output your narrative reply.
  `;

  let finalResponse: any = null;

  const promptText = `The player says: "${userInput}". Process the turn.`;
  const tools = {
    updateWorldState: updateWorldStateTool,
    addDialogueStep: addDialogueStepTool,
    updatePlotStatus: updatePlotStatusTool,
    addPlot: addPlotTool
  };

  const { model, name: modelName } = getModelInfo();

  const startTime = Date.now();
  const logId = addLlmLog({
    system: systemInstruction,
    prompt: promptText,
    model: modelName,
    tools: Object.keys(tools)
  });

  try {
    const result = await generateText({
      model,
      system: systemInstruction,
      prompt: promptText,
      tools
    });

    const duration = Date.now() - startTime;
    updateLlmLog(logId, result, duration, 'SUCCESS');

    if (result.toolCalls) {
    for (const call of result.toolCalls) {
      if (call.toolName === 'updateWorldState') {
        const payload = (call as any).args;
        if (payload && payload.updates) {
          for (const u of payload.updates) {
            updateEntity(u);
          }
        }
      } else if (call.toolName === 'addDialogueStep') {
        finalResponse = { ...(call as any).args };
      } else if (call.toolName === 'updatePlotStatus') {
        const payload = (call as any).args;
        updatePlotStatus(payload.id, payload.status);
      } else if (call.toolName === 'addPlot') {
        const payload = (call as any).args;
        addPlot({
          title: payload.title,
          description: payload.description,
          triggerCondition: payload.triggerCondition
        });
      }
    }
  }

  if (!finalResponse) {
    if (result.text) {
      finalResponse = {
        messages: [{
          speaker: 'SYSTEM',
          type: 'SYSTEM',
          text: result.text
        }],
        options: [{ id: 'opt_1', text: 'Continue', isAiTrigger: true }]
      };
    } else {
      throw new Error("AI failed to return dialogue step.");
    }
  }

  return finalResponse;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    updateLlmLog(logId, { error: error.message, stack: error.stack }, duration, 'ERROR');
    throw error;
  }
}

