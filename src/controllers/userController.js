import {User} from '../models/userModel.js'
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"

const userRegister = async (req,res) => {
    const {username, email,password} = req.body ?? {}

    if(!username || !email || !password){
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
        email: email,
        password: password
    })

    const createdUser = await User.findOne({email}).select("-password -refreshToken")
    if(!createdUser) throw new Error("Something went wrong while creating the user")

    return res.status(200).send("User created successfully");
    
}

const userLogin = async (req,res) => {
    const {email,password} = req.body
    if(!email || !password) throw new Error("Email and Password are required!")
    
    const user = await User.findOne({email});
    if(!user) throw new Error("User not found")
    
    const validatePassword = await user.isCorrectPassword(password)
    if(!validatePassword) throw new Error("Password is incorrect")

    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()
    await user.save({validateBeforeSave: false})

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res.status(201)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json("User logged in successfully..." + "  AccessToken: " + accessToken + "    RefreshToken: " + refreshToken)
}

const userLogout = async (req,res) => {

    // const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")

    // if(!token) throw new Error("Invalid user")

    // const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    // const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                refreshToken: undefined
            }
        }
    )
    console.log("User logged out successfully.....");
    
    return res.status(201)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json("User logged out successfully...")
}



export {userRegister, userLogin, userLogout} 