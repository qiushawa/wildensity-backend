import cron from "node-cron";
import { calculateActivity, calculateDensity } from "util/calculate"; // 你剛寫的函式
import { CRON_A, CRON_D } from "./config/config";
import { prisma } from "./common/database";

export const DensityCalculation = () => {
    cron.schedule(CRON_A, async () => {
        try {
            const monthStr="202510";
            console.log("月份:",monthStr);
            console.log(`[${new Date().toISOString()}] 開始計算密度`);
            const result = await calculateDensity(
                10000,1
            );
            // You need to provide the unique density_id for upsert
            /*
            model Density {
    density_id Int    @id @default(autoincrement())
    species_id Int
    area_id    Int
    month      String
    density    Float

    species Species @relation(fields: [species_id], references: [species_id])
    area    Area    @relation(fields: [area_id], references: [area_id])
}
    */
            if (!result.value) throw new Error("No density value calculated");
            const old = await prisma.density.findFirst({
                where: { 
                    area_id: 10000, month: monthStr, species_id: 1
                }
            });
            await prisma.density.upsert({
                where: { 
                    density_id: old ? old.density_id : 0
                },
                update: {
                    density: result.value,
                },
                create: {
                    area_id: 10000,
                    month: monthStr,
                    species_id: 1,
                    density: result.value,
                }
            });
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
