import { Router } from 'express';
import deviceRouter from './camera.route';
import eventRouter from './events.route';
import { AreaController } from '../controllers/area.controller';
const areaRouter = Router();

const controller = new AreaController();

areaRouter.route('/')
    .get(controller.getAllAreas.bind(controller))
    .post(controller.createArea.bind(controller));

areaRouter.route('/:areaId')
    .get(controller.getArea.bind(controller))
    .delete(controller.deleteArea.bind(controller));

// 樣區頂點資訊
areaRouter.route('/:areaId/coordinates')
    .get(controller.getAreaBoundary.bind(controller))
    .patch(controller.updateAreaBoundary.bind(controller));

// 樣區相機資訊
areaRouter.use('/:areaId/cameras', deviceRouter);

// 接收樣區觀測資料
areaRouter.use('/:areaId/events', eventRouter);


// 樣區物種活動資訊(密度/活動峰值)
areaRouter.route('/:areaId/species/:speciesId');
// 待實現

export default areaRouter;