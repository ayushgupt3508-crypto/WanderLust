import express from 'express'
import 'dotenv/config'
import mongoose from 'mongoose'
import userRouter from './routes/userRoutes.js'

const app = express()
const port = process.env.PORT || 5000

app.use(express.json())

app.get("/", (req,res) => {
    res.send("Server setup done...")
})

app.use("/users", userRouter)

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/WanderLust`)
        console.log(connectionInstance.connection.host);
        
    } catch (error) {
        console.log("error: ",error);
        process.exit(1)
        
    }
}

connectDB().then(
    app.listen(port, (err) => {
    console.log("Server is listening on port: ", port);
})
).catch((err) => {
    console.log("MongoDb connection error...");
})

