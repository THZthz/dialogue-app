import express from "express";
import { generateAIResponse } from "@/server/LlmServiceBackend";
import { getAllEntities, seedDatabase, upsertEntity } from "@/server/models/world";
import { getHistory, addMessage, clearHistory, setHistory } from "@/server/models/history";
import { getAllPlots } from "@/server/models/plot";
import { getLlmLogs, clearLlmLogs } from "@/server/models/debug";

const apiRouter = express.Router();

// Ensure DB is seeded
seedDatabase();

apiRouter.get("/world", (req, res) => {
  res.json(getAllEntities());
});

apiRouter.post("/world/entity", (req, res) => {
  try {
    upsertEntity(req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/plots", (req, res) => {
  res.json(getAllPlots());
});

apiRouter.get("/history", (req, res) => {
  res.json(getHistory());
});

apiRouter.post("/history", (req, res) => {
  try {
    setHistory(req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/debug/logs", (req, res) => {
  res.json(getLlmLogs());
});

apiRouter.post("/debug/logs/clear", (req, res) => {
  clearLlmLogs();
  res.json({ success: true });
});

apiRouter.post("/reset", (req, res) => {
  import("@/server/database").then(({ default: db }) => {
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
