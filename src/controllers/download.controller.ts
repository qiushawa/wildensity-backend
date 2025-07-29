import { Request, Response } from 'express';
import { errorResponse } from '../common/response';
import { RESPONSE_CODE } from '../common/code';
import path from 'path';
import fs from 'fs';

export class DownloadController {
    async downloadMonthlyCSV(req: Request, res: Response): Promise<void> {
        const { year, month } = req.params;

        if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month)) {
            return errorResponse(res, RESPONSE_CODE.BAD_REQUEST, '年份或月份格式錯誤，格式應為 yyyy/mm，例如 2025/07');
        }

        const filePath = path.join('records', year, `${month}.csv`);
        if (!fs.existsSync(filePath)) {
            return errorResponse(res, RESPONSE_CODE.NOT_FOUND, '指定的 CSV 檔案不存在');
        }
        const fileName = `records-${year}-${month}.csv`;
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('下載錯誤:', err);
                return errorResponse(res, RESPONSE_CODE.INTERNAL_SERVER_ERROR, '下載檔案時發生錯誤');
            }
        });
    }
}
