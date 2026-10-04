import express from 'express'
import cookieParser from 'cookie-parser'
import healthRoutes from './routes/healthRoutes.js'
import authRoutes from './routes/authRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import storeRoutes from './routes/storeRoutes.js'
import ratingRoutes from './routes/ratingRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import ownerRoutes from './routes/ownerRoutes.js'
import errorHandler from './middleware/errorHandler.js'
import notFound from './middleware/notFound.js'

const app = express()

app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())
app.get('/', (_request, response) => {
  response.json({
    status: 'ok',
    message: 'Store Rating API is running.',
    frontend: 'http://localhost:5173',
    health: '/api/health',
  })
})
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/stores', storeRoutes)
app.use('/api/ratings', ratingRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/owner', ownerRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
