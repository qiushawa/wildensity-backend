import { StatusController } from './status.controller';
import { Request, Response } from 'express';

export class DeviceController {
    public status: StatusController;

    constructor() {
    this.status = new StatusController();
    }

    getDevice(req: Request, res: Response) {
    const { deviceId } = req.params;
    res.send(`GET device ${deviceId}`);
    }

    createDevice(req: Request, res: Response) {
        const { deviceId } = req.params;
        res.send(`POST device ${deviceId}`);
    }

    updateDevice(req: Request, res: Response) {
        const { deviceId } = req.params;
        res.send(`PUT device ${deviceId}`);
    }

    deleteDevice(req: Request, res: Response) {
        const { deviceId } = req.params;
        res.send(`DELETE device ${deviceId}`);
    }

}