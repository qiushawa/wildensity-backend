import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
const eventRouter = Router({ mergeParams: true });

const controller = new EventController();

eventRouter.post('/', controller.startEvent.bind(controller));             // 開始事件
eventRouter.post('/:eventId/track', controller.addTrackPoints.bind(controller)); // 新增軌跡點
eventRouter.patch('/:eventId/end', controller.endEvent.bind(controller));        // 結束事件
export default eventRouter;
