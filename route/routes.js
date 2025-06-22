const express = require('express');
const multer = require('multer');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { adminRegister, adminLogIn, adminSendResetOtp, uploadImage, adminResetPasswordWithOtp, updateUserProfile, getAllUsers } = require("../controllers/users");
const { createBlog, updateBlog, deleteBlog, getAllBlogs, likeBlog, getSingleBlog } = require("../controllers/blog");
const auth = require("../middleware/auth");

//for image
router.post('/api/image/upload', upload.single('image'), uploadImage);


router.post("/api/users/signup", adminRegister);
router.post("/api/users/login", adminLogIn);
router.post("/api/users/forgot-password", adminSendResetOtp);
router.post("/api/users/reset-password", adminResetPasswordWithOtp);
router.post('/api/users/profile', updateUserProfile);
router.get('/api/users', getAllUsers);

router.post("/api/blogs", auth, createBlog);
router.post("/api/blogs/:blogId", auth, updateBlog);
router.delete("/api/blogs/:blogId", auth, deleteBlog);
router.get("/api/blogs", auth, getAllBlogs);
router.get('/api/blogs/:blogId', auth, getSingleBlog);

router.post("/api/blogs/:blogId/like", auth, likeBlog);

module.exports = router;