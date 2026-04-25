import db from "@/server/database";
import { v4 as uuidv4 } from "uuid";

export interface LlmLog {
  id: string;
  timestamp: string;
  request: string;
  response: string | null;
  duration: number | null;
  status: string;
}

export function addLlmLog(request: any): string {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO llm_logs (id, request, status)
    VALUES (?, ?, ?)
  `).run(id, JSON.stringify(request), 'PENDING');
  return id;
}

export function updateLlmLog(id: string, response: any, duration: number, status: string = 'SUCCESS') {
  db.prepare(`
    UPDATE llm_logs
    SET response = ?, duration = ?, status = ?
    WHERE id = ?
  `).run(JSON.stringify(response), duration, status, id);
}

export function getLlmLogs(limit: number = 50): LlmLog[] {
  return db.prepare(`
    SELECT * FROM llm_logs
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit) as LlmLog[];
}

export function clearLlmLogs() {
  db.prepare("DELETE FROM llm_logs").run();
}
