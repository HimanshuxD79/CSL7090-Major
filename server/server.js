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
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB Connected');
    // You can add a simple query here to confirm the connection works.
    mongoose.connection.db.collection('users').findOne({}, (err, result) => {
      if (err) {
        console.error('Database query failed:', err);
      } else {
        console.log('Successfully queried the database:', result);
      }
    });
  })
  .catch(err => {
    console.log('MongoDB connection error:', err);
  });

// MongoDB event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});
// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

