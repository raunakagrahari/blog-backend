const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const Routes = require("./route/routes.js");
const loggerMiddleware = require("./middleware/loggerMiddleware.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ====== Middlewares ======
app.use(cors());
app.use(bodyParser.json()); // JSON body parser
app.use(express.urlencoded({ extended: true })); // for URL-encoded data
app.use(express.json({ limit: "10mb" })); // limit JSON body size
app.use(loggerMiddleware); // Custom logger

// ====== Routes ======
app.use("/", Routes);

// ====== MongoDB Connection ======
const connectToMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ Connected to MongoDB");

        // Import or define your models
        const User = require('./models/users');
        const contact = require('./models/contact');
        const blogs = require('./models/blogs');

        // Create collections explicitly
        await Promise.all([
            User.createCollection(),
            contact.createCollection(),
            blogs.createCollection()
        ]);

        console.log("✅ All collections created!");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1); // Exit process with failure
    }
};

// ====== Server Initialization ======
connectToMongo().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});

