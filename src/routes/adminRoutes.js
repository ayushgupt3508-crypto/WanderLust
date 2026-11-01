import express from 'express'
import { adminLogin, adminLogout, adminRegister } from '../controllers/adminController.js'
import { verifyRole } from '../middlewares/roleMiddleware.js'
import { verifyJWT } from '../middlewares/authMiddleware.js'

const router = express.Router()

//* open routes...No authorization check required
//* Prevents invalid registration using ADMIN ONLY secretKey

router.route("/register").post(adminRegister)
router.route("/login").post(adminLogin)

//* secured routes

router.route("/logout").post(verifyJWT, verifyRole, adminLogout)

export default router