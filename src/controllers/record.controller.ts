

import { RESPONSE_CODE } from '../common/code';
import { prisma } from '../common/database';
import { errorResponse, successResponse } from '../common/response';
import { Request, Response } from 'express';
import { appendRecordToCSV, updateRecordInCSV } from '../util/csv';

export class RecordController {
    // todo: 重寫紀錄功能
}