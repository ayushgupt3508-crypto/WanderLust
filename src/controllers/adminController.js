import {User} from '../models/userModel.js'

const adminRegister = async (req,res) => {
    const {username,email,password,secretKey} = req.body
    if(!username || !email || !password || !secretKey){
        throw new Error("All fields are required for registration...")
    }

    if(secretKey !== process.env.ADMIN_SECRET_KEY){
        throw new Error("Invalid secret key...")
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
        password: password,
        role: "admin"
    })

    const createdUser = await User.findOne({email}).select("-password -refreshToken")
    if(!createdUser) throw new Error("Something went wrong while creating the user admin")
    
    return res.status(200).send("User admin created successfully");
}

const adminLogin = async (req,res) => {
    const {email,password,secretKey} = req.body
    if(!email || !password || !secretKey) throw new Error("Credentials are required!")
    
    const user = await User.findOne({email});
    if(!user) throw new Error("Admin not found")

    if(user.role !== "admin") throw new Error("the role is not admin")
    
    const validatePassword = await user.isCorrectPassword(password)
    if(!validatePassword) throw new Error("Password is incorrect")

    if(secretKey !== process.env.ADMIN_SECRET_KEY){
        throw new Error("Secret key is invalid")
    }

    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()
    await user.save({validateBeforeSave: false})

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res.status(201)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json("Admin logged in successfully..." + "  AccessToken: " + accessToken + "    RefreshToken: " + refreshToken)
}

const adminLogout = async (req,res) => {

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                refreshToken: undefined
            }
        }
    )
    console.log("Admin logged out successfully.....");
    
    return res.status(201)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json("Admin logged out successfully...")
}

export {adminRegister, adminLogin, adminLogout}