import { Router } from 'express'
import speciesRouter from './species.route'
import areaRouter from './area.route'

const apiRouter = Router()

apiRouter.use('/species', speciesRouter);
apiRouter.use('/areas', areaRouter);

export default apiRouter;
