

const mongoose = require("mongoose")
const mongoUrl = "mongodb://127.0.0.1:27017/Mobile"


const connectDB = async()=>{
    try {
        await mongoose.connect(mongoUrl)
        console.log("db connected!")
    } catch (error) {
        console.log("db error!")
    }
}

module.exports =connectDB