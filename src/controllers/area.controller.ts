import { prisma } from "../common/database";
import { RESPONSE_CODE } from "../common/code";
import { errorResponse, successResponse } from "../common/response";
import { Request, Response } from "express";
import logger from "../util/logger";
import { CoordinatesController } from "./coordinates.controller";
interface GeoJSONPolygon {
    type: "Polygon";
    coordinates: number[][][];
}
export class AreaController extends CoordinatesController {
    constructor() {
        super(); // 初始化 CoordinatesController
    }
    async getArea(req: Request, res: Response): Promise<void> {
        const areaId = parseInt(req.params.areaId, 10);
        const area = await prisma.area.findUnique({
            where: { area_id: areaId },
        });
        if (area) return successResponse(res, RESPONSE_CODE.SUCCESS, area);
        return errorResponse(res, RESPONSE_CODE.NOT_FOUND, "樣區不存在");
    }

async getAllAreas(req: Request, res: Response): Promise<void> {
    const areas = await prisma.area.findMany({
        include: {
            devices: true, // 包含設備資訊
        }
    });

    const areasWithCircles = areas.map(area => {
        let circle: any = undefined;

        try {
            // 確保 boundary 存在且為物件
            if (area.boundary) {
                const boundary = area.boundary as unknown as GeoJSONPolygon;

                if (boundary?.type === 'Polygon') {
                    circle = this.polygonToCircleFromGeoJSON(boundary);
                }
            }
        } catch (error) {
            console.error(`計算樣區 ${area.area_id} 的圓心半徑失敗:`, error);
        }

        return {
            ...area,
            circle, // 沒有就 undefined
        };
    });

    return successResponse(res, RESPONSE_CODE.SUCCESS, areasWithCircles);
}


    async createArea(req: Request, res: Response): Promise<void> {
        const { areaId, areaName } = req.body;
        if (!areaId) {
            return errorResponse(res, RESPONSE_CODE.BAD_REQUEST, "樣區ID是必需的");
        }
        const parsedAreaId = parseInt(areaId, 10);
        if (isNaN(parsedAreaId)) {
            return errorResponse(
                res,
                RESPONSE_CODE.BAD_REQUEST,
                "樣區ID必須是有效的數字"
            );
        }
        try {
            const existingArea = await prisma.area.findUnique({
                where: { area_id: parsedAreaId },
            });
            if (existingArea) {
                return errorResponse(res, RESPONSE_CODE.BAD_REQUEST, "樣區已存在");
            }
            const newArea = await prisma.area.create({
                data: {
                    area_id: parsedAreaId,
                    area_name: areaName,
                },
            });
            return successResponse(
                res,
                RESPONSE_CODE.SUCCESS,
                newArea,
                "樣區創建成功"
            );
        } catch (error) {
            logger.error("Error creating area:", error);
            return errorResponse(
                res,
                RESPONSE_CODE.INTERNAL_SERVER_ERROR,
                "內部服務器錯誤"
            );
        }
    }

    async deleteArea(req: Request, res: Response): Promise<void> {
        const areaId = parseInt(req.params.areaId, 10);
        try {
            const deletedArea = await prisma.area.delete({
                where: { area_id: areaId },
            });
            return successResponse(
                res,
                RESPONSE_CODE.SUCCESS,
                deletedArea,
                "樣區刪除成功"
            );
        } catch (error) {
            console.error("Error deleting area:", error);
            return errorResponse(
                res,
                RESPONSE_CODE.INTERNAL_SERVER_ERROR,
                "內部服務器錯誤"
            );
        }
    }

    async getAreaDevices(req: Request, res: Response): Promise<void> {
        const areaId = parseInt(req.params.areaId, 10);
        const devices = await prisma.device.findMany({
            where: { area_id: areaId },
        });
        return successResponse(res, RESPONSE_CODE.SUCCESS, devices);
    }



}
