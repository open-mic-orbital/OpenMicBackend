// Define routes for user-related requests

// const fs = require('fs');
const express = require('express');
const transporter = require('../mails/transporter');
const auth = require('../middleware/auth');
// const { update } = require('../models/user');
const User = require('../models/user');
// const upload = require('../middleware/multer');
const router = new express.Router();


// Create user
router.post('/signup', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
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
});

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
});

// Logout all sessions
router.post('/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send();
    } catch (e) {
        res.status.send(500)
    }
});

// Read current profile
router.get('/me', auth, async (req, res) => {
    res.send(req.user);
});

// Read users of opposite user type
router.get('/viewProfiles', auth, async (req, res) => {
    try {
        const type = (req.user.userType === 'artist' ? 'venue' : 'artist');
        const users = await User.find({
            userType: type,
            enabled: true
        });

        if (!users) { // No users found
            return res.status(404).send();
        }
        res.send(users);
    } catch (e) {
        res.status(500).send(); // server error
    }
});

// Update user
router.patch('/me', auth, async (req, res) => { //[auth, upload.single('image')]
    const updates = Object.keys(req.body).filter(update => update !== 'img');
    const allowedUpdates =['userName', 'email', 'password', 'userType', 'name', 'description', 'contact', 'enabled'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update]);
        // req.user.img = {
        //     data: fs.readFileSync(path.join('../middleware/uploads/' + req.file.filename)),
        //     contentType: 'image/*'
        // }
        await req.user.save();
        res.send(req.user);
    } catch (e) {
        res.status(400).send();
    }
});

// Route to send email with resetToken (for password reset)
router.post('/forgot', async (req, res) => {
    try{
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).send('User does not exist');
        }

        const token = await user.generateResetToken();

        const mailOptions = {
            from: process.env.MAIL_USER,
            to: req.body.email,
            subject: 'Reset Password Link for OpenMic',
            html:   `<h1>Click the following link to set a new password:</h1>
                    <a href="${process.env.CLIENT_URL}/PasswordReset/${token}">Reset Password</a>
                    <h2>Didn't request a password reset?</h2>
                    You may ignore this e-mail`
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).send();
            } else {
                res.send();
            }
        });
    } catch (e) {
        res.status(400).send();
    }
});

module.exports = router;