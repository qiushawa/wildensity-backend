import cron from "node-cron";
import { calculateActivity, calculateDensity } from "util/calculate"; // 你剛寫的函式
import { CRON_A, CRON_D } from "./config/config";
import { prisma } from "./common/database";

export const DensityCalculation = () => {
    cron.schedule(CRON_A, async () => {
        try {
            console.log(`[${new Date().toISOString()}] 開始計算密度`);
            const result = await calculateDensity(
                10000,1
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
            const speciesIds = await prisma.species.findMany({
                select: { species_id: true }
            });
            for (const { species_id } of speciesIds) {
                const result = await calculateActivity(species_id);
                console.log("計算結果:", result);
            }
        } catch (err) {
            console.error("計算失敗:", err);
        }
    });
}
