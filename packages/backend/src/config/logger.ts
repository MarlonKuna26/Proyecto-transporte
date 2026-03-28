/**
 * Sistema de logging centralizado
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

class Logger {
  private logLevel: LogLevel;

  constructor(logLevel: LogLevel = 'debug') {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || logLevel;
  }

  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
    };

    const logString = `[${entry.timestamp}] [${level.toUpperCase()}] ${message}${context ? ` [${context}]` : ''}`;

    switch (level) {
      case 'debug':
        console.debug(logString, data || '');
        break;
      case 'info':
        console.info(logString, data || '');
        break;
      case 'warn':
        console.warn(logString, data || '');
        break;
      case 'error':
        console.error(logString, data || '');
        break;
    }
  }

  debug(message: string, context?: string, data?: any): void {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: any): void {
    this.log('error', message, context, data);
  }
}

export { Logger };
