import { Router } from 'express';
import { DeviceController } from '../controllers/Device/device.controller';
const deviceRouter = Router();




const controller = new DeviceController();

deviceRouter.get('/', controller.getAllDevice);

deviceRouter.route('/:deviceId')
    .get(controller.getDevice)
    .post(controller.createDevice)
    .patch(controller.updateDevice)
    .delete(controller.deleteDevice);
    
export default deviceRouter;