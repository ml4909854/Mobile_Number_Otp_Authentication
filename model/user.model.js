

const mongoose = require("mongoose")
const userSchema = new mongoose.Schema({
    phone:{type:String , required:true},
    otp:{type:String , select:false},
    otpExpiresAt:{type:Date}
})

module.exports = mongoose.model("User" , userSchema)