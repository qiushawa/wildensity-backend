import { Router } from 'express'
import speciesRouter from './species.route'
import areaRouter from './area.route'

const apiRouter = Router()

apiRouter.use('/species', speciesRouter);
apiRouter.use('/areas', areaRouter);
apiRouter.get('/test', (req, res) => {
    const sampleData = [
        [
            { "time": "00:00", "num_individuals": [28, 0, 100] },
            { "time": "01:00", "num_individuals": [47, 0, 132] },
            { "time": "02:00", "num_individuals": [0, 0, 98] },
            { "time": "03:00", "num_individuals": [0, 0, 134] },
            { "time": "04:00", "num_individuals": [29, 0, 29] },
            { "time": "05:00", "num_individuals": [78, 32, 40] },
            { "time": "06:00", "num_individuals": [168, 144, 0] },
            { "time": "07:00", "num_individuals": [125, 172, 0] },
            { "time": "08:00", "num_individuals": [200, 245, 0] },
            { "time": "09:00", "num_individuals": [135, 200, 0] },
            { "time": "10:00", "num_individuals": [60, 150, 0] },
            { "time": "11:00", "num_individuals": [88, 132, 0] },
            { "time": "12:00", "num_individuals": [25, 180, 0] },
            { "time": "13:00", "num_individuals": [45, 140, 0] },
            { "time": "14:00", "num_individuals": [44, 111, 0] },
            { "time": "15:00", "num_individuals": [76, 195, 0] },
            { "time": "16:00", "num_individuals": [141, 270, 0] },
            { "time": "17:00", "num_individuals": [245, 196, 0] },
            { "time": "18:00", "num_individuals": [148, 50, 46] },
            { "time": "19:00", "num_individuals": [111, 0, 144] },
            { "time": "20:00", "num_individuals": [86, 0, 75] },
            { "time": "21:00", "num_individuals": [50, 0, 86] },
            { "time": "22:00", "num_individuals": [0, 0, 86] },
            { "time": "23:00", "num_individuals": [0, 0, 147] }
        ],
        [
            { "time": "00:00", "num_individuals": [38, 0, 116] },
            { "time": "01:00", "num_individuals": [40, 0, 104] },
            { "time": "02:00", "num_individuals": [0, 0, 138] },
            { "time": "03:00", "num_individuals": [0, 0, 133] },
            { "time": "04:00", "num_individuals": [29, 0, 48] },
            { "time": "05:00", "num_individuals": [98, 0, 47] },
            { "time": "06:00", "num_individuals": [123, 40, 0] },
            { "time": "07:00", "num_individuals": [188, 144, 0] },
            { "time": "08:00", "num_individuals": [156, 200, 0] },
            { "time": "09:00", "num_individuals": [126, 135, 0] },
            { "time": "10:00", "num_individuals": [70, 200, 0] },
            { "time": "11:00", "num_individuals": [50, 222, 0] },
            { "time": "12:00", "num_individuals": [28, 294, 0] },
            { "time": "13:00", "num_individuals": [39, 225, 0] },
            { "time": "14:00", "num_individuals": [39, 144, 0] },
            { "time": "15:00", "num_individuals": [100, 175, 0] },
            { "time": "16:00", "num_individuals": [147, 144, 0] },
            { "time": "17:00", "num_individuals": [124, 120, 0] },
            { "time": "18:00", "num_individuals": [96, 41, 36] },
            { "time": "19:00", "num_individuals": [98, 0, 100] },
            { "time": "20:00", "num_individuals": [42, 0, 80] },
            { "time": "21:00", "num_individuals": [0, 0, 100] },
            { "time": "22:00", "num_individuals": [0, 0, 120] },
            { "time": "23:00", "num_individuals": [0, 0, 144] }
        ],
        [
            { "time": "00:00", "num_individuals": [38, 0, 116] },
            { "time": "01:00", "num_individuals": [40, 0, 104] },
            { "time": "02:00", "num_individuals": [0, 0, 138] },
            { "time": "03:00", "num_individuals": [0, 0, 133] },
            { "time": "04:00", "num_individuals": [29, 0, 48] },
            { "time": "05:00", "num_individuals": [98, 0, 47] },
            { "time": "06:00", "num_individuals": [123, 40, 0] },
            { "time": "07:00", "num_individuals": [188, 144, 0] },
            { "time": "08:00", "num_individuals": [156, 200, 0] },
            { "time": "09:00", "num_individuals": [126, 135, 0] },
            { "time": "10:00", "num_individuals": [70, 200, 0] },
            { "time": "11:00", "num_individuals": [50, 222, 0] },
            { "time": "12:00", "num_individuals": [28, 294, 0] },
            { "time": "13:00", "num_individuals": [39, 225, 0] },
            { "time": "14:00", "num_individuals": [39, 144, 0] },
            { "time": "15:00", "num_individuals": [100, 175, 0] },
            { "time": "16:00", "num_individuals": [147, 144, 0] },
            { "time": "17:00", "num_individuals": [124, 120, 0] },
            { "time": "18:00", "num_individuals": [96, 41, 36] },
            { "time": "19:00", "num_individuals": [98, 0, 100] },
            { "time": "20:00", "num_individuals": [42, 0, 80] },
            { "time": "21:00", "num_individuals": [0, 0, 100] },
            { "time": "22:00", "num_individuals": [0, 0, 120] },
            { "time": "23:00", "num_individuals": [0, 0, 144] }
        ],
        [
            { "time": "00:00", "num_individuals": [38, 0, 116] },
            { "time": "01:00", "num_individuals": [40, 0, 104] },
            { "time": "02:00", "num_individuals": [0, 0, 138] },
            { "time": "03:00", "num_individuals": [0, 0, 133] },
            { "time": "04:00", "num_individuals": [29, 0, 48] },
            { "time": "05:00", "num_individuals": [98, 0, 47] },
            { "time": "06:00", "num_individuals": [123, 40, 0] },
            { "time": "07:00", "num_individuals": [188, 144, 0] },
            { "time": "08:00", "num_individuals": [156, 200, 0] },
            { "time": "09:00", "num_individuals": [126, 135, 0] },
            { "time": "10:00", "num_individuals": [70, 200, 0] },
            { "time": "11:00", "num_individuals": [50, 222, 0] },
            { "time": "12:00", "num_individuals": [28, 294, 0] },
            { "time": "13:00", "num_individuals": [39, 225, 0] },
            { "time": "14:00", "num_individuals": [39, 144, 0] },
            { "time": "15:00", "num_individuals": [100, 175, 0] },
            { "time": "16:00", "num_individuals": [147, 144, 0] },
            { "time": "17:00", "num_individuals": [124, 120, 0] },
            { "time": "18:00", "num_individuals": [96, 41, 36] },
            { "time": "19:00", "num_individuals": [98, 0, 100] },
            { "time": "20:00", "num_individuals": [42, 0, 80] },
            { "time": "21:00", "num_individuals": [0, 0, 100] },
            { "time": "22:00", "num_individuals": [0, 0, 120] },
            { "time": "23:00", "num_individuals": [0, 0, 144] }
        ]
    ];

    const response = {
        data: sampleData
    };
    res.json(response);
});

export default apiRouter;
