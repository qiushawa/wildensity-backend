import { Router } from 'express'
import speciesRouter from './species.route'
import recordRouter from './record.route'
import downloadRouter from './download.route'
import areaRouter from './area.route'
import { prisma } from '../common/database'

const apiRouter = Router()
apiRouter.get('/message', (req, res) => {
  res.json({ message: 'Hello from the API!' });
})

apiRouter.use('/species', speciesRouter);
apiRouter.use('/records', recordRouter);
apiRouter.use('/download', downloadRouter);
apiRouter.use('/areas', areaRouter);

export default apiRouter;
