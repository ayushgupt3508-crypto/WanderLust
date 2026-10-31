import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import mongoose, { Schema } from 'mongoose'

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    refreshToken: {
        type: String
    }
},{timestamps : true})


userSchema.pre("save", async function () {
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10)
    }
})

userSchema.methods.isCorrectPassword = async function (password) {
    return await bcrypt.compare(this.password, password)
}

export const User = mongoose.model("User", userSchema)