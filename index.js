
require("dotenv").config()
const express = require("express")
const connectDB = require("./config/db")
const userRouter = require("./controller/user.controller.js")
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors({
    origin:process.env.FRONTEND_URL,
    methods:["GET" ,'POST' ,'PATCH','DELETE'],
    credentials:true
}))

app.use("/user" , userRouter)

app.get("/" , (req ,res)=>{
    res.send("connected!")
})

const PORT = process.env.PORT
app.listen(3000 , async()=>{
    await connectDB()
    console.log("server is running")
})