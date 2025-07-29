import fs from 'fs';
import path from 'path';
import { parse, unparse } from 'papaparse';

// 定義 AppearanceRecord 型別
export interface AppearanceRecord {
  record_id: number;
  device_id: number;
  species_id: number;
  count: number;
  average_speed?: number; // 可選欄位
  appearance_time?: Date; // 可選欄位
  leave_time?: Date; // 可選欄位
}

// 確保目錄存在
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// 格式化日期為 CSV 使用的字串
const formatDateToString = (date?: Date): string => {
  return date ? date.toISOString() : '';
};

// 根據 record_id 更新特定資料
export const updateRecordById = async (
  record_id: number,
  updatedFields: Partial<AppearanceRecord>,
  year: number,
  month: number
): Promise<boolean> => {
  try {
    // 定義 CSV 檔案路徑
    const filePath = path.join(
      __dirname,
      '..',
      'storage',
      'records',
      String(year),
      `${String(month).padStart(2, '0')}.csv`
    );

    // 檢查檔案是否存在
    if (!fs.existsSync(filePath)) {
      return false; // 檔案不存在，返回 false 表示更新失敗
    }

    // 讀取現有 CSV 檔案
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parseResult = parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transform: (value, field) => {
        if (field === 'average_speed' && value === '') return undefined;
        if (field === 'appearance_time' || field === 'leave_time') {
          return value ? new Date(value) : undefined;
        }
        if (['record_id', 'device_id', 'species_id', 'count'].includes(String(field))) {
          return parseInt(value, 10);
        }
        return value;
      },
    });

    const records = parseResult.data as AppearanceRecord[];

    // 尋找要更新的記錄
    const recordIndex = records.findIndex((r) => r.record_id === record_id);

    if (recordIndex === -1) {
      return false; // 找不到記錄，返回 false 表示更新失敗
    }

    // 更新指定欄位
    const updatedRecord = {
      ...records[recordIndex],
      ...updatedFields,
      appearance_time: updatedFields.appearance_time
        ? new Date(updatedFields.appearance_time)
        : records[recordIndex].appearance_time,
      leave_time: updatedFields.leave_time
        ? new Date(updatedFields.leave_time)
        : records[recordIndex].leave_time,
    };

    records[recordIndex] = updatedRecord;

    // 將更新後的資料寫回 CSV
    const csvContent = unparse(records, {
      header: true,
      columns: [
        'record_id',
        'device_id',
        'species_id',
        'count',
        'average_speed',
        'appearance_time',
        'leave_time',
      ],
    });

    fs.writeFileSync(filePath, csvContent, 'utf-8');
    return true; // 更新成功
  } catch (error) {
    console.error('Error updating record in CSV:', error);
    throw error;
  }
};

// 將資料寫入/更新 CSV（保留原有功能）
export const writeOrUpdateRecordToCsv = async (record: AppearanceRecord): Promise<void> => {
  try {
    // 從 appearance_time 取得年份和月份
    if (!record.appearance_time) {
      throw new Error('appearance_time is required to write or update a record.');
    }
    const appearanceTime = new Date(record.appearance_time);
    const year = appearanceTime.getFullYear();
    const month = String(appearanceTime.getMonth() + 1).padStart(2, '0');

    // 定義 CSV 檔案路徑
    const filePath = path.join(
      __dirname,
      '..',
      'storage',
      'records',
      String(year),
      `${month}.csv`
    );

    // 確保目錄存在
    ensureDirectoryExists(path.dirname(filePath));

    // 準備要寫入的資料
    const newRecord = {
      record_id: record.record_id,
      device_id: record.device_id,
      species_id: record.species_id,
      count: record.count,
      average_speed: record.average_speed ?? '',
      appearance_time: formatDateToString(record.appearance_time),
      leave_time: formatDateToString(record.leave_time),
    };

    let records: AppearanceRecord[] = [];

    // 檢查檔案是否存在
    if (fs.existsSync(filePath)) {
      // 讀取現有 CSV 檔案
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parseResult = parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transform: (value, field) => {
          if (field === 'average_speed' && value === '') return undefined;
          if (field === 'appearance_time' || field === 'leave_time') {
            return value ? new Date(value) : undefined;
          }
          return value;
        },
      });

      records = parseResult.data as AppearanceRecord[];

      // 檢查是否為更新操作
      const existingRecordIndex = records.findIndex(
        (r) => r.record_id === record.record_id
      );

      if (existingRecordIndex !== -1) {
        // 更新現有記錄
        records[existingRecordIndex] = record;
      } else {
        // 新增記錄
        records.push(record);
      }
    } else {
      // 檔案不存在，直接新增記錄
      records.push(record);
    }

    // 將資料寫回 CSV
    const csvContent = unparse(records, {
      header: true,
      columns: [
        'record_id',
        'device_id',
        'species_id',
        'count',
        'average_speed',
        'appearance_time',
        'leave_time',
      ],
    });

    fs.writeFileSync(filePath, csvContent, 'utf-8');
  } catch (error) {
    console.error('Error writing to CSV:', error);
    throw error;
  }
};

// 從 CSV 讀取記錄（保留原有功能）
export const readRecordsFromCsv = async (year: number, month: number): Promise<AppearanceRecord[]> => {
  try {
    const filePath = path.join(
      __dirname,
      '..',
      'storage',
      'records',
      String(year),
      `${String(month).padStart(2, '0')}.csv`
    );

    if (!fs.existsSync(filePath)) {
      return [];
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parseResult = parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transform: (value, field) => {
        if (field === 'average_speed' && value === '') return undefined;
        if (field === 'appearance_time' || field === 'leave_time') {
          return value ? new Date(value) : undefined;
        }
        if (['record_id', 'device_id', 'species_id', 'count'].includes(String(field))) {
          return parseInt(value, 10);
        }
        return value;
      },
    });

    return parseResult.data as AppearanceRecord[];
  } catch (error) {
    console.error('Error reading from CSV:', error);
    throw error;
  }
};