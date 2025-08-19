import cron from "node-cron";
import { calculateActivity, calculateDensity } from "util/calculate"; // 你剛寫的函式
import { CRON_A, CRON_D } from "./config/config";


export const DensityCalculation = () => {
    cron.schedule(CRON_A, async () => {
        try {
            console.log(`[${new Date().toISOString()}] 開始計算密度`);
            const result = await calculateDensity(
                "camera_data.csv",
                17,
                31,
                { lower: 0.65, upper: 0.78 }
            );
            console.log("計算結果:", result);
        } catch (err) {
            console.error("計算失敗:", err);
        }
    });
}

export const ActivityCalculation = () => {
    cron.schedule(CRON_D, async () => {
        try {
            console.log(`[${new Date().toISOString()}] 開始計算活動`);
            const result = await calculateActivity(17);
            console.log("計算結果:", result);
        } catch (err) {
            console.error("計算失敗:", err);
        }
    });
}
