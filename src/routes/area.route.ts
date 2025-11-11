import { Router } from 'express';
import deviceRouter from './camera.route';
import eventRouter from './events.route';
import { AreaController } from '../controllers/area.controller';

// prisma
import { prisma } from "../common/database";
import { Response } from 'express-serve-static-core';
import { successResponse } from '@/common/response';
import { RESPONSE_CODE } from '@/common/code';

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

areaRouter.route('/info/all')
    .get(controller.getAllAreasInfo.bind(controller));
        // 取得所有樣區及其邊界資訊

export default areaRouter;

