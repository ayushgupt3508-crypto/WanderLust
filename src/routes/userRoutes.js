import express from 'express'
import {
    userRegister,
    userLogin,
    userLogout,
    googleAuthStart,
    googleAuthCallback
} from '../controllers/userController.js'
import { verifyJWT } from '../middlewares/authMiddleware.js'
const router = express.Router()

router.route("/register").post(userRegister)
router.route("/login").post(userLogin)

router.route("/google").get(googleAuthStart)
router.route("/google/callback").get(googleAuthCallback)


//* secured routes

router.route("/logout").post(verifyJWT, userLogout)
export default router