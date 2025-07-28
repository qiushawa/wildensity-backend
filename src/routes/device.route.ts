import { Router } from 'express';
import { DeviceController } from '../controllers/Device/device.controller';
const deviceRouter = Router();


deviceRouter.get('/', (req, res) => 0);


const controller = new DeviceController();

deviceRouter.route('/:deviceId')
    .get(controller.getDevice)
    .post(controller.createDevice)
    .put(controller.updateDevice)
    .delete(controller.deleteDevice);

deviceRouter.route('/:deviceId/status')
    .get(controller.status.getStatus)
    .put(controller.status.updateStatus);

deviceRouter.route('/:deviceId/position') // 裝置位置
    .get(controller.status.getStatus) // 假設位置也用 status controller 處理
    .put(controller.status.updateStatus); // 假設位置更新也用 status controller 處理

    
export default deviceRouter;