import jwt from 'jsonwebtoken'
import { User } from '../models/userModel.js'

const verifyJWT = async (req,res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token || token === "") throw new Error("Unauthorized User")

        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        if(!decodedToken) throw new Error("accessToken is required")

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user) throw new Error("Invalid accessToken")

        req.user = user
        next()
        
    } catch (error) {
        return res.status(500)
        .json("Error occured while authentication")
    }
}

export {verifyJWT}