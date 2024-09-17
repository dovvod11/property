const express = require('express');
const User = require('../models/User');
const Token = require('../models/Token');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Helper function to create tokens
const createTokens = (user) => {
    // Access Token (short-lived)
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    // Refresh Token (long-lived)
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken };
};

// Register a new user
router.post('/register', async (req, res) => {
    const { name, address, dateOfBirth, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({
            name,
            address,
            dateOfBirth,
            email,
            password,
        });

        await user.save();

        // Create tokens
        const { accessToken, refreshToken } = createTokens(user);

        // Store refresh token in database
        await new Token({
            userId: user._id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }).save();

        res.status(201).json({ accessToken, refreshToken });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Login a user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create tokens
        const { accessToken, refreshToken } = createTokens(user);

        // Store refresh token in database
        await new Token({
            userId: user._id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }).save();

        res.json({ accessToken, refreshToken });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Refresh token route
router.post('/refresh-token', async (req, res) => {
    const { token: refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Check if token exists in the database
        const storedToken = await Token.findOne({ userId: decoded.id, token: refreshToken });

        if (!storedToken) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        // Generate a new access token
        const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '15m' });

        res.json({ accessToken });
    } catch (error) {
        console.error('Error with refresh token', error);
        res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
});

// Protected route example
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
