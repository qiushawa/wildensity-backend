import { prisma } from "../common/database";
import { RESPONSE_CODE } from "../common/code";
import { errorResponse, successResponse } from "../common/response";
import { CoordinatesController } from "./coordinates.controller";
import { Request, Response } from "express";

export class CameraController extends CoordinatesController {

    constructor() {
        super();
    }
    async getAllCamera(req: Request, res: Response): Promise<void> {
        const cameras = await prisma.camera.findMany();
        return successResponse(res, RESPONSE_CODE.SUCCESS, cameras);
    }

    async getCamera(req: Request, res: Response): Promise<void> {
        const cameraId = parseInt(req.params.cameraId, 10);
        const areaId = parseInt(req.params.areaId, 10);
        const camera = await prisma.camera.findUnique({
            where: { camera_id_area_id: { camera_id: cameraId, area_id: areaId } },
        });
        if (camera) return successResponse(res, RESPONSE_CODE.SUCCESS, camera);
        return errorResponse(res, RESPONSE_CODE.NOT_FOUND, "攝影機不存在");
    }

    async createCamera(req: Request, res: Response): Promise<void> {

        const cameraId = parseInt(req.body.cameraId, 10);
        const areaId = parseInt(req.params.areaId, 10);
        const sdCardCapacity = parseInt(req.body.sdCardCapacity, 10);
        if (!cameraId || !areaId) {
            return errorResponse(res, RESPONSE_CODE.BAD_REQUEST, "攝影機ID和樣區ID是必需的");
        }

        const parsedCameraId = cameraId;
        const parsedAreaId = areaId;
        if (isNaN(parsedCameraId) || isNaN(parsedAreaId)) {
            return errorResponse(res, RESPONSE_CODE.BAD_REQUEST, "攝影機ID和樣區ID必須是有效的數字");
        }


        try {
            const existingCamera = await prisma.camera.findUnique({
                where: { camera_id_area_id: { camera_id: parsedCameraId, area_id: parsedAreaId } },
            });

            let existingArea = await prisma.area.findUnique({
                where: { area_id: parsedAreaId },
            });

            if (existingCamera) {
                return errorResponse(res, RESPONSE_CODE.BAD_REQUEST, "攝影機已存在");
            }

            if (!existingArea) {
                existingArea = await prisma.area.create({
                    data: {
                        area_id: parsedAreaId,
                        area_name: `未命名樣區 - ${parsedAreaId}`,
                    },
                });
            }
            const camera = await prisma.camera.create({
                data: {
                    camera_id: parsedCameraId,
                    area_id: existingArea.area_id,
                    latitude: null,
                    longitude: null,
                    sd_card_capacity: sdCardCapacity,
                    sd_card_used_space: 0,
                    camera_name: `未命名攝影機 - ${parsedCameraId}`,
                }
            });

            return successResponse(res, RESPONSE_CODE.CREATED, camera, "攝影機創建成功");
        } catch (error: any) {
            console.error("創建攝影機時發生錯誤：", error.message);
            return errorResponse(res, RESPONSE_CODE.INTERNAL_SERVER_ERROR, "攝影機創建失敗：" + error.message);
        }
    }


    async deleteCamera(req: Request, res: Response): Promise<void> {
        const cameraId = parseInt(req.params.cameraId, 10);
        const areaId = parseInt(req.params.areaId, 10);
        // 檢查裝置是否存在
        const existingcamera = await prisma.camera.findUnique({
            where: { camera_id_area_id: { camera_id: cameraId, area_id: areaId } },
        });
        if (!existingcamera)
            return errorResponse(
                res,
                RESPONSE_CODE.NOT_FOUND,
                "你不能刪除不存在的裝置"
            );
        // 刪除裝置
        const camera = await prisma.camera.delete({
            where: { camera_id_area_id: { camera_id: cameraId, area_id: areaId } },
        });
        if (camera) return successResponse(res, RESPONSE_CODE.SUCCESS);
        return errorResponse(
            res,
            RESPONSE_CODE.INTERNAL_SERVER_ERROR,
            "刪除裝置失敗"
        );
    }

    async updateCamera(req: Request, res: Response): Promise<void> {
        const cameraId = parseInt(req.params.cameraId, 10);
        const areaId = parseInt(req.params.areaId, 10);
        const { cameraName } = req.body;
        console.log("更新攝影機:", cameraId, "樣區:", areaId, "名稱:", cameraName);
        try {
            const camera = await prisma.camera.findUnique({
                where: { camera_id_area_id: { camera_id: cameraId, area_id: areaId } },
            });
            if (!camera) {
                return errorResponse(res, RESPONSE_CODE.NOT_FOUND, "設備不存在");
            }

            const updatedCamera = await prisma.camera.update({
                where: { camera_id_area_id: { camera_id: cameraId, area_id: areaId } },
                data: {
                    camera_name: cameraName,
                },
            });
            return successResponse(res, RESPONSE_CODE.SUCCESS, updatedCamera, "設備更新成功");
        } catch (error) {
            return errorResponse(res, RESPONSE_CODE.INTERNAL_SERVER_ERROR, "設備更新失敗");
        }
    }
}
