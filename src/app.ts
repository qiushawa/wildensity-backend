import express, { Application, NextFunction, Request, Response } from 'express';
import 'reflect-metadata';
import bodyParser from 'body-parser';
import apiRouter from './routes/route';
import { errorResponse } from './common/response';
import { RESPONSE_CODE } from './common/code';
import {CONFIG} from './config/config';
import logger from './util/logger';
import cors from 'cors';
import './common/database';
import { DensityCalculation, ActivityCalculation } from 'scheduler'

const app: Application = express();
const port = CONFIG.PORT;

app.use(
	cors({
		origin: '*',
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		credentials: true,
		optionsSuccessStatus: 200
	})
);
app.use(bodyParser.json());
app.set('view engine', 'pug');
// logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
	const start = Date.now();
	res.on('finish', () => {
		const elapsed = Date.now() - start;
		const log = {
			level: 'info',
			message: `${req.method} ${req.path} ${req.url} ${res.statusCode} ${elapsed}ms`
		};
		logger.log(log);
	})
	next();
});
// 靜態資源
app.use('/public', express.static('src/public'));

// API 路由
app.use('/api', apiRouter);



app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
	const message = err.message || 'Internal Server Error';
	const stack = err.stack || '';
	const timestamp = new Date().toISOString();

	logger.error({
		level: 'error',
		message,
		stack,
		timestamp
	});
	errorResponse(res, RESPONSE_CODE.INTERNAL_SERVER_ERROR);
	next();
});

app.listen(port, async () => {
	console.log(`http://127.0.0.1:${port}`);
	// DensityCalculation();
	ActivityCalculation();
});
