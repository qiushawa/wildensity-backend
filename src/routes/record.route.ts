import { Router } from 'express';
import { RecordController } from '../controllers/record.controller';
const recordRouter = Router();

const controller = new RecordController();
recordRouter.route('/')
    .post(controller.createRecord);

recordRouter.route('/:recordId')
    .patch(controller.updateRecord);

export default recordRouter;
