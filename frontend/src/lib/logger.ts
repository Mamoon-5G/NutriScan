import * as Sentry from "@sentry/react";

type LogLevel = "debug" | "info" | "warn" | "error";

const IS_PROD = import.meta.env.PROD;

class Logger {
  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, data?: unknown) {
    if (!IS_PROD) {
      console.debug(this.formatMessage("debug", message), data !== undefined ? data : "");
    }
  }

  info(message: string, data?: unknown) {
    if (!IS_PROD) {
      console.info(this.formatMessage("info", message), data !== undefined ? data : "");
    }
    // Could send to analytics service here
  }

  warn(message: string, data?: unknown) {
    console.warn(this.formatMessage("warn", message), data !== undefined ? data : "");
    
    if (IS_PROD) {
      Sentry.captureMessage(message, {
        level: "warning",
        extra: data ? { data } : undefined,
      });
    }
  }

  error(message: string, error?: unknown, data?: unknown) {
    console.error(this.formatMessage("error", message), error !== undefined ? error : "", data !== undefined ? data : "");
    
    if (IS_PROD) {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: { message, ...((data as Record<string, unknown>) || {}) },
        });
      } else {
        Sentry.captureMessage(message, {
          level: "error",
          extra: { error, ...((data as Record<string, unknown>) || {}) },
        });
      }
    }
  }
}

export const logger = new Logger();
