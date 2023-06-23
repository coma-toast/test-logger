"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.winstonLogger = exports.setProcessName = void 0;
const winston_1 = require("winston");
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Sentry = require("winston-transport-sentry-node").default;
const sentryOptions = {
    sentry: {
        dsn: process.env.SENTRY_DSN,
        environment: process.env.ENV
    },
    level: "error"
};
const logDir = (_a = process.env.LOG_DIR) !== null && _a !== void 0 ? _a : "WinstonLogs";
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir);
}
let processName = "default";
function setProcessName(name) {
    processName = name;
}
exports.setProcessName = setProcessName;
const logFormat = winston_1.format.printf((_a) => {
    var _b, _c;
    var { level, message, label, timestamp } = _a, meta = __rest(_a, ["level", "message", "label", "timestamp"]);
    return `${timestamp} (${processName}) [${(_c = (_b = meta.company) !== null && _b !== void 0 ? _b : meta.caller) !== null && _c !== void 0 ? _c : label}] ${level}: ${message}`;
});
exports.winstonLogger = logger(__filename);
function logger(caller) {
    const options = {
        level: "silly",
        exitOnError: false,
        silent: false,
        format: winston_1.format.combine(winston_1.format.label({ label: path_1.default.basename(caller) }), winston_1.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.format.splat(), winston_1.format.prettyPrint(), winston_1.format.json(), logFormat),
        transports: [
            new winston_daily_rotate_file_1.default({
                level: "silly",
                datePattern: "YYYY-MM-DD",
                maxSize: "40m",
                maxFiles: "7",
                filename: `${logDir}/debug-%DATE%.log`
            }),
            new winston_daily_rotate_file_1.default({
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
    return (0, winston_1.createLogger)(options);
}
exports.default = logger;
//# sourceMappingURL=index.js.map