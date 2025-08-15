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
const UPDATE_ACTIVITY = {
	cron: '0 0 * * *', // 每天00:00執行
	// cron: '* * * * *', // 每分鐘執行，開發時使用
	task: 'updateActivityTask',
	description: '更新活動計算結果'
};

const CAMERA_RAD = 2.0944 // 相機偵測弧度 (±60°)
export { CONFIG, UTF8_BOM, CSV_HEADER, UPDATE_ACTIVITY, CAMERA_RAD }
