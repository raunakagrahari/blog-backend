const Blog = require("../models/blogs");
const User = require("../models/users");
// Create Blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content, tags, image } = req.body;

    const user = await User .findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
        
    // Block if blog with same title exists
    const existingBlog = await Blog.findOne({ title });
    if (existingBlog) {
      return res.status(400).json({ message: "A blog with this title already exists" });
    }

    const blog = await Blog.create({
      title,
      content,
      tags,
      image,
      author: req.user.id,
      authorName: user.name // <-- store name directly
    });

    res.status(201).json({ message: "Blog created", blog });
  } catch (error) {
    res.status(500).json({ message: "Error creating blog", error });
  }
};

// Update Blog
exports.updateBlog = async (req, res) => {
  try {
    const { title, content, tags, image } = req.body;
    const blog = await Blog.findById(req.params.blogId);

    if (!blog || blog.author.toString() !== req.user.id)
      return res.status(404).json({ message: "Blog not found or not authorized" });
    
     // Check if another blog exists with the same title (excluding current one)
    const existingBlog = await Blog.findOne({ title, _id: { $ne: req.params.blogId } });
    if (existingBlog) {
      return res.status(400).json({ message: "Another blog with this title already exists" });
    }

    blog.title = title;
    blog.content = content;
    blog.tags = tags;
    blog.image = image;
    blog.updatedAt = new Date();

    await blog.save();
    res.json({ message: "Blog updated", blog });
  } catch (error) {
    res.status(500).json({ message: "Error updating blog", error });
  }
};

// Delete Blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog || blog.author.toString() !== req.user.id)
      return res.status(404).json({ message: "Blog not found or not authorized" });

    await blog.deleteOne();
    res.json({ message: "Blog deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting blog", error });
  }
};

// Get All Blogs with Pagination
exports.getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find()
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments();

    res.json({ blogs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Error fetching blogs", error });
  }
};

exports.getSingleBlog = async (req, res) => {
  try {
    const blogId = req.params.blogId;
    
    const blog = await Blog.findById(blogId).populate('author', 'name email'); // Populate author details if needed

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Like/Unlike Blog
exports.likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const userId = req.user.id;
    const isLiked = blog.likes.includes(userId);

    if (isLiked) {
      blog.likes.pull(userId);
    } else {
      blog.likes.push(userId);
    }

    await blog.save();
    res.json({ message: isLiked ? "Blog unliked" : "Blog liked", likes: blog.likes.length });
  } catch (error) {
    res.status(500).json({ message: "Error toggling like", error });
  }
};
