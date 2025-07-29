
import { RESPONSE_CODE } from '@/common/code';
import { prisma } from '@/common/database';
import { errorResponse, successResponse } from '@/common/response';
import { writeOrUpdateRecordToCsv, updateRecordById, AppearanceRecord } from '@/util/csv';
import { Request, Response } from 'express';
interface CreateRecordRequest {
    deviceId: number;
    speciesId: number;
}
interface UpdateRecordRequest{
    count?: number;
    average_speed?: number;
}

export class RecordController {
    async createRecord(req: Request<{}, {}, CreateRecordRequest>, res: Response): Promise<void> {
        const { deviceId, speciesId } = req.body;
        const record = await prisma.appearance_record.create({
            data: {
                device_id: deviceId,
                species_id: speciesId,
                count: 1, // 初始計數設為1
                appearance_time: new Date(), // 設置當前時間為出現時間
            }
        });
        // 將記錄寫入 CSV
        await writeOrUpdateRecordToCsv(record as AppearanceRecord);
        return successResponse(res, RESPONSE_CODE.CREATED, record, '記錄創建成功');
    }

    async updateRecord(req: Request<{ recordId: string }, {}, UpdateRecordRequest>, res: Response): Promise<void> {
        const recordId = parseInt(req.params.recordId, 10);
        const { count, average_speed } = req.body;
        const record = await prisma.appearance_record.update({
            where: { record_id: recordId },
            data: { count, average_speed , leave_time: new Date() } // 更新離開時間為當前時間
        });
        return successResponse(res, RESPONSE_CODE.SUCCESS, record, '記錄更新成功');
    }
}