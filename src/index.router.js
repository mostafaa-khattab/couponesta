import connectDB from '../DB/connection.js'
import authRouter from './modules/auth/auth.router.js'
import branRouter from './modules/brand/brand.router.js'
import categoryRouter from './modules/category/category.router.js'
import couponRouter from './modules/coupon/coupon.router.js'
import notificationRouter from './modules/notification/notification.router.js'
import adsRouter from './modules/ads/ads.router.js'
import userRouter from './modules/user/user.router.js'
import locationRouter from './modules/location/location.router.js'
import { globalErrorHandler } from './utils/errorHandling.js'



const initApp = (app, express) => {
    //convert Buffer Data
    app.use(express.json({}))
    // appear image path
    app.use('/uploads', express.static('uploads'))
    // app.use(express.static('uploads'))

    //Setup API Routing 
    app.use(`/auth`, authRouter)
    app.use(`/user`, userRouter)
    app.use(`/location`, locationRouter)
    app.use(`/category`, categoryRouter)
    app.use(`/brand`, branRouter)
    app.use(`/coupon`, couponRouter)
    app.use(`/ads`, adsRouter)
    app.use(`/notification`, notificationRouter)

    app.get('/', (req, res, next) => {
        return res.json({ message: "welcome to coponesta" })
    })

    app.all('*', (req, res, next) => {
        return next(new Error(`invalid url can't access this endPoint Plz check url  or  method ${req.originalUrl}`, { cause: 404 }))

    })

    app.use(globalErrorHandler)
    connectDB()

}


export default initApp