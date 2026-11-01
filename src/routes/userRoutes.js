import express from 'express'
import { userRegister, userLogin, userLogout } from '../controllers/userController.js'
import { verifyJWT } from '../middlewares/authMiddleware.js'
const router = express.Router()

router.route("/register").post(userRegister)
router.route("/login").post(userLogin)


//* secured routes

router.route("/logout").post(verifyJWT, userLogout)
export default router