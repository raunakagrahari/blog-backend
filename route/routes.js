const express = require('express');
const multer = require('multer');
const router = express.Router();

// Configure multer for memory storage (for image uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Controllers
const { adminRegister, adminLogIn, adminSendResetOtp, uploadImage, adminResetPasswordWithOtp, updateUserProfile, getAllUsers } = require("../controllers/users");
const { createBlog, updateBlog, deleteBlog, getAllBlogs, likeBlog, getSingleBlog } = require("../controllers/blog");
const auth = require("../middleware/auth");

// =======================
// Image Upload Routes
// =======================
router.post('/api/image/upload', upload.single('image'), uploadImage);

// =======================
// User Auth & Profile
// =======================
router.post("/api/users/signup", adminRegister);                      // Register
router.post("/api/users/login", adminLogIn);                          // Login
router.post("/api/users/forgot-password", adminSendResetOtp);        // Send OTP for Reset
router.post("/api/users/reset-password", adminResetPasswordWithOtp); // Reset Password via OTP
router.post('/api/users/profile', updateUserProfile);                // Update profile (image, name, mobile)
router.get('/api/users', getAllUsers);                                // Get all users

// =======================
// Blog Routes
// =======================
router.post("/api/blogs", auth, createBlog);                          // Create blog
router.post("/api/blogs/:blogId", auth, updateBlog);                 // Update blog
router.delete("/api/blogs/:blogId", auth, deleteBlog);              // Delete blog
router.get("/api/blogs", auth, getAllBlogs);                         // Get all blogs (with pagination)
router.get('/api/blogs/:blogId', auth, getSingleBlog);              // Get single blog by ID
router.post("/api/blogs/:blogId/like", auth, likeBlog);             // Like a blog

module.exports = router;