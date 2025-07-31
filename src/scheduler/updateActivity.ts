// src/scheduler/task.ts
import cron from 'node-cron';
import { UPDATE_ACTIVITY } from '../config/config';
import { calculateActivity } from '../util/rscript';
import { prisma } from '../common/database';
export function updateActivityTask() {
    cron.schedule(UPDATE_ACTIVITY.cron, async () => {
        const speciesList = await prisma.species.findMany({
            select: { species_id: true }
        });
        if (speciesList.length === 0) {
            console.warn('沒有物種可供計算活動');
            return;
        }
        console.log('開始更新AK計算結果');
        for (const { species_id } of speciesList) {
            try {
                await calculateActivity(species_id);
                console.log(`物種 ${species_id} 的AK計算已完成`);
            } catch (error) {
                console.error(`更新物種 ${species_id} AK計算時出錯:`, error);
            }
        }
        console.log('所有物種的AK計算已完成');
    });
}
