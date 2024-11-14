const express = require("express");
const router = express.Router();
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

// Middleware to authenticate users based on JWT token
const authenticate = (req, res, next) => {
    // Extract the token from the Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: "No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // Token verification error
            return res.status(403).json({ message: "Invalid or expired token" });
        }

        // Token is valid, attach user to request and proceed
        req.user = user;
        next();
    });
};

// Endpoint to create a new group
router.post('/createGroup', async (req, res) => {
    try {
        const { groupName, userId, encryptedGroupKey } = req.body;

        // Fetch the public key of the user (group creator)
        const user = await User.findById(userId);

        // Create a new group with the provided details
        const newGroup = new Group({
            name: groupName,
            admin: userId,
            members: [{
                userId: userId,
                encryptedGroupKey: encryptedGroupKey,
                username: user.username
            }]
        });

        // Save the new group to the database
        await newGroup.save();
        res.status(201).json({ message: 'Group created successfully', groupId: newGroup._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Endpoint to add a member to a group
router.post('/addGroupMember', authenticate, async (req, res) => {
    try {
        const { groupId, newUserId, encryptedGroupKey } = req.body;

        // Find the group by its ID
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if the user is already a member of the group
        const isAlreadyMember = group.members.some(member => member.userId.toString() === newUserId);
        if (isAlreadyMember) {
            return res.status(409).json({ message: 'User is already a member of the group' });
        }

        // Fetch the username of the new user
        const newUser = await User.findById(newUserId);
        if (!newUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add the new user to the group
        group.members.push({
            userId: newUserId,
            encryptedGroupKey: encryptedGroupKey,
            username: newUser.username
        });

        // Save the updated group information
        await group.save();
        res.status(200).json({ message: `User added to group successfully: ${newUser.username}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Endpoint to get a user's public key
router.get('/users/publicKey/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Send the public key of the user
        res.json({ publicKey: user.publicKey }); // Assuming publicKey is stored in the User model
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// Endpoint to search for users by username
router.get('/searchUsers', async (req, res) => {
    const { username } = req.query;

    try {
        // Find users whose username matches the provided query
        const users = await User.find({ username: new RegExp(username, 'i') }); // This is a simple regex search, adjust according to your needs

        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Error searching for users', error });
    }
});

// Endpoint to get groups where the authenticated user is the admin
router.get('/adminGroups', authenticate, async (req, res) => {
    try {
        const adminId = req.user.id; // Assuming the JWT token contains the user ID
        const groups = await Group.find({ admin: adminId }).populate('members.userId', 'username');

        res.json({ groups });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// Endpoint to get groups where the authenticated user is a member but not an admin
router.get('/memberGroups', authenticate, async (req, res) => {
    try {
        const userId = req.user.id; // Assuming the JWT token contains the user ID

        // Find groups where the user is a member but not an admin
        const groups = await Group.find({
            admin: { $ne: userId },
            'members.userId': userId
        }).populate('members.userId', 'username');

        res.json({ groups });
    } catch (error) {
        console.error('Error fetching member groups:', error);
        res.status(500).send({ message: error.message });
    }
});

// Endpoint to get the encrypted group key for a user in a group
router.get('/groupKey/:groupId', authenticate, async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);
        console.log(groupId)
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if the user is a member of the group
        const isMember = group.members.some(member => member.userId.toString() === req.user.id);
        if (!isMember) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Find the encrypted group key for the user
        const userEncryptedKey = group.members.find(member => member.userId.toString() === req.user.id).encryptedGroupKey;
        console.log("userEncryptedKey",userEncryptedKey)
        res.json({ encryptedGroupKey: userEncryptedKey });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// Endpoint to send a message in a group
router.post('/sendMessage', authenticate, async (req, res) => {
    try {
        const { content, senderId, groupId } = req.body;
        const newMessage = new Message({ content, sender: senderId, group: groupId });
        // Save the new message to the database
        await newMessage.save();
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Endpoint to retrieve messages for a group
router.get('/messages/:groupId', authenticate, async (req, res) => {
    try {
        const { groupId } = req.params;
        // Fetch messages for the specified group, sorted by timestamp
        const messages = await Message.find({ group: groupId }).sort({ timestamp: -1 });
        res.json({ messages });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Endpoint to get a user's username by their ID
router.get('/getUsername/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId); // Change to findById
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Return the username of the user
        return res.json({ username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Endpoint to get details of a group including its members and admin
router.get('/details/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const groupDetails = await fetchGroupMembers(groupId);
        res.json(groupDetails);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper function to fetch group members and admin details
const fetchGroupMembers = async (groupId) => {
    try {
        // Find the group by its ID and populate the 'members' field with user details
        const group = await Group.findById(groupId).populate('members.userId', 'username');

        if (!group) {
            throw new Error('Group not found');
        }

        // Extract and return the list of members and the admin's user ID
        const members = group.members.map((member) => ({
            id: member.userId._id,
            username: member.userId.username,
        }));

        return {
            members: members,
            name: group.name,
            admin: group.admin, // Include the admin's user ID
        };
    } catch (error) {
        throw error;
    }
}

module.exports = router;
