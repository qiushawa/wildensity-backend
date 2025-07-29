import { Router } from 'express';
import { DownloadController } from '../controllers/download.controller';

const downloadRouter = Router();
const controller = new DownloadController();

downloadRouter.get('/:year/:month', controller.downloadMonthlyCSV.bind(controller));

export default downloadRouter;