import { RESPONSE_CODE } from '../common/code';
import { prisma } from '../common/database';
import { errorResponse, successResponse } from '../common/response';
import { Request, Response } from 'express';
import { appendRecordToCSV, updateRecordInCSV } from '../util/csv';

export class EventController {

    async startEvent(req: Request, res: Response): Promise<void> {
        const { cameraId, speciesId, numIndividuals = 1 } = req.body;
        const {areaId} = req.params;

        if (!areaId || !cameraId || !speciesId) {
            return errorResponse(res, RESPONSE_CODE.BAD_REQUEST, "缺少必要欄位");
        }

        try {
            const event = await prisma.detectionEvents.create({
                data: {
                    area_id: parseInt(areaId, 10),
                    camera_id: parseInt(cameraId, 10),
                    species_id: parseInt(speciesId, 10),
                    num_individuals: parseInt(numIndividuals, 10),
                    start_timestamp: new Date(),
                    duration_s: 0,
                    movement_distance_m: 0
                }
            });


            return successResponse(res, RESPONSE_CODE.CREATED, event);
        } catch (error) {
            console.error(error);
            return errorResponse(res, RESPONSE_CODE.INTERNAL_SERVER_ERROR, "無法開始事件");
        }
    }

    async addTrackPoints(req: Request, res: Response): Promise<void> {
        const { eventId } = req.params;
        const { points } = req.body; // [{x,y}, ...]
        console.log(eventId);
        if (!points || !Array.isArray(points) || points.length === 0) {
            return errorResponse(res, RESPONSE_CODE.BAD_REQUEST, "缺少軌跡點");
        }

        try {
            const trackPointsData = points.map((p: any) => ({
                event_id: parseInt(eventId, 10),
                coordinate_x: p.x,
                coordinate_y: p.y
            }));

            await prisma.radarTrackPoint.createMany({ data: trackPointsData });

            return successResponse(res, RESPONSE_CODE.CREATED, "軌跡點已新增");
        } catch (error) {
            console.error(error);
            return errorResponse(res, RESPONSE_CODE.INTERNAL_SERVER_ERROR, "新增軌跡點失敗");
        }
    }

    async endEvent(req: Request, res: Response): Promise<void> {
        const { eventId } = req.params;

        try {
            // 取得事件
            const eventExists = await prisma.detectionEvents.findUnique({
                where: { event_id: parseInt(eventId, 10) }
            });
            if (!eventExists) {
                return errorResponse(res, RESPONSE_CODE.BAD_REQUEST, "該事件不存在");
            }
            // 取得事件所有軌跡點
            const trackPoints = await prisma.radarTrackPoint.findMany({
                where: { event_id: parseInt(eventId, 10) },
            });
            if (trackPoints.length === 0) {
                return errorResponse(res, RESPONSE_CODE.BAD_REQUEST, "該事件沒有軌跡點，無法結束");
            }

            const start = eventExists.start_timestamp!;
            const end = new Date();
            // 計算移動距離
            let movement = 0;
            for (let i = 1; i < trackPoints.length; i++) {
                const dx = trackPoints[i].coordinate_x - trackPoints[i - 1].coordinate_x;
                const dy = trackPoints[i].coordinate_y - trackPoints[i - 1].coordinate_y;
                movement += Math.sqrt(dx * dx + dy * dy);
            }

            // 計算 duration_s（秒）
            const duration_s = (end.getTime() - start.getTime()) / 1000;
            // 更新事件
            const event = await prisma.detectionEvents.update({
                where: { event_id: parseInt(eventId, 10) },
                data: {
                    end_timestamp: end,
                    duration_s,
                    movement_distance_m: movement
                }
            });
            return successResponse(res, RESPONSE_CODE.SUCCESS, event, "事件已結束");
        } catch (error) {
            console.error(error);
            return errorResponse(res, RESPONSE_CODE.INTERNAL_SERVER_ERROR, "結束事件失敗");
        }
    }
}
