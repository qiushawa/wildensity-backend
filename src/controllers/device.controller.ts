import { prisma } from "../common/database";
import { RESPONSE_CODE } from "../common/code";
import { errorResponse, successResponse } from "../common/response";
import { CoordinatesController } from "./coordinates.controller";
import { Request, Response } from "express";

export class DeviceController extends CoordinatesController {

    constructor() {
        super(); // 初始化 CoordinatesController
    }
    async getAllDevice(req: Request, res: Response): Promise<void> {
        const devices = await prisma.device.findMany();
        return successResponse(res, RESPONSE_CODE.SUCCESS, devices);
    }

    async getDevice(req: Request, res: Response): Promise<void> {
        const deviceId = parseInt(req.params.deviceId, 10);
        const areaId = parseInt(req.params.areaId, 10);
        const device = await prisma.device.findUnique({
            where: { device_id_area_id: { device_id: deviceId, area_id: areaId } },
        });
        if (device) return successResponse(res, RESPONSE_CODE.SUCCESS, device);
        return errorResponse(res, RESPONSE_CODE.NOT_FOUND, "設備不存在");
    }

    async createDevice(req: Request, res: Response): Promise<void> {

        const deviceId = parseInt(req.body.deviceId, 10);
        const areaId = parseInt(req.params.areaId, 10);
        if (!deviceId || !areaId) {
            return errorResponse(res, RESPONSE_CODE.BAD_REQUEST, "設備ID和樣區ID是必需的");
        }

        const parsedDeviceId = deviceId;
        const parsedAreaId = areaId;
        if (isNaN(parsedDeviceId) || isNaN(parsedAreaId)) {
            return errorResponse(res, RESPONSE_CODE.BAD_REQUEST, "設備ID和樣區ID必須是有效的數字");
        }


        try {
            const existingDevice = await prisma.device.findUnique({
                where: { device_id_area_id: { device_id: parsedDeviceId, area_id: parsedAreaId } },
            });

            let existingArea = await prisma.area.findUnique({
                where: { area_id: parsedAreaId },
            });

            if (existingDevice) {
                return errorResponse(res, RESPONSE_CODE.BAD_REQUEST, "設備已存在");
            }

            if (!existingArea) {
                existingArea = await prisma.area.create({
                    data: {
                        area_id: parsedAreaId,
                        area_name: `未命名樣區 - ${parsedAreaId}`,
                    },
                });
            }
            const device = await prisma.device.create({
                data: {
                    device_id: parsedDeviceId,
                    area_id: existingArea.area_id,
                    device_name: `未命名設備 - ${parsedDeviceId}`,
                }
            });

            return successResponse(res, RESPONSE_CODE.CREATED, device, "設備創建成功");
        } catch (error: any) {
            console.error("創建設備時發生錯誤：", error.message);
            return errorResponse(res, RESPONSE_CODE.INTERNAL_SERVER_ERROR, "設備創建失敗：" + error.message);
        }
    }


    async deleteDevice(req: Request, res: Response): Promise<void> {
        const deviceId = parseInt(req.params.deviceId, 10);
        const areaId = parseInt(req.params.areaId, 10);
        // 檢查裝置是否存在
        const existingDevice = await prisma.device.findUnique({
            where: { device_id_area_id: { device_id: deviceId, area_id: areaId } },
        });
        if (!existingDevice)
            return errorResponse(
                res,
                RESPONSE_CODE.NOT_FOUND,
                "你不能刪除不存在的裝置"
            );
        // 刪除裝置
        const device = await prisma.device.delete({
            where: { device_id_area_id: { device_id: deviceId, area_id: areaId } },
        });
        if (device) return successResponse(res, RESPONSE_CODE.SUCCESS);
        return errorResponse(
            res,
            RESPONSE_CODE.INTERNAL_SERVER_ERROR,
            "刪除裝置失敗"
        );
    }
}
