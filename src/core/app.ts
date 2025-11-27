import dotenv from "dotenv";
import winston from "winston";
import { configGet } from "./utils/config";

export const serverStartTime: Date = new Date();
dotenv.config();

function loggerOptions(isMod: boolean = false) {
  return {
    format: winston.format.combine(
      winston.format.label({ label: configGet<string>('name') }),
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf(info => {
        return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
      })
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 
        (isMod ? "logs/moderation.log" : "logs/error.log")
        , level: 
        (isMod ? "info" : "error")
      }),
      new winston.transports.File({ filename: "logs/combined.log" })
    ]
  }
}

export const logger = winston.createLogger(loggerOptions());
export const moderation_logger = winston.createLogger(loggerOptions(true));

process.on("uncaughtException", (error: Error) => {
  logger.error(error.message + error.stack.split("\n")[2]);
});