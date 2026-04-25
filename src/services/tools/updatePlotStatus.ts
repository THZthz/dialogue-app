import { tool } from "ai";
import { z } from "zod";

export const updatePlotStatusTool = tool({
  description: "Update the status of an existing plot (e.g. to IN_PROGRESS or RESOLVED)",
  execute: async () => { }, // This is a placeholder since execution is handled in LlmServiceBackend for now
  inputSchema: z.object({
    id: z.string().describe("The ID of the plot to update."),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED']).describe("The new status of the plot.")
  })
});