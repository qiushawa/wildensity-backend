import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller';

const deviceRouter = Router({ mergeParams: true });
const controller = new DeviceController();

deviceRouter.route('/')
    .get(controller.getAllDevice.bind(controller))
    .post(controller.createDevice.bind(controller));

deviceRouter.route('/:deviceId')
    .get(controller.getDevice.bind(controller))
    .delete(controller.deleteDevice.bind(controller))
    .patch(controller.updateDevice.bind(controller));


deviceRouter.route('/:deviceId/coordinates')
    .get(controller.getDeviceCoordinates.bind(controller))
    .patch(controller.updateDeviceCoordinates.bind(controller))
export default deviceRouter;