// Define routes for user-related requests

const express = require('express');
const auth = require('../middleware/auth');
const { update } = require('../models/user');
const User = require('../models/user');
const router = new express.Router();


// Create user
router.post('/signup', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token }); // check response in Postman
    } catch(e) {
        res.status(400).send(e); // Unsuccessful signup (wrong format password, etc)
    }
});

router.post('/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (e) {
        res.status(400).send();
    }
})

// Logout current session
router.post('/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        })
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
})

// Logout all sessions
router.post('/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status.send(500)
    }
})

// Read current profile
router.get('/me', auth, async (req, res) => {
    res.send(req.user);
})

// Read users of opposite user type
router.get('/viewProfiles', auth, async (req, res) => {
    try {
        const type = (req.user.userType === 'artist' ? 'venue' : 'artist');
        const users = await User.find({userType: type});

        if (!users) { // No users found
            return res.status(404).send();
        }
        res.send(users);
    } catch (e) {
        res.status(500).send(); // server error
    }
})

// Update user
router.patch('/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates =['userName', 'email', 'password', 'userType', 'name', 'description'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save();
        res.send(req.user);
    } catch (e) {
        res.status(400).send();
    }
})

module.exports = router;