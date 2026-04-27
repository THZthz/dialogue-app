export type LogLevel = 'log' | 'info' | 'warn' | 'error';

export interface ConsoleLog {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: number;
  args: any[];
}

type LogListener = (log: ConsoleLog) => void;

class ConsoleLogger {
  private logs: ConsoleLog[] = [];
  private listeners: Set<LogListener> = new Set();
  private originalConsole: Partial<Record<LogLevel, (...args: any[]) => void>> = {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    const levels: LogLevel[] = ['log', 'info', 'warn', 'error'];
    
    levels.forEach(level => {
      this.originalConsole[level] = console[level].bind(console);
      
      console[level] = (...args: any[]) => {
        // Call original
        this.originalConsole[level]?.(...args);
        
        // Capture log
        const log: ConsoleLog = {
          id: Math.random().toString(36).substring(2, 9),
          level,
          message: args.map(arg => {
            if (typeof arg === 'string') return arg;
            try {
              return JSON.stringify(arg, null, 2);
            } catch (e) {
              return String(arg);
            }
          }).join(' '),
          timestamp: Date.now(),
          args
        };
        
        this.logs.push(log);
        if (this.logs.length > 1000) {
          this.logs.shift();
        }

        // Persist to server
        fetch('/api/debug/console', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: log.level,
            message: log.message,
            args: log.args
          })
        }).catch(err => {
          // Fallback to original console to avoid infinite loop if this fails
          this.originalConsole.error?.('Failed to persist console log:', err);
        });
        
        this.listeners.forEach(listener => listener(log));
      };
    });
  }

  getLogs() {
    return [...this.logs];
  }

  setLogs(logs: ConsoleLog[]) {
    this.logs = logs;
    this.listeners.forEach(listener => listener({} as ConsoleLog)); // Trigger update
  }

  async clearLogs() {
    this.logs = [];
    try {
      await fetch('/api/debug/console/clear', { method: 'POST' });
    } catch (err) {
      this.originalConsole.error?.('Failed to clear persisted console logs:', err);
    }
    this.listeners.forEach(listener => listener({} as ConsoleLog));
  }

  subscribe(listener: LogListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const consoleLogger = new ConsoleLogger();
