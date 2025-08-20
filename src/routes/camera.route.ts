import { Router } from 'express';
import { CameraController } from '../controllers/camera.controller';

const cameraRouter = Router({ mergeParams: true });
const controller = new CameraController();

cameraRouter.route('/')
    .get(controller.getAllCamera.bind(controller))
    .post(controller.createCamera.bind(controller));

cameraRouter.route('/update-status')
    .patch(controller.updateCamerasStatus.bind(controller));

cameraRouter.route('/:cameraId')
    .get(controller.getCamera.bind(controller))
    .delete(controller.deleteCamera.bind(controller))
    .patch(controller.updateCamera.bind(controller));


cameraRouter.route('/:cameraId/coordinates')
    .get(controller.getCameraCoordinates.bind(controller))
    .patch(controller.updateCameraCoordinates.bind(controller))
export default cameraRouter;