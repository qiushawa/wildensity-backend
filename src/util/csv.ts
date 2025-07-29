import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { UTF8_BOM, CSV_HEADER } from '../config/config';
interface RecordData {
    record_id: number;
    device_id: number;
    species_id: number;
    count: number | null;
    average_speed: number | null;
    appearance_time: Date;
    leave_time: Date | null;
}

/**
 * 將字段轉換為 CSV 格式，處理特殊字符和引號
 * @param field 欲轉換的字段
 * @returns 處理後的 CSV 字段
 */
function safeValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return ''; // or JSON.stringify(value)
    return String(value);
}

/**
 * 將 RecordData 轉換為 CSV 行
 * @param record 欲轉換的紀錄
 * @returns CSV 格式的行
 */
function toCSVRow(record: RecordData): string {
    return [
        safeValue(record.record_id),
        safeValue(record.device_id),
        safeValue(record.species_id),
        safeValue(record.count),
        safeValue(record.average_speed),
        record.appearance_time.toISOString(),
        record.leave_time ? record.leave_time.toISOString() : ''
    ].join(',');
}


/**
 * 確保目錄存在，若不存在則創建
 * @param dir 欲確保存在的目錄
 */
function ensureDirExists(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}


/**
 * 根據紀錄的 appearance_time 獲取對應的 CSV 檔案路徑
 * @param record 欲獲取檔案路徑的紀錄
 * @returns 檔案路徑
 */
function getFilePath(record: RecordData): string {
    const year = format(record.appearance_time, 'yyyy');
    const month = format(record.appearance_time, 'MM');
    const dir = path.join('records', year);
    ensureDirExists(dir);
    return path.join(dir, `${month}.csv`);
}

/**
 * 寫入 CSV 檔案，包含 UTF-8 BOM 和標題行
 * @param filePath 欲寫入的檔案路徑
 * @param lines 欲寫入的行數組
 */
function writeCSV(filePath: string, lines: string[]) {
    const content = [CSV_HEADER, ...lines].join('\n');
    fs.writeFileSync(filePath, UTF8_BOM + content + '\n', 'utf-8');
}


/**
 * ✅ 新增紀錄到 CSV 檔案
 * 若檔案不存在則創建，並寫入標題行和 BOM
 * 若檔案已存在則追加新紀錄
 * @param record 欲新增的紀錄
 */
export async function appendRecordToCSV(record: RecordData): Promise<void> {
    const filePath = getFilePath(record);
    const row = toCSVRow(record);

    if (!fs.existsSync(filePath)) {
        writeCSV(filePath, [row]); // 新檔案含標題與 BOM
    } else {
        fs.appendFileSync(filePath, row + '\n', 'utf-8'); // 舊檔案不需重複寫入標題
    }
}


/**
 * ✅ 更新 CSV 檔案中的紀錄
 * 根據紀錄的 record_id 更新對應行
 * @param record 欲更新的紀錄
 */
export async function updateRecordInCSV(record: RecordData): Promise<void> {
    const filePath = getFilePath(record);
    if (!fs.existsSync(filePath)) return;

    const raw = fs.readFileSync(filePath, 'utf-8').replace(UTF8_BOM, '');
    const lines = raw.trim().split('\n');

    const dataLines = lines.slice(1); // 去掉標題行
    const updated = dataLines.map(line => {
        const cols = line.split(',');
        const lineRecordId = parseInt(cols[0], 10);
        return !isNaN(lineRecordId) && lineRecordId === record.record_id
            ? toCSVRow(record)
            : line;
    });

    writeCSV(filePath, updated);
}
