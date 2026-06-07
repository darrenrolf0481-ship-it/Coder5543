const format = {
  combine: (...args: any[]) => ({}),
  timestamp: (...args: any[]) => ({}),
  json: (...args: any[]) => ({}),
  colorize: (...args: any[]) => ({}),
  simple: (...args: any[]) => ({}),
};

const transports = {
  Console: class Console {
    constructor(opts?: any) {}
  },
};

export function createLogger(opts?: any) {
  return {
    info: (message: string, ...meta: any[]) => console.log(message, ...meta),
    error: (message: string, ...meta: any[]) => console.error(message, ...meta),
    warn: (message: string, ...meta: any[]) => console.warn(message, ...meta),
    debug: (message: string, ...meta: any[]) => console.debug(message, ...meta),
    log: (level: string, message: string, ...meta: any[]) => console.log(`[${level}]`, message, ...meta),
  };
}

const winston = {
  format,
  transports,
  createLogger,
};

export default winston;
