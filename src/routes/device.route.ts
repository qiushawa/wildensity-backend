import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller';
const deviceRouter = Router();




const controller = new DeviceController();

deviceRouter.get('/', controller.getAllDevice);

deviceRouter.route('/:deviceId')
    .get(controller.getDevice.bind(controller))
    .post(controller.createDevice.bind(controller))
    .patch(controller.updateDevice.bind(controller))
    .delete(controller.deleteDevice.bind(controller));

export default deviceRouter;