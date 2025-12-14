import cron from "node-cron";
import { calculateActivity, calculateDensity } from "@/calculate"; // 你剛寫的函式
import { CRON_A, CRON_D } from "./config/config";
import { prisma } from "./common/database";

export const DensityCalculation = () => {
    cron.schedule(CRON_A, async () => {
        try {
            const monthStr = (() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                return `${year}${month}`;
            })();
            console.log("月份:", monthStr);
            console.log(`[${new Date().toISOString()}] 開始計算密度`);
            const areas = await prisma.area.findMany({
                select: { area_id: true }
            });
            for (const { area_id } of areas) {
                const speciesIds = await prisma.species.findMany({
                    select: { species_id: true }
                });
                for (const { species_id } of speciesIds) {
                    const result = await calculateDensity(
                        area_id,
                        species_id
                    );
                    if (!result.value) throw new Error("No density value calculated");
                    const old = await prisma.density.findFirst({
                        where: {
                            area_id, month: monthStr, species_id
                        }
                    });
                    await prisma.density.upsert({
                        where: {
                            density_id: old ? old.density_id : 0
                        },
                        create: {
                            area_id,
                            species_id,
                            month: monthStr,
                            density: result.value,

                        },
                        update: {
                            density: result.value,
                        }
                    });
                    console.log(`Area ${area_id}, Species ${species_id}, Density:`, result);
                }
            }
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
