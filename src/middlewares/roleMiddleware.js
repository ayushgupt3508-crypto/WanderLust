import {User} from '../models/userModel.js'

const verifyRole = async (req,res) => {
    const {role} = req.user?.role 
    if(!role) throw new Error("something went wrong while authorizing")

    if(role !== "admin") throw new Error("User is not authorized for this task!!!")
    next()
}

export {verifyRole}