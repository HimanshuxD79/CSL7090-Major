const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require("cors");

const auth = require("./router/auth.js");
const discussionRouter = require("./router/discussionRouter.js");

dotenv.config();
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors())

// Define a simple route
app.get('/', (req, res) => {
    res.json({ message: "eyy" });
});

app.use("/auth", auth);
app.use("/groups", discussionRouter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

