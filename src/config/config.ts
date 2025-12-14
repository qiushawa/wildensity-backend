import 'dotenv/config'

const CONFIG = {
	PORT: process.env.PORT,
	LOG_LEVEL: process.env.LOG_LEVEL,
	ENABLE_CONSOLE_LOG: process.env.ENABLE_CONSOLE_LOG,
	RECORDS_DIR: process.env.RECORDS_DIR || 'records', // 預設紀錄目錄
}

const UTF8_BOM = '\uFEFF';
const CSV_HEADER = 'record_id,device_id,count,average_speed,appearance_time,leave_time';
// 任務設定

const CRON_A =  '0 0 0 * * *'; // 每天0點執行
// const CRON_D = '0 0 0 1 * *';
const CRON_D = '0 0 0 * * *'; // 每天0點執行

const CAMERA_RAD = 2.0944 // 相機偵測弧度 (±60°)
export { CONFIG, UTF8_BOM, CSV_HEADER, CRON_A, CRON_D, CAMERA_RAD }
