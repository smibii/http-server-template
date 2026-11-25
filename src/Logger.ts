import winston from "winston";
import Config from "./config";

export const serverStartTime: Date = new Date();

function loggerOptions() {
  return {
    format: winston.format.combine(
      winston.format.label({ label: Config.get('name') }),
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf(info => {
        return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
      })
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: `logs/${serverStartTime}.log`,
        level: "info"
      }),
      new winston.transports.File({ filename: "logs/combined.log" })
    ]
  }
}

export const logger = winston.createLogger(loggerOptions());

process.on("uncaughtException", (error: Error) => {
  logger.error(error.message + error.stack.split("\n")[2]);
});