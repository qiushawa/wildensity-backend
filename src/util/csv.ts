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


const CSV_HEADER = '紀錄編號,設備編號,物種編號,數量,平均速度,出現時間,離開時間';
const UTF8_BOM = '\uFEFF';

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

function ensureDirExists(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function getFilePath(record: RecordData): string {
    const year = format(record.appearance_time, 'yyyy');
    const month = format(record.appearance_time, 'MM');
    const dir = path.join('records', year);
    ensureDirExists(dir);
    return path.join(dir, `${month}.csv`);
}

// 共用寫入函數，包含 BOM
function writeCSV(filePath: string, lines: string[]) {
    const content = [CSV_HEADER, ...lines].join('\n');
    fs.writeFileSync(filePath, UTF8_BOM + content + '\n', 'utf-8');
}

// ✅ 寫入新紀錄（追加）
export async function appendRecordToCSV(record: RecordData): Promise<void> {
    const filePath = getFilePath(record);
    const row = toCSVRow(record);

    if (!fs.existsSync(filePath)) {
        writeCSV(filePath, [row]); // 新檔案含標題與 BOM
    } else {
        fs.appendFileSync(filePath, row + '\n', 'utf-8'); // 舊檔案不需重複寫入標題
    }
}

// ✅ 更新已有紀錄（根據 record_id）
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
