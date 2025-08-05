import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller';

const deviceRouter = Router();
const controller = new DeviceController();

deviceRouter.route('/')
    .get(controller.getAllDevice.bind(controller))
    .post(controller.createDevice.bind(controller));

deviceRouter.route('/:deviceId') // 不允許直接更新設備資料
    .get(controller.getDevice.bind(controller))
    .delete(controller.deleteDevice.bind(controller));


deviceRouter.route('/:deviceId/coordinates')
    .get(controller.getDeviceCoordinates.bind(controller))
    .patch(controller.updateDeviceCoordinates.bind(controller))
export default deviceRouter;