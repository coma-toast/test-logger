import { createLogger, format, LoggerOptions, Logger } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";
import { SentryTransportOptions } from "winston-transport-sentry-node";
const Sentry = require("winston-transport-sentry-node").default;

const sentryOptions: SentryTransportOptions = {
    sentry: {
        dsn: process.env.SENTRY_DSN,
        environment: process.env.ENV
    },
    level: "error"
};

const logDir = process.env.LOG_DIR ?? "WinstonLogs";
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

let processName = "default";
export function setProcessName(name: string) {
    processName = name;
}

const logFormat = format.printf(
    ({ level, message, label, timestamp, ...meta }) => {
        return `${timestamp} (${processName}) [${meta.company ?? meta.caller ?? label
            }] ${level}: ${message}`;
    }
);

export const winstonLogger = logger(__filename);

export default function logger(caller: string): Logger {
    const options: LoggerOptions = {
        level: "silly",
        exitOnError: false,
        silent: false,

        format: format.combine(
            format.label({ label: path.basename(caller) }),
            format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            format.splat(),
            format.prettyPrint(),
            format.json(),
            logFormat
        ),

        transports: [
            new DailyRotateFile({
                level: "silly",
                datePattern: "YYYY-MM-DD",
                maxSize: "40m",
                maxFiles: "7",
                filename: `${logDir}/debug-%DATE%.log`
            }),
            new DailyRotateFile({
                level: "error",
                datePattern: "YYYY-MM-DD",
                maxSize: "40m",
                maxFiles: "7",
                filename: `${logDir}/error-%DATE%.log`
            }),
            new Sentry(sentryOptions)
        ]

        // ! Due to a Winston bug, we cannot use defaultMeta as
        // ! it ALWAYS overrides the child logger meta
        // ! (even though it should not)
        // ! https://github.com/winstonjs/winston/issues/2029
        // ! we can uncomment this when that bug is fixed.
        // ! The format function has a ternary as a workaround
        // defaultMeta: {
        //     company: "---"
        // }
    };

    return createLogger(options);
}
