import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import CONFIG from '../config/config';

const transport: DailyRotateFile = new DailyRotateFile({
	filename: 'app-%DATE%.log' as string,
	dirname: 'src/storage/log/',
	datePattern: 'YYYY-MM-DD',
	zippedArchive: true,
	maxSize: '20m',
	maxFiles: '14d',
	handleExceptions: true,
	json: true
});


// error < warn < info < verbose < debug < silly
const level = CONFIG.LOG_LEVEL || 'info';

const transports: any = [transport];

if (Number(CONFIG.ENABLE_CONSOLE_LOG)) {
	transports.push(new winston.transports.Console());
}

const logger = winston.createLogger({
	level,
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json(),
		winston.format.prettyPrint()
	),
	transports,
	exceptionHandlers: [
		transport
	],
	rejectionHandlers: [transport]
});

export default logger;
