// src/scheduler/task.ts
import cron from 'node-cron';
import { UPDATE_ACTIVITY } from '../config/config';
import { calculateActivity } from '../util/rscript';

export function updateActivityTask() {
    cron.schedule(UPDATE_ACTIVITY.cron, async () => {
        await calculateActivity();
    });
}
