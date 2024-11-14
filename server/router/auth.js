const express = require("express");
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registration Endpoint
router.post('/register', async (req, res) => {
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username: req.body.username });
        if (existingUser) {
            return res.status(400).send({ message: "Username already taken" });
        }


        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            username: req.body.username,
            password: hashedPassword,
            publicKey: req.body.publicKey
        });

        await user.save();
        res.status(201).send({ message: "User created successfully" });
    } catch (error) {
        console.error(error)
        res.status(500).send(error);
    }
});

// Login Endpoint
router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (user && await bcrypt.compare(req.body.password, user.password)) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.status(200).json({ token: token, username: user.username });
        } else {
            res.status(400).send({ message: "Invalid creds" });
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
