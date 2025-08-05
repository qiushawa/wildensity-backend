import { prisma } from "../common/database";
import { RESPONSE_CODE } from "../common/code";
import { errorResponse, successResponse } from "../common/response";
import { Request, Response } from "express";
import { Prisma } from "@prisma/client";

export class CoordinatesController {
    // 主函式
    private async calculateAreaBoundary(
        areaId: number
    ): Promise<Prisma.InputJsonValue> {
        // 取得該樣區下所有設備的座標
        const devices = await prisma.device.findMany({
            where: { area_id: areaId },
            select: {
                latitude: true,
                longitude: true,
            },
        });

        // 過濾掉沒有座標的設備
        const points: [number, number][] = devices
            .filter((d) => d.latitude !== null && d.longitude !== null)
            .map((d) => [d.longitude!, d.latitude!]); // GeoJSON 是 [lng, lat]

        if (points.length < 3) {
            // 少於三點無法形成多邊形
            return {
                type: "Polygon",
                coordinates: [points.length > 0 ? [...points, points[0]] : []], // 若只有一點或兩點，仍包成合法格式
            };
        }

        const hull = this.convexHull(points);

        // 將結果轉成 GeoJSON Polygon 格式（要封閉多邊形，首尾需相同）
        const polygon: Prisma.InputJsonValue = {
            type: "Polygon",
            coordinates: [[...hull, hull[0]]],
        };

        return polygon;
    }

    // Graham scan 方式的 2D 凸包演算法（不排序時效會好）
    private convexHull(points: [number, number][]): [number, number][] {
        // 依 x, y 排序
        points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

        const cross = (
            o: [number, number],
            a: [number, number],
            b: [number, number]
        ) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

        const lower: [number, number][] = [];
        for (const p of points) {
            while (
                lower.length >= 2 &&
                cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
            )
                lower.pop();
            lower.push(p);
        }

        const upper: [number, number][] = [];
        for (let i = points.length - 1; i >= 0; i--) {
            const p = points[i];
            while (
                upper.length >= 2 &&
                cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
            )
                upper.pop();
            upper.push(p);
        }

        upper.pop();
        lower.pop();
        return lower.concat(upper);
    }

    // 獲取設備座標
    public async getDeviceCoordinates(req: Request, res: Response): Promise<void> {
        const deviceId = parseInt(req.params.deviceId, 10);
        const areaId = parseInt(req.params.areaId, 10);
        const device = await prisma.device.findUnique({
            where: {
                device_id_area_id: {
                    device_id: deviceId,
                    area_id: areaId,
                },
            },
            select: {
                area_id: true,
                latitude: true,
                longitude: true,
            },
        });
        if (device) {
            return successResponse(res, RESPONSE_CODE.SUCCESS, device);
        }
        return errorResponse(res, RESPONSE_CODE.NOT_FOUND, "設備不存在");
    }

    public async getAreaBoundary(req: Request, res: Response): Promise<void> {
        const areaId = parseInt(req.params.areaId, 10);

        // 查詢樣區邊界資料
        const area = await prisma.area.findUnique({
            where: { area_id: areaId },
            select: {
                boundary: true,
            },
        });

        // 若樣區不存在或沒有邊界資料
        if (!area || !area.boundary) {
            return errorResponse(
                res,
                RESPONSE_CODE.NOT_FOUND,
                "樣區不存在或沒有邊界資料"
            );
        }

        // 確認邊界資料為陣列且點數 > 3（能形成多邊形）
        if (Array.isArray(area.boundary) && area.boundary.length > 3) {
            return successResponse(res, RESPONSE_CODE.SUCCESS, area.boundary);
        }

        // 邊界點數量不足
        return errorResponse(
            res,
            RESPONSE_CODE.BAD_REQUEST,
            "樣區邊界點數量不足，無法形成多邊形"
        );
    }

    // 更新設備座標
    public async updateDeviceCoordinates(
        req: Request,
        res: Response
    ): Promise<void> {
        const deviceId = parseInt(req.params.deviceId, 10);
        const areaId = parseInt(req.params.areaId, 10);
        const { latitude, longitude, location_description } = req.body;
        const updatedDevice = await prisma.device.update({
            where: {
                device_id_area_id: { device_id: deviceId, area_id: areaId }
            },
            data: { latitude, longitude, location_description },
        });
        // 如果更新成功，更新樣區邊界
        if (updatedDevice.area_id) {
            const areaBoundary = await this.calculateAreaBoundary(
                updatedDevice.area_id
            );
            await prisma.area.update({
                where: { area_id: updatedDevice.area_id },
                data: { boundary: areaBoundary },
            });
            return successResponse(
                res,
                RESPONSE_CODE.SUCCESS,
                updatedDevice,
                "設備座標更新成功"
            );
        }
        return errorResponse(
            res,
            RESPONSE_CODE.INTERNAL_SERVER_ERROR,
            "設備座標更新失敗"
        );
    }

    public async updateAreaBoundary(req: Request, res: Response): Promise<void> {
        const areaId = parseInt(req.params.areaId, 10);
        // 確認樣區存在
        const area = await prisma.area.findUnique({
            where: { area_id: areaId },
        });
        if (!area) {
            return errorResponse(res, RESPONSE_CODE.NOT_FOUND, "樣區不存在");
        }
        try {
            const boundary = await this.calculateAreaBoundary(areaId);
            const updatedArea = await prisma.area.update({
                where: { area_id: areaId },
                data: { boundary },
            });
            return successResponse(
                res,
                RESPONSE_CODE.SUCCESS,
                updatedArea,
                "樣區邊界更新成功"
            );
        } catch (error) {
            return errorResponse(
                res,
                RESPONSE_CODE.INTERNAL_SERVER_ERROR,
                "樣區邊界更新失敗"
            );
        }
    }
}
