import { Router } from 'express'
import deviceRoute from '@/routes/device.route'

const apiRouter = Router()
apiRouter.get('/message', (req, res) => {
  res.json({ message: 'Hello from the API!' })
})

apiRouter.use('/devices', deviceRoute)

export default apiRouter
