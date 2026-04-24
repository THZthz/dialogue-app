import express from "express";
import { generateAIResponse } from "./LlmServiceBackend.js";
import { getAllEntities, seedDatabase } from "./worldModel.js";
import { getHistory, addMessage, clearHistory } from "./historyModel.js";
import { getAllPlots } from "./plotModel.js";

const apiRouter = express.Router();

// Ensure DB is seeded
seedDatabase();

apiRouter.get("/world", (req, res) => {
  res.json(getAllEntities());
});

apiRouter.get("/plots", (req, res) => {
  res.json(getAllPlots());
});

apiRouter.get("/history", (req, res) => {
  res.json(getHistory());
});

apiRouter.post("/reset", (req, res) => {
  import("./db.js").then(({ default: db }) => {
    db.prepare("DELETE FROM history_messages").run();
    db.prepare("DELETE FROM plots").run();
    db.prepare("DELETE FROM entities").run();
    seedDatabase();
    res.json({ success: true });
  });
});

apiRouter.post("/chat", async (req, res) => {
  try {
    const { userInput, history } = req.body;
    
    // Save user message to DB
    const lastMsg = history[history.length - 1]; // This is the YOU message
    if (lastMsg && lastMsg.type === 'YOU') {
      addMessage(lastMsg);
    }
    
    // Process with AI
    const rawResponse = await generateAIResponse(userInput, history);
    
    // Save AI messages to DB
    if (rawResponse && rawResponse.messages) {
      rawResponse.messages.forEach((msg: any, i: number) => {
        addMessage({
          ...msg,
          id: `ai-\${Date.now()}-\${i}`
        });
      });
    }

    res.json(rawResponse);
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default apiRouter;
