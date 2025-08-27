import e, { Router } from 'express'
import speciesRouter from './species.route'
import areaRouter from './area.route'
import { prisma } from '../common/database'

const apiRouter = Router()
apiRouter.get('/message', (req, res) => {
  res.json({ message: 'Hello from the API!' });
})

apiRouter.use('/species', speciesRouter);
apiRouter.use('/areas', areaRouter);

export default apiRouter;
