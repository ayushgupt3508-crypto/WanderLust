import express from 'express'
import { userRegister, userLogin, userLogout } from '../controllers/userController.js'
const router = express.Router()

router.route("/register").post(userRegister)
router.route("/login").post(userLogin)
router.route("/logout").post(userLogout)
export default router