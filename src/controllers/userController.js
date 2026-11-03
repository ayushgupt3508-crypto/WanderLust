import {User} from '../models/userModel.js'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'

const stateCookieName = "googleOAuthState"
const stateCookiePath = "/users/google/callback"

const getGoogleOAuthClient = () => {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env
    if(!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL){
        throw new Error("Google OAuth environment variables are not configured")
    }

    return new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_CALLBACK_URL
    )
}

const getStateCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: stateCookiePath
})

const getSessionCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
})

const createUsername = async (profileName, email) => {
    const usernameSource = profileName || email.split("@")[0]
    const baseUsername = usernameSource
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "")
        .slice(0, 40) || "user"

    let username = baseUsername
    while(await User.exists({ username })){
        username = `${baseUsername}_${randomBytes(3).toString("hex")}`
    }
    return username
}

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
    user.refreshToken = refreshToken
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

const googleAuthStart = (req, res) => {
    try {
        const oauthClient = getGoogleOAuthClient()
        const state = randomBytes(32).toString("hex")
        const authorizationUrl = oauthClient.generateAuthUrl({
            scope: ["openid", "email", "profile"],
            state
        })

        return res
            .cookie(stateCookieName, state, {
                ...getStateCookieOptions(),
                maxAge: 10 * 60 * 1000
            })
            .redirect(authorizationUrl)
    } catch (error) {
        console.error("Could not start Google OAuth:", error)
        return res.status(500).json({ message: "Could not start Google sign-in" })
    }
}

const googleAuthCallback = async (req, res) => {
    const clearStateCookie = () => res.clearCookie(stateCookieName, getStateCookieOptions())

    if(req.query.error){
        clearStateCookie()
        return res.status(400).json({ message: "Google sign-in was cancelled or denied" })
    }

    const { code, state } = req.query
    const savedState = req.cookies?.[stateCookieName]
    if(typeof code !== "string" || typeof state !== "string" || typeof savedState !== "string"){
        clearStateCookie()
        return res.status(400).json({ message: "Google OAuth callback is missing required values" })
    }

    const receivedState = Buffer.from(state)
    const expectedState = Buffer.from(savedState)
    if(
        receivedState.length !== expectedState.length ||
        !timingSafeEqual(receivedState, expectedState)
    ){
        clearStateCookie()
        return res.status(400).json({ message: "Invalid Google OAuth state" })
    }
    clearStateCookie()

    try {
        const oauthClient = getGoogleOAuthClient()
        const { tokens } = await oauthClient.getToken(code)
        if(!tokens.id_token){
            return res.status(401).json({ message: "Google did not return an ID token" })
        }

        const ticket = await oauthClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        })
        const profile = ticket.getPayload()
        if(!profile?.sub || !profile.email || profile.email_verified !== true){
            return res.status(401).json({ message: "A verified Google email is required" })
        }

        const email = profile.email.trim().toLowerCase()
        let user = await User.findOne({ googleId: profile.sub })

        if(!user){
            const existingEmailUser = await User.findOne({ email })
            if(existingEmailUser){
                return res.status(409).json({
                    message: "An account already uses this email. Sign in with that account before linking Google."
                })
            }

            const username = await createUsername(profile.name, email)
            user = await User.create({
                username,
                email,
                googleId: profile.sub,
                role: "customer"
            })
        }

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        const loggedInUser = await User.findById(user._id)
            .select("-password -refreshToken -googleId")

        return res
            .cookie("accessToken", accessToken, getSessionCookieOptions())
            .cookie("refreshToken", refreshToken, getSessionCookieOptions())
            .status(200)
            .json({
                message: "Google sign-in successful",
                user: loggedInUser
            })
    } catch (error) {
        console.error("Google OAuth callback failed:", error)
        return res.status(500).json({ message: "Google sign-in failed" })
    }
}


export { userRegister, userLogin, userLogout, googleAuthStart, googleAuthCallback }