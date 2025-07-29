import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

interface RecordData {
    record_id: number;
    device_id: number;
    species_id: number;
    count: number | null;
    average_speed: number | null;
    appearance_time: Date;
    leave_time: Date | null;
}

const CSV_HEADER = 'record_id,device_id,species_id,count,average_speed,appearance_time,leave_time';

function toCSVRow(record: RecordData): string {
    return [
        record.record_id,
        record.device_id,
        record.species_id,
        record.count ?? '',
        record.average_speed ?? '',
        record.appearance_time.toISOString(),
        record.leave_time ? record.leave_time.toISOString() : ''
    ].join(',');
}

function getFilePath(record: RecordData): string {
    const year = format(record.appearance_time, 'yyyy');
    const month = format(record.appearance_time, 'MM');
    return path.join('storage', 'records', year, `${month}.csv`);
}

// ✅ 寫入新紀錄（追加）
export async function appendRecordToCSV(record: RecordData): Promise<void> {
    const filePath = getFilePath(record);
    const isNewFile = !fs.existsSync(filePath);
    const row = toCSVRow(record);

    const stream = fs.createWriteStream(filePath, { flags: 'a' });
    if (isNewFile) {
        stream.write(CSV_HEADER + '\n');
    }
    stream.write(row + '\n');
    stream.end();
}

// ✅ 更新已有紀錄（根據 record_id）
export async function updateRecordInCSV(record: RecordData): Promise<void> {
    const filePath = getFilePath(record);
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const updatedLines = lines.map((line, index) => {
        if (index === 0) return line; // 保留 header 行

        const cols = line.split(',');

        // 檢查是否為有效數據行，且 record_id 欄位符合
        const lineRecordId = parseInt(cols[0], 10);
        if (!isNaN(lineRecordId) && lineRecordId === record.record_id) {
            return toCSVRow(record); // 替換該筆紀錄
        }

        return line;
    });

    fs.writeFileSync(filePath, updatedLines.join('\n'), 'utf-8');
}