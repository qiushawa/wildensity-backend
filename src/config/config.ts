import 'dotenv/config'

const CONFIG = {
	PORT: process.env.PORT,
	LOG_LEVEL: process.env.LOG_LEVEL,
	ENABLE_CONSOLE_LOG: process.env.ENABLE_CONSOLE_LOG,
	RECORDS_DIR: process.env.RECORDS_DIR || 'records',
}

const UTF8_BOM = '\uFEFF';
const CSV_HEADER = '紀錄編號,設備編號,物種編號,數量,平均速度,出現時間,離開時間';

export { CONFIG, UTF8_BOM, CSV_HEADER }
