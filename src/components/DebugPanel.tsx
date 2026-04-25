import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, ChevronDown, ChevronRight, RefreshCw, Trash2, Bug } from 'lucide-react';

interface LlmLog {
  id: string;
  timestamp: string;
  request: string;
  response: string | null;
  duration: number | null;
  status: string;
}

export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LlmLog[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      await fetch('/api/debug/logs/clear', { method: 'POST' });
      setLogs([]);
    } catch (error) {
      console.error("Failed to clear logs:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const formatJson = (jsonStr: string | null) => {
    if (!jsonStr) return 'N/A';
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch (e) {
      return jsonStr;
    }
  };

  return (
    <>
      <button
        id="debug-panel-toggle"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors z-50 flex items-center justify-center border border-gray-700"
        title="Open Debug Panel"
      >
        <Bug size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="debug-panel-modal"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed inset-y-0 right-0 w-full md:w-160 bg-gray-900 text-gray-100 shadow-2xl z-50 flex flex-col border-l border-gray-700 font-mono text-sm"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
              <div className="flex items-center gap-2">
                <Terminal size={18} className="text-blue-400" />
                <h2 className="font-bold">LLM Debug Console</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchLogs}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={clearLogs}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors"
                  title="Clear Logs"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {logs.length === 0 ? (
                <div className="text-center py-20 text-gray-500 italic">
                  No logs recorded yet.
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`border rounded overflow-hidden transition-colors ${
                        expandedId === log.id ? 'border-gray-600 bg-gray-800/50' : 'border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        className="w-full text-left p-3 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {expandedId === log.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span className={`${log.status === 'ERROR' ? 'text-red-400' : 'text-green-400'} text-[10px] font-bold uppercase`}>
                            {log.status}
                          </span>
                          <span className="text-gray-400 truncate text-xs">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-gray-500">{log.duration}ms</span>
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedId === log.id && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 pt-0 space-y-4">
                              <section>
                                <h3 className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-1">
                                  Request
                                </h3>
                                <pre className="bg-black/50 p-2 rounded text-[11px] overflow-x-auto border border-gray-800 max-h-60">
                                  {formatJson(log.request)}
                                </pre>
                              </section>
                              <section>
                                <h3 className="text-xs font-bold text-purple-400 mb-1 flex items-center gap-1">
                                  Response
                                </h3>
                                <pre className="bg-black/50 p-2 rounded text-[11px] overflow-x-auto border border-gray-800 max-h-80">
                                  {formatJson(log.response)}
                                </pre>
                              </section>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
