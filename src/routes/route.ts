import { Router } from 'express'
import deviceRoute from './device.route'
import speciesRouter from './species.route'
import recordRouter from './record.route'

const apiRouter = Router()
apiRouter.get('/message', (req, res) => {
  res.json({ message: 'Hello from the API!' });
})

apiRouter.use('/devices', deviceRoute);
apiRouter.use('/species', speciesRouter);
apiRouter.use('/records', recordRouter);

export default apiRouter
