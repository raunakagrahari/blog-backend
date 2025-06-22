const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const nodemailer = require("nodemailer");
const path = require('path');
const AWS = require('aws-sdk');
const { global } = require('../config/global');

// AWS S3 config
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

/**
 * Controller: Upload file to S3 and return URL
 */
exports.uploadImage = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;

    // Generate unique filename
    const ext = path.extname(file.originalname); // e.g. ".png"
    const fileName = `uploads/image-${Date.now()}${ext}`;

    // Prepare S3 upload params
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: file.buffer, // from multer.memoryStorage()
      ContentType: file.mimetype,
    };

    // Upload to S3
    const data = await s3.upload(uploadParams).promise();

    // Return uploaded image URL
    return res.status(200).json({ imageUrl: data.Location });

  } catch (err) {
    console.error('S3 Upload Error:', err);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
};

// Signup
exports.adminRegister = async (req, res) => {
  try {
    const { name, email, password, mobile, image } = req.body;

    const existing = await User.findOne({ email }).lean();
    if (existing) return res.status(400).json({ message: "Email already exists" });
    let userAdmin = false
    if (global.admin.includes(email)) {
      userAdmin = true
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, mobile, image });

    res.status(201).json({ message: "Admin registered", userId: user._id, userAdmin });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
};

// Login
exports.adminLogIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    let userAdmin = false
    if (global.admin.includes(email)) {
      userAdmin = true
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({ message: "Login successful", token, userAdmin });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

exports.adminSendResetOtp = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user)
      return res.status(400).json({ message: "User with this email does not exist" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry 15 minutes from now
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Store OTP in DB
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Send OTP email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    await transporter.sendMail({
      to: user.email,
      subject: "Your OTP for Password Reset",
      html: `<p>Your OTP is <b>${otp}</b>. It is valid for 15 minutes.</p>`,
    });

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.adminResetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Check if OTP matches and is valid
    if (user.otp !== otp || user.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Reset password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear OTP
    user.otp = undefined;
    user.otpExpiresAt = undefined;

    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { email, name, mobile, image } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const updateFields = {
      ...(name && { name }),
      ...(mobile && { mobile }),
      ...(image && { image })
    };

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // hide password field
    res.status(200).json({ message: "Users fetched successfully", users });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};