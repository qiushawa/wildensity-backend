import { Request, Response } from 'express';

export class StatusController {
  getStatus(req: Request, res: Response) {
    const { deviceId } = req.params;
    res.send(`Status of device ${deviceId}`);
  }

  updateStatus(req: Request, res: Response) {
    const { deviceId } = req.params;
    res.send(`Update status of device ${deviceId}`);
  }
}
