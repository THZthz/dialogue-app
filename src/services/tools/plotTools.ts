import { tool } from "ai";
import { z } from "zod";

export const updatePlotStatusTool = tool({
  description: "Update the status of an existing plot (e.g. to IN_PROGRESS or RESOLVED)",
  execute: async () => {}, // This is a placeholder since execution is handled in LlmServiceBackend for now
  inputSchema: z.object({
    id: z.string().describe("The ID of the plot to update."),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED']).describe("The new status of the plot.")
  })
});

export const addPlotTool = tool({
  description: "Introduce a new concrete plot in a new location, specifying a clear trigger condition.",
  execute: async () => {}, // Placeholder
  inputSchema: z.object({
    title: z.string().describe("Concise title of the plot/quest."),
    description: z.string().describe("Detailed description of what the plot is about."),
    triggerCondition: z.string().describe("The specific condition or scene that triggers this plot (e.g. 'Enter the tavern').")
  })
});
