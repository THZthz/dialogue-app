import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, ChevronDown, ChevronRight, RefreshCw, Trash2, Bug, GripHorizontal, Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface LlmLog {
  id: string;
  timestamp: string;
  request: string;
  response: string | null;
  duration: number | null;
  status: string;
}

const ResizableContainer: React.FC<{
  children: React.ReactNode;
  defaultHeight?: number;
  className?: string;
}> = ({ children, defaultHeight = 150, className }) => {
  const [height, setHeight] = useState(defaultHeight);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    setIsResizing(true);
    const startY = mouseDownEvent.clientY;
    const startHeight = height;

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      const newHeight = startHeight + mouseMoveEvent.clientY - startY;
      setHeight(Math.max(80, newHeight));
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [height]);

  return (
    <div 
      className={`relative rounded-md border border-gray-800 bg-gray-950 flex flex-col group/resizable overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
    >
      <div className="flex-1 min-h-0 relative">
        {children}
      </div>
      <div 
        onMouseDown={startResizing}
        className={`h-2.5 w-full flex items-center justify-center cursor-ns-resize hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors border-t border-gray-800/50 flex-shrink-0 relative z-10 ${isResizing ? 'bg-blue-500/30' : ''}`}
      >
        <div className={`w-8 h-1 rounded-full transition-colors ${isResizing ? 'bg-blue-400' : 'bg-gray-800 group-hover/resizable:bg-gray-700'}`} />
      </div>
    </div>
  );
};

const CopyButton: React.FC<{ content: string }> = ({ content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1 rounded transition-all flex items-center gap-1.5 ${
        copied 
          ? 'bg-green-500/20 text-green-400' 
          : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
      }`}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
};

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

  const customStyle = {
    ...vscDarkPlus,
    'pre[class*="language-"]': {
      ...vscDarkPlus['pre[class*="language-"]'],
      margin: 0,
      padding: '0.75rem',
      backgroundColor: 'transparent',
      fontSize: '11px',
      height: '100%',
      overflow: 'auto',
    },
    'code[class*="language-"]': {
      ...vscDarkPlus['code[class*="language-"]'],
      fontSize: '11px',
    }
  };

  return (
    <>
      <button
        id="debug-panel-toggle"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors z-50 flex items-center justify-center border border-gray-700 hover:scale-110 active:scale-95 transition-all"
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
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/90 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Terminal size={18} className="text-blue-400" />
                <h2 className="font-bold tracking-tight text-white">DEBUG_CONSOLEX_LOG</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchLogs}
                  className="p-1.5 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={clearLogs}
                  className="p-1.5 hover:bg-gray-800 rounded-md text-gray-400 hover:text-red-400 transition-colors"
                  title="Clear Logs"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 debug-scrollbar space-y-4">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 italic">
                  <Bug size={48} className="opacity-10 mb-4" />
                  <p>Awaiting LLM transmission...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                        expandedId === log.id 
                          ? 'border-blue-500/50 bg-gray-800/20 ring-1 ring-blue-500/20' 
                          : 'border-gray-800 hover:border-gray-700 bg-gray-900/50'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        className="w-full text-left p-3 flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-1 rounded ${expandedId === log.id ? 'bg-blue-500/20 text-blue-400' : 'text-gray-600 group-hover:text-gray-400'}`}>
                            {expandedId === log.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase ${
                            log.status === 'ERROR' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                          }`}>
                            {log.status}
                          </span>
                          <span className="text-gray-400 font-mono text-xs tabular-nums">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[10px]">
                          <span className={`${(log.duration || 0) > 2000 ? 'text-orange-400' : 'text-gray-500'}`}>
                            {log.duration}ms
                          </span>
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedId === log.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden border-t border-gray-800"
                          >
                            <div className="divide-y divide-gray-800">
                              <div className="p-4 bg-black/20">
                                <div className="flex justify-between items-center mb-2">
                                  <h3 className="text-[10px] font-bold text-blue-500/80 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    Outgoing_Request
                                  </h3>
                                  <CopyButton content={formatJson(log.request)} />
                                </div>
                                <ResizableContainer>
                                  <SyntaxHighlighter
                                    language="json"
                                    style={customStyle as any}
                                    customStyle={{ margin: 0, background: 'transparent' }}
                                    className="debug-scrollbar"
                                  >
                                    {formatJson(log.request)}
                                  </SyntaxHighlighter>
                                </ResizableContainer>
                              </div>
                              <div className="p-4 bg-black/40">
                                <div className="flex justify-between items-center mb-2">
                                  <h3 className="text-[10px] font-bold text-purple-500/80 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                    Incoming_Response
                                  </h3>
                                  <CopyButton content={formatJson(log.response)} />
                                </div>
                                <ResizableContainer>
                                  <SyntaxHighlighter
                                    language="json"
                                    style={customStyle as any}
                                    customStyle={{ margin: 0, background: 'transparent' }}
                                    className="debug-scrollbar"
                                  >
                                    {formatJson(log.response)}
                                  </SyntaxHighlighter>
                                </ResizableContainer>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  <div className="pt-8 text-center opacity-20 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] uppercase tracking-widest">End_of_Transmission_Log</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

