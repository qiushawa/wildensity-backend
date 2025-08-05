import { Router } from 'express';
import { RecordController } from '../controllers/record.controller';
const recordRouter = Router({ mergeParams: true });

const controller = new RecordController();
recordRouter.route('/')
    .post(controller.createRecord.bind(controller));

recordRouter.route('/:recordId')
    .patch(controller.updateRecord.bind(controller));

export default recordRouter;
