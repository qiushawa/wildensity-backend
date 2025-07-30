// src/scheduler/task.ts
import cron from 'node-cron';
import { calculateActivity } from '../util/rscript';

export function updateActivityTask() {
    cron.schedule('* * * * *', async () => {
        await calculateActivity();
    });
}
