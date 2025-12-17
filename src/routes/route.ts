import { Router } from 'express'
import speciesRouter from './species.route'
import areaRouter from './area.route'

import { prisma } from '../common/database';

const apiRouter = Router()

apiRouter.use('/species', speciesRouter);
apiRouter.use('/areas', areaRouter);
apiRouter.get('/test', async (req, res) => {
    try {
        const areas = await prisma.area.findMany({ select: { area_id: true }, orderBy: { area_id: 'asc' } });
        const speciesList = await prisma.species.findMany({
            where: { enabled: true },
            orderBy: { species_id: 'asc' }, // Ensure consistent index
            select: { species_id: true }
        });

        const events = await prisma.detectionEvents.findMany({
            select: {
                area_id: true,
                species_id: true,
                start_timestamp: true,
                num_individuals: true
            }
        });

        // Initialize structure for each area
        const resultData = areas.map(area => {
            const hours = Array.from({ length: 24 }, (_, i) => {
                const hourStr = i.toString().padStart(2, '0') + ":00";
                return {
                    time: hourStr,
                    num_individuals: new Array(speciesList.length).fill(0)
                };
            });
            return { areaId: area.area_id, hours };
        });

        // Aggregate counts
        events.forEach(event => {
            if (!event.start_timestamp) return;
            // Note: getHours() returns local hours if the environment is set to local timezone (which it usually is in Node if TZ is set),
            // otherwise it returns system time. Assuming server is in the correct timezone or Date object reflects local time.
            const hour = event.start_timestamp.getHours();

            const areaIdx = resultData.findIndex(d => d.areaId === event.area_id);
            if (areaIdx === -1) return;

            const speciesIdx = speciesList.findIndex(s => s.species_id === event.species_id);
            if (speciesIdx !== -1) {
                // Determine count (default 1 if null, though schema has default 1)
                const count = event.num_individuals ?? 1;
                resultData[areaIdx].hours[hour].num_individuals[speciesIdx] += count; // Using += to sum across all days
            }
        });

        const formattedData = resultData.map(d => d.hours);

        res.json({ data: formattedData });
    } catch (error) {
        console.error('Error fetching event data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


export default apiRouter;
