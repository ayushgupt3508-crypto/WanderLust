import {User} from '../models/userModel.js'
import bcrypt from 'bcrypt'

const userRegister = async (req,res) => {
    const {username, email} = req.body ?? {}

    if(!username || !email){
        throw new Error("Username and email is required")
    }
    if(typeof username !== "string" || username.trim() === "" || typeof email !== "string" || email.trim() === ""){
        throw new Error("Invalid credentials")
    }

    const existedUser = await User.findOne({email})
    if(existedUser){
        throw new Error("User already exists with this email id")
    }
    const user = await User.create({
        username: username,
        email: email
    })

    const createdUser = await User.findOne({email}).select("-password -refreshToken")
    if(!createdUser) throw new Error("Something went wrong while creating the user")

    return res.status(200).send("User created successfully");
    
}




export {userRegister} 