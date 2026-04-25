import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, X, ChevronDown, ChevronRight, RefreshCw, Trash2, Bug, 
  GripHorizontal, Copy, Check, MessageSquare, Database, Save, Plus, AlertCircle 
} from 'lucide-react';
import { Message } from '@/types/dialogue';
import { WorldState, WorldEntity } from '@/types/entities';

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

const JsonNode: React.FC<{
  label?: string;
  value: any;
  depth: number;
  isLast?: boolean;
}> = ({ label, value, depth, isLast = true }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const hasChildren = value !== null && typeof value === 'object';
  const isEmpty = hasChildren && (Array.isArray(value) ? value.length === 0 : Object.keys(value).length === 0);

  const renderValue = () => {
    if (value === null) return <span className="text-gray-500">null</span>;
    if (typeof value === 'string') return <span className="text-emerald-400">"{value}"</span>;
    if (typeof value === 'number') return <span className="text-amber-400">{value}</span>;
    if (typeof value === 'boolean') return <span className="text-purple-400 font-bold">{value.toString()}</span>;
    
    if (Array.isArray(value)) {
       if (isEmpty) return <span className="text-gray-600">[]</span>;
       
       return isExpanded ? (
         <span>
           <span className="text-gray-500">[</span>
           <div className="pl-4 border-l border-gray-800/50 ml-1.5 my-0.5">
             {value.map((v, i) => (
               <JsonNode key={i} value={v} depth={depth + 1} isLast={i === value.length - 1} />
             ))}
           </div>
           <span className="text-gray-500">]</span>
         </span>
       ) : (
         <button 
          onClick={() => setIsExpanded(true)}
          className="text-gray-500 hover:text-blue-400 bg-gray-800/30 px-1 rounded transition-colors text-[10px]"
         >
           [{value.length} items]
         </button>
       );
    }
    
    // Object
    if (isEmpty) return <span className="text-gray-600">{"{}"}</span>;

    return isExpanded ? (
      <span>
        <span className="text-gray-500">{"{"}</span>
        <div className="pl-4 border-l border-gray-800/50 ml-1.5 my-0.5">
          {Object.entries(value).map(([k, v], i, arr) => (
            <JsonNode key={k} label={k} value={v} depth={depth + 1} isLast={i === arr.length - 1} />
          ))}
        </div>
        <span className="text-gray-500">{"}"}</span>
      </span>
    ) : (
      <button 
        onClick={() => setIsExpanded(true)}
        className="text-gray-500 hover:text-blue-400 bg-gray-800/30 px-1 rounded transition-colors text-[10px]"
      >
        {"{ " + Object.keys(value).slice(0, 2).join(', ') + (Object.keys(value).length > 2 ? '...' : '') + " }"}
      </button>
    );
  };

  return (
    <div className="font-mono text-[11px] leading-relaxed group/node">
      <div className="flex items-start">
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">
          {hasChildren && !isEmpty && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-gray-500 hover:text-blue-400 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
            >
              <ChevronDown size={12} />
            </button>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {label && (
            <span className="text-sky-400 mr-2 group-hover/node:text-sky-300 transition-colors">
              <span className="opacity-50">"</span>{label}<span className="opacity-50">"</span>
              <span className="text-gray-600 ml-1">:</span>
            </span>
          )}
          {renderValue()}
          {!isLast && <span className="text-gray-600">,</span>}
        </div>
      </div>
    </div>
  );
};

const JsonExplorer: React.FC<{ data: string | null }> = ({ data }) => {
  const [parsed, setParsed] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    try {
      setParsed(JSON.parse(data));
      setError(null);
    } catch (e) {
      setError(data);
    }
  }, [data]);

  if (!data) return <div className="p-4 text-gray-600 italic text-xs">Empty Transmission</div>;
  
  if (error) {
    return (
      <div className="p-3 h-full overflow-auto debug-scrollbar bg-black/40">
        <pre className="text-red-400/80 text-[11px] font-mono whitespace-pre-wrap leading-relaxed">
          {error}
        </pre>
      </div>
    );
  }

  if (!parsed) return null;

  return (
    <div className="p-3 h-full overflow-auto debug-scrollbar bg-black/20">
      <JsonNode value={parsed} depth={0} />
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

const HistoryEditor: React.FC = () => {
  const [history, setHistory] = useState<Message[]>([]);
  const [editingJson, setEditingJson] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        setEditingJson(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      setError("Failed to load history");
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const parsed = JSON.parse(editingJson);
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      if (res.ok) {
        setHistory(parsed);
        alert("History synchronization successful");
      } else {
        throw new Error(await res.text());
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500/80">Dialogue_Buffer</h3>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-md border border-emerald-500/30 transition-all disabled:opacity-50"
        >
          <Save size={14} />
          <span className="text-[10px] font-bold uppercase">{isSaving ? 'Syncing...' : 'Sync_Buffer'}</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-3 text-red-400 text-[11px]">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        <textarea
          value={editingJson}
          onChange={(e) => setEditingJson(e.target.value)}
          className="w-full h-full bg-black/40 border border-gray-800 rounded-md p-4 font-mono text-[11px] text-gray-300 focus:outline-none focus:border-emerald-500/50 resize-none debug-scrollbar"
          spellCheck={false}
        />
      </div>
    </div>
  );
};

const WorldEditor: React.FC = () => {
  const [world, setWorld] = useState<WorldState | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [editingJson, setEditingJson] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorld = async () => {
    try {
      const res = await fetch('/api/world');
      if (res.ok) {
        setWorld(await res.json());
      }
    } catch (e) {
      setError("Failed to load world state");
    }
  };

  useEffect(() => { fetchWorld(); }, []);

  const selectEntity = (entity: WorldEntity) => {
    setSelectedEntityId(entity.id);
    setEditingJson(JSON.stringify(entity, null, 2));
    setError(null);
  };

  const handleSave = async () => {
    if (!selectedEntityId) return;
    setIsSaving(true);
    setError(null);
    try {
      const parsed = JSON.parse(editingJson);
      const res = await fetch('/api/world/entity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      if (res.ok) {
        await fetchWorld();
        alert("Entity synchronization successful");
      } else {
        throw new Error(await res.text());
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const allEntities = world ? [
    ...Object.values(world.characters),
    ...Object.values(world.locations),
    ...Object.values(world.objects)
  ] : [];

  return (
    <div className="flex h-full overflow-hidden gap-4">
      <div className="w-1/3 flex flex-col border-r border-gray-800 pr-4">
        <div className="flex items-center gap-2 mb-4">
          <Database size={16} className="text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-blue-500/80">Entity_Manifest</h3>
        </div>
        <div className="flex-1 overflow-y-auto debug-scrollbar space-y-1">
          {allEntities.map(entity => (
            <button
              key={entity.id}
              onClick={() => selectEntity(entity)}
              className={`w-full text-left p-2 rounded-md text-[11px] transition-all border ${
                selectedEntityId === entity.id 
                  ? 'bg-blue-500/10 border-blue-500/50 text-blue-300' 
                  : 'bg-gray-800/20 border-transparent text-gray-500 hover:bg-gray-800/40 hover:text-gray-300'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>{entity.displayName}</span>
                <span className="text-[9px] opacity-50 px-1 border border-current rounded uppercase">{entity.type}</span>
              </div>
              <div className="opacity-50 truncate text-[10px] mt-0.5">{entity.id}</div>
            </button>
          ))}
          <button
            onClick={() => {
              const newId = `new_entity_${Date.now()}`;
              selectEntity({
                id: newId,
                type: 'OBJECT',
                displayName: 'New Entity',
                shortDescription: '',
                longDescription: '',
                attributes: {}
              } as WorldEntity);
            }}
            className="w-full text-left p-2 rounded-md text-[11px] border border-dashed border-gray-700 text-gray-600 hover:border-gray-500 hover:text-gray-400 flex items-center gap-2 transition-all"
          >
            <Plus size={12} />
            <span>Append_Entity</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedEntityId ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Subject: {selectedEntityId}</h3>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-md border border-blue-500/30 transition-all disabled:opacity-50"
              >
                <Save size={14} />
                <span className="text-[10px] font-bold uppercase">{isSaving ? 'Syncing...' : 'Update_Manifest'}</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-3 text-red-400 text-[11px]">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="flex-1 min-h-0">
              <textarea
                value={editingJson}
                onChange={(e) => setEditingJson(e.target.value)}
                className="w-full h-full bg-black/40 border border-gray-800 rounded-md p-4 font-mono text-[11px] text-gray-300 focus:outline-none focus:border-blue-500/50 resize-none debug-scrollbar"
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600 italic">
            <Database size={40} className="opacity-10 mb-4" />
            <p>Select manifest entry to edit...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'history' | 'world'>('logs');
  const [logs, setLogs] = useState<LlmLog[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    if (activeTab !== 'logs') return;
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
    if (isOpen && activeTab === 'logs') {
      fetchLogs();
    }
  }, [isOpen, activeTab]);

  const formatJson = (jsonStr: string | null) => {
    if (!jsonStr) return 'N/A';
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch (e) {
      return jsonStr;
    }
  };

  const TabButton: React.FC<{ 
    id: 'logs' | 'history' | 'world', 
    label: string, 
    icon: React.ReactNode 
  }> = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-all ${
        activeTab === id 
          ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
          : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );

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
            <div className="flex items-center justify-between px-4 border-b border-gray-700 bg-gray-900/90 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center">
                <TabButton id="logs" label="Logs" icon={<Terminal size={14} />} />
                <TabButton id="history" label="History" icon={<MessageSquare size={14} />} />
                <TabButton id="world" label="World" icon={<Database size={14} />} />
              </div>
              <div className="flex items-center gap-3 pr-4">
                {activeTab === 'logs' && (
                  <>
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
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 debug-scrollbar min-h-0">
              {activeTab === 'logs' && (
                <div className="space-y-4">
                  {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 italic py-20">
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
                                      <JsonExplorer data={log.request} />
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
                                      <JsonExplorer data={log.response} />
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
              )}

              {activeTab === 'history' && <HistoryEditor />}
              {activeTab === 'world' && <WorldEditor />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

