

import { RESPONSE_CODE } from '../common/code';
import { prisma } from '../common/database';
import { errorResponse, successResponse } from '../common/response';
import { Request, Response } from 'express';
import { appendRecordToCSV, updateRecordInCSV } from '../util/csv';
interface UpdateRecordRequest{
    count?: number;
    average_speed?: number;
}

export class RecordController {
    async createRecord(req: Request, res: Response): Promise<void> {
        const { deviceId, speciesId } = req.body;
        const areaId = parseInt(req.params.areaId, 10);
        // 檢查設備物種是否存在
        const device = await prisma.device.findUnique({
            where: { device_id_area_id: { device_id: deviceId, area_id: areaId } },
        });
        const species = await prisma.species.findUnique({
            where: { species_id: speciesId }
        });
        if (!device) return errorResponse(res, RESPONSE_CODE.NOT_FOUND, '設備不存在');
        if (!species) return errorResponse(res, RESPONSE_CODE.NOT_FOUND, '物種不存在');

        const record = await prisma.appearance_record.create({
            data: {
                device_id: deviceId,
                area_id: areaId,
                species_id: speciesId,
                count: 1, // 初始計數設為1
                appearance_time: new Date(), // 設置當前時間為出現時間
            }
        });
        // 將記錄追加到CSV文件
        await appendRecordToCSV(record);
        return successResponse(res, RESPONSE_CODE.CREATED, record, '記錄創建成功');
    }

    async updateRecord(req: Request<{ recordId: string }, {}, UpdateRecordRequest>, res: Response): Promise<void> {
        const recordId = parseInt(req.params.recordId, 10);
        const { count, average_speed } = req.body;
        const record = await prisma.appearance_record.update({
            where: { record_id: recordId },
            data: { count, average_speed , leave_time: new Date() } // 更新離開時間為當前時間
        });
        await updateRecordInCSV(record);
        return successResponse(res, RESPONSE_CODE.SUCCESS, record, '記錄更新成功');
    }
}