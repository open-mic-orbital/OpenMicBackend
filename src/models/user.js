// Define user model

const mongoose = require('mongoose');
const validator = require('validator'); // to validate email
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        maxLength: 20,
        unique: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true, //to make validation consistent
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
        validate(value) {
            if(value.toLowerCase().includes("password")) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    userType: {
        type: String,
        enum: ['artist', 'venue'],
        required: true
    },
    enabled: {
        type: Boolean,
        required: true,
        default: false
    },
    name: {
        type: String,
        trim: true,
        maxLength: 100
    },
    description: {
        type: String,
        trim: true,
        maxLength: 100
    },
    date: {
        type: Date,
        default: Date.now
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.email;
    delete userObject.enabled;
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.date;
    return userObject;
}

userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
}

userSchema.statics.findByCredentials = async (creds, password) => {
    const user = await User.findOne(
        {
            "$or":[
                { email: creds },
                { userName: creds }
            ]
        }
    )
    if (!user) {
        throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, user.password); // to compare if password hashes match

    if (!isMatch) {
        throw new Error('Unable to login');
    }

    return user;
}

// Hash plaintext password before saving
userSchema.pre('save', async function (next) { // needs to be non-arrow function to use 'this'
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next(); // to confirm done with pre ops to move on to save
})

const User = mongoose.model('User', userSchema);

module.exports = User;