import { Router } from 'express'
import speciesRouter from './species.route'
import areaRouter from './area.route'

const apiRouter = Router()

apiRouter.use('/species', speciesRouter);
apiRouter.use('/areas', areaRouter);
apiRouter.get('/test', (req, res) => {
const sampleData = [
    [ // 雪霸國家公園
        { time: "00:00", num_individuals: [1, 0, 2] },
        { time: "01:00", num_individuals: [1, 0, 3] },
        { time: "02:00", num_individuals: [0, 0, 2] },
        { time: "03:00", num_individuals: [0, 0, 2] },
        { time: "04:00", num_individuals: [1, 0, 1] },
        { time: "05:00", num_individuals: [3, 1, 1] },
        { time: "06:00", num_individuals: [4, 3, 0] },
        { time: "07:00", num_individuals: [5, 4, 0] },
        { time: "08:00", num_individuals: [4, 5, 0] },
        { time: "09:00", num_individuals: [3, 5, 0] },
        { time: "10:00", num_individuals: [2, 6, 0] },
        { time: "11:00", num_individuals: [2, 6, 0] },
        { time: "12:00", num_individuals: [1, 5, 0] },
        { time: "13:00", num_individuals: [1, 4, 0] },
        { time: "14:00", num_individuals: [1, 3, 0] },
        { time: "15:00", num_individuals: [2, 5, 0] },
        { time: "16:00", num_individuals: [3, 6, 0] },
        { time: "17:00", num_individuals: [5, 4, 0] },
        { time: "18:00", num_individuals: [4, 2, 1] },
        { time: "19:00", num_individuals: [3, 0, 3] },
        { time: "20:00", num_individuals: [2, 0, 3] },
        { time: "21:00", num_individuals: [1, 0, 2] },
        { time: "22:00", num_individuals: [0, 0, 2] },
        { time: "23:00", num_individuals: [0, 0, 3] }
    ],
    [ // 玉山國家公園
        { time: "00:00", num_individuals: [1, 0, 2] },
        { time: "01:00", num_individuals: [1, 0, 2] },
        { time: "02:00", num_individuals: [0, 0, 2] },
        { time: "03:00", num_individuals: [0, 0, 2] },
        { time: "04:00", num_individuals: [1, 0, 1] },
        { time: "05:00", num_individuals: [2, 0, 1] },
        { time: "06:00", num_individuals: [3, 1, 0] },
        { time: "07:00", num_individuals: [4, 3, 0] },
        { time: "08:00", num_individuals: [4, 4, 0] },
        { time: "09:00", num_individuals: [3, 5, 0] },
        { time: "10:00", num_individuals: [2, 5, 0] },
        { time: "11:00", num_individuals: [2, 6, 0] },
        { time: "12:00", num_individuals: [1, 6, 0] },
        { time: "13:00", num_individuals: [1, 5, 0] },
        { time: "14:00", num_individuals: [1, 4, 0] },
        { time: "15:00", num_individuals: [2, 5, 0] },
        { time: "16:00", num_individuals: [3, 4, 0] },
        { time: "17:00", num_individuals: [4, 3, 0] },
        { time: "18:00", num_individuals: [3, 1, 1] },
        { time: "19:00", num_individuals: [2, 0, 2] },
        { time: "20:00", num_individuals: [1, 0, 2] },
        { time: "21:00", num_individuals: [0, 0, 2] },
        { time: "22:00", num_individuals: [0, 0, 2] },
        { time: "23:00", num_individuals: [0, 0, 3] }
    ]
];

    const response = {
        data: sampleData
    };
    res.json(response);
});

export default apiRouter;
