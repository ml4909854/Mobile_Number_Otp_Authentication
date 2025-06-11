require("dotenv").config();
const express = require("express");
const router = express.Router();
const twilio = require("twilio");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/user.model.js");

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// send otp
router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, Number(process.env.SALTROUND));
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    let user = await User.findOne({ phone });

    if (user) {
      user.otp = hashedOtp;
      user.otpExpiresAt = otpExpiresAt;
    } else {
      user = new User({ phone, otp: hashedOtp, otpExpiresAt });
    }

    await user.save();

    await twilioClient.messages.create({
      body: `Your OTP is ${otp}. It will be valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    const tempToken = jwt.sign({phone} , process.env.TEMP_KEY , {expiresIn:"5m"})

    res.status(200).json({ message: "OTP sent successfully!"  , tempToken});
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP!", error: error.message });
  }
});
// verify otp
router.post("/verify-otp", async (req, res) => {
  try {

    const token = req.headers?.authorization?.split(" ")[1]

    const decoded = jwt.verify(token , process.env.TEMP_KEY)
    let phone = decoded.phone
    const {otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "Otp are required" });
    }

    const user = await User.findOne({ phone }).select("+otp");

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // 🔴 Add this safety check
    if (!user.otp || !user.otpExpiresAt) {
      return res.status(400).json({ message: "OTP not found or already used. Please request a new OTP." });
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired!" });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    const accessToken = jwt.sign({ _id: user._id }, process.env.ACCESS_KEY, { expiresIn: "1d" });
    res.status(200).json({ message: "OTP verified", accessToken });
  } catch (error) {
    res.status(500).json({ message: "OTP verification error!", error: error.message });
  }
});


module.exports = router;
