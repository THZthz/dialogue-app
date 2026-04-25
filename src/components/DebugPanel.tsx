import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, X, ChevronDown, ChevronRight, RefreshCw, Trash2, Bug, 
  GripHorizontal, Copy, Check, MessageSquare, Database, Save, Plus, AlertCircle 
} from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { jsonSchema } from 'codemirror-json-schema';
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
      className={`relative rounded-sm border border-white/10 bg-[#0a0a0a] flex flex-col group/resizable overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
    >
      <div className="flex-1 min-h-0 relative">
        {children}
      </div>
      <div 
        onMouseDown={startResizing}
        className={`h-2 w-full flex items-center justify-center cursor-ns-resize hover:bg-white/5 active:bg-white/10 transition-colors border-t border-white/5 flex-shrink-0 relative z-10 ${isResizing ? 'bg-white/10' : ''}`}
      >
        <div className={`w-12 h-[1px] transition-colors ${isResizing ? 'bg-white/40' : 'bg-white/10 group-hover/resizable:bg-white/20'}`} />
      </div>
    </div>
  );
};

const MESSAGE_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Unique identifier for the message' },
      speaker: { type: 'string', description: 'Name of the entity speaking' },
      type: { 
        enum: ['YOU', 'INNER_VOICE', 'CHARACTER', 'SYSTEM', 'ROLL', 'NOTIFICATION'],
        description: 'Style/category of the message'
      },
      text: { type: 'string', description: 'Content of the message' },
      metadata: {
        type: 'object',
        properties: {
          notificationType: { enum: ['XP', 'TASK', 'ITEM'] }
        }
      }
    },
    required: ['id', 'speaker', 'type', 'text']
  }
};

const ENTITY_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'Unique identifier for the entity' },
    type: { enum: ['OBJECT', 'LOCATION', 'CHARACTER'], description: 'Category of world entity' },
    displayName: { type: 'string', description: 'Friendly name shown in UI' },
    shortDescription: { type: 'string' },
    longDescription: { type: 'string' },
    attributes: { type: 'object', description: 'Additional dynamic properties' },
    stats: { type: 'object', description: 'Numeric character attributes (only for CHARACTER)' },
    opinions: { type: 'object', description: 'Relationship mapping (only for CHARACTER)' }
  },
  required: ['id', 'type', 'displayName']
};

const debugTheme = EditorView.theme({
  "&": {
    fontSize: "11px",
    backgroundColor: "#0d0d0d !important",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-content": {
    fontFamily: "var(--font-mono)",
  },
  ".cm-gutters": {
    backgroundColor: "#0d0d0d !important",
    borderRight: "1px solid rgba(255, 255, 255, 0.05)",
    color: "#4b5563 !important",
    minWidth: "32px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "rgba(255, 255, 255, 0.05) !important",
    color: "#9ca3af !important",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(255, 255, 255, 0.02) !important",
  },
  ".cm-scroller::-webkit-scrollbar": {
    width: "4px",
    height: "4px",
  },
  ".cm-scroller::-webkit-scrollbar-track": {
    background: "transparent",
  },
  ".cm-scroller::-webkit-scrollbar-thumb": {
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "0px",
  },
  ".cm-scroller::-webkit-scrollbar-thumb:hover": {
    background: "rgba(255, 255, 255, 0.15)",
  },
  ".cm-scroller": {
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(255, 255, 255, 0.05) transparent",
  },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(255, 255, 255, 0.1) !important",
  },
  ".cm-tooltip": {
    border: "1px solid rgba(255, 255, 255, 0.1) !important",
    backgroundColor: "#1a1a1a !important",
    backdropFilter: "blur(4px)",
    borderRadius: "2px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
    padding: "4px",
    color: "#e2e8f0",
  },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
    backgroundColor: "rgba(255, 255, 255, 0.1) !important",
    color: "#ffffff !important",
    borderRadius: "2px",
  },
  ".cm-json-schema-tooltip-title": {
    color: "#9081e3",
    fontWeight: "bold",
    marginBottom: "4px",
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
}, { dark: true });

const JsonExplorer: React.FC<{ data: string | null }> = ({ data }) => {
  const [formatted, setFormatted] = useState<string>('');
  const [isJson, setIsJson] = useState(true);

  useEffect(() => {
    if (!data) return;
    try {
      setFormatted(JSON.stringify(JSON.parse(data), null, 2));
      setIsJson(true);
    } catch (e) {
      setFormatted(data);
      setIsJson(false);
    }
  }, [data]);

  if (!data) return <div className="p-4 text-white/30 italic text-[10px] uppercase tracking-widest">Empty_Transmission</div>;
  
  return (
    <div className="h-full bg-[#0d0d0d]">
      <CodeMirror
        value={formatted}
        height="100%"
        theme={oneDark}
        extensions={[json(), debugTheme]}
        readOnly={true}
        editable={false}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: false,
        }}
        className={`h-full text-[11px] ${!isJson ? 'opacity-50 grayscale' : ''}`}
      />
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
      className={`p-1 flex items-center gap-1.5 transition-all ${
        copied 
          ? 'text-[#a3c2a3]' 
          : 'text-white/40 hover:text-white'
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
      <div className="flex items-center justify-between h-9 mb-6">
        <div className="flex items-center gap-2 text-white/60">
          <MessageSquare size={16} />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Dialogue_Buffer</h3>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-3 py-1 bg-[#a3c2a3]/10 text-[#a3c2a3] hover:bg-[#a3c2a3]/20 rounded-sm border border-[#a3c2a3]/20 transition-all disabled:opacity-50"
        >
          <Save size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{isSaving ? 'Syncing...' : 'Sync_Buffer'}</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-sm flex items-center gap-3 text-red-400 text-[11px]">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        <CodeMirror
          value={editingJson}
          height="100%"
          theme={oneDark}
          extensions={[json(), jsonSchema(MESSAGE_SCHEMA), debugTheme]}
          onChange={(value) => setEditingJson(value)}
          className="h-full border border-white/10 rounded-sm overflow-hidden relative z-0"
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: false,
            indentOnInput: true,
          }}
          style={{ fontSize: '11px' }}
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
    <div className="flex h-full overflow-hidden gap-6">
      <div className="w-1/3 flex flex-col border-r border-white/10 pr-6">
        <div className="flex items-center gap-2 h-9 mb-6 text-white/60">
          <Database size={16} />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Entity_Manifest</h3>
        </div>
        <div className="flex-1 overflow-y-auto debug-scrollbar space-y-2">
          {allEntities.map(entity => (
            <button
              key={entity.id}
              onClick={() => selectEntity(entity)}
              className={`w-full text-left p-3 rounded-sm text-[11px] transition-all border ${
                selectedEntityId === entity.id 
                  ? 'bg-white/10 border-white/30 text-white' 
                  : 'bg-white/2 border-transparent text-white/40 hover:bg-white/5 hover:text-white/60'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span className="truncate mr-2">{entity.displayName}</span>
                <span className="text-[8px] opacity-40 px-1 border border-current rounded-sm uppercase flex-shrink-0">{entity.type}</span>
              </div>
              <div className="opacity-30 truncate text-[9px] mt-1 font-mono">{entity.id}</div>
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
            className="w-full text-left p-3 rounded-sm text-[10px] border border-dashed border-white/10 text-white/20 hover:border-white/30 hover:text-white/40 flex items-center gap-2 transition-all uppercase tracking-widest font-bold"
          >
            <Plus size={12} />
            <span>Append_Entity</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedEntityId ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-9 mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-3 py-1 border border-white/5 bg-white/2 rounded-sm truncate max-w-[60%]">
                SUBJECT: {selectedEntityId}
              </h3>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-1 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white rounded-sm border border-white/10 transition-all disabled:opacity-50"
              >
                <Save size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{isSaving ? 'Syncing...' : 'Update_Manifest'}</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-sm flex items-center gap-3 text-red-400 text-[11px]">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="flex-1 min-h-0">
              <CodeMirror
                value={editingJson}
                height="100%"
                theme={oneDark}
                extensions={[json(), jsonSchema(ENTITY_SCHEMA), debugTheme]}
                onChange={(value) => setEditingJson(value)}
                className="h-full border border-white/10 rounded-sm overflow-hidden relative z-0"
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  dropCursor: true,
                  allowMultipleSelections: false,
                  indentOnInput: true,
                }}
                style={{ fontSize: '11px' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/5">
            <Database size={64} className="mb-6 opacity-50" />
            <p className="uppercase tracking-[0.4em] text-[10px] font-bold">Select_Manifest_Entry</p>
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
      className={`px-4 py-3 flex items-center gap-2 border-b transition-all ${
        activeTab === id 
          ? 'border-white text-white bg-white/5' 
          : 'border-transparent text-white/30 hover:text-white/60 hover:bg-white/2'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{label}</span>
    </button>
  );

  return (
    <>
      <button
        id="debug-panel-toggle"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-[#1a1a1a] text-white p-3 rounded-full shadow-2xl z-50 flex items-center justify-center border border-white/10 hover:border-white/40 hover:scale-110 active:scale-95 transition-all"
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
            className="fixed inset-y-0 right-0 w-full md:w-160 bg-[#0a0a0a] text-gray-100 shadow-2xl z-50 flex flex-col border-l border-white/10 font-mono text-sm"
          >
            <div className="flex items-center justify-between px-4 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center">
                <TabButton id="logs" label="Logs" icon={<Terminal size={14} />} />
                <TabButton id="history" label="History" icon={<MessageSquare size={14} />} />
                <TabButton id="world" label="World" icon={<Database size={14} />} />
              </div>
              <div className="flex items-center gap-3 pr-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-sm text-white/40 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 min-h-0 flex flex-col">
              {activeTab === 'logs' && (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex items-center justify-between h-9 mb-6 flex-shrink-0">
                    <div className="flex items-center gap-2 text-white/60">
                      <Terminal size={16} />
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">LLM_TRACE</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={fetchLogs}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-1 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white rounded-sm border border-white/10 transition-all disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Refresh</span>
                      </button>
                      <button
                        onClick={clearLogs}
                        className="flex items-center gap-2 px-3 py-1 bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 rounded-sm border border-white/5 hover:border-red-500/20 transition-all"
                      >
                        <Trash2 size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Clear</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4 overflow-y-auto debug-scrollbar pr-1">
                    {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/10 py-20 grayscale opacity-50">
                      <Bug size={48} className="mb-4" />
                      <p className="uppercase tracking-[0.3em] text-[10px] font-bold">Awaiting_Transmission...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className={`border rounded-sm overflow-hidden transition-all duration-300 ${
                            expandedId === log.id 
                              ? 'border-white/30 bg-white/5' 
                              : 'border-white/10 hover:border-white/20 bg-white/2'
                          }`}
                        >
                          <button
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            className="w-full text-left p-4 flex items-center justify-between gap-4 group"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className={`transition-transform duration-300 ${expandedId === log.id ? 'rotate-0' : '-rotate-90 opacity-40'}`}>
                                <ChevronDown size={14} />
                              </div>
                              <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold tracking-widest uppercase border ${
                                log.status === 'ERROR' ? 'bg-red-500/5 text-red-400 border-red-500/20' : 'bg-white/5 text-white/60 border-white/10'
                              }`}>
                                {log.status}
                              </span>
                              <span className="text-white/30 font-mono text-[10px] tabular-nums tracking-widest">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[10px] opacity-40 group-hover:opacity-100 transition-opacity">
                              <span className="tracking-widest">
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
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden border-t border-white/10"
                              >
                                <div className="divide-y divide-white/5">
                                  <div className="p-5 bg-black/20">
                                    <div className="flex justify-between items-center mb-4">
                                      <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <div className="w-[1px] h-3 bg-[#9081e3]" />
                                        Outgoing_Request
                                      </h3>
                                      <CopyButton content={formatJson(log.request)} />
                                    </div>
                                    <ResizableContainer>
                                      <JsonExplorer data={log.request} />
                                    </ResizableContainer>
                                  </div>
                                  <div className="p-5 bg-black/40">
                                    <div className="flex justify-between items-center mb-4">
                                      <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <div className="w-[1px] h-3 bg-[#a3c2a3]" />
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
                      <div className="pt-12 text-center opacity-10 uppercase tracking-[0.4em] font-bold text-[9px]">
                        [ END_OF_LOG_STREAM ]
                      </div>
                    </div>
                  )}
                  </div>
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

