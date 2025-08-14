import { Router } from 'express';
import { RecordController } from '../controllers/record.controller';
const recordRouter = Router({ mergeParams: true });

const controller = new RecordController();
// todo: 重寫紀錄功能
export default recordRouter;
