import { prisma } from '@/common/database';
import { RESPONSE_CODE } from '@/common/code';
import { errorResponse, successResponse } from '@/common/response';
import { Request, Response } from 'express';

export class DeviceController {

    async getAllDevice(req: Request, res: Response): Promise<void> {
        const devices = await prisma.device.findMany();
        return successResponse(res, RESPONSE_CODE.SUCCESS, devices);
    }

    async getDevice(req: Request, res: Response): Promise<void> {
        const deviceId = parseInt(req.params.deviceId, 10);
        const device = await prisma.device.findUnique({
            where: { device_id: deviceId }
        });
        if (device) return successResponse(res, RESPONSE_CODE.SUCCESS, device);
        return errorResponse(res, RESPONSE_CODE.NOT_FOUND, '設備不存在');
    }

    async createDevice(req: Request, res: Response): Promise<void> {
        const deviceId = parseInt(req.params.deviceId, 10);
        // 檢查是否已存在裝置
        const existingDevice = await prisma.device.findUnique({
            where: { device_id: deviceId }
        });
        if (existingDevice) return errorResponse(res, RESPONSE_CODE.BAD_REQUEST, '設備已存在');
        const device = await prisma.device.create({ data: { device_id: deviceId, } });
        if (device) return successResponse(res, RESPONSE_CODE.CREATED, device, '設備創建成功');
        return errorResponse(res, RESPONSE_CODE.INTERNAL_SERVER_ERROR, '設備創建失敗');
    }

    async updateDevice(req: Request, res: Response): Promise<void> {
        const deviceId = parseInt(req.params.deviceId, 10);
        const device = await prisma.device.update({
            where: { device_id: deviceId },
            data: { ...req.body }
        });
        res.json(device);
    }

    async deleteDevice(req: Request, res: Response): Promise<void> {
        const { deviceId } = req.params;
        // 檢查裝置是否存在
        const existingDevice = await prisma.device.findUnique({
            where: { device_id: parseInt(deviceId, 10) }
        });
        if (!existingDevice) return errorResponse(res, RESPONSE_CODE.NOT_FOUND, '你不能刪除不存在的裝置');
        // 刪除裝置
        const device = await prisma.device.delete({
            where: { device_id: parseInt(deviceId, 10) }
        });
        if (device) return successResponse(res, RESPONSE_CODE.SUCCESS);
        return errorResponse(res, RESPONSE_CODE.INTERNAL_SERVER_ERROR, '刪除裝置失敗');
    }

}