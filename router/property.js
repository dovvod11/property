const express = require('express');
const Property = require('../models/Property');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const router = express.Router();

// Create a new property
router.post('/create', authMiddleware, upload.array('images', 10), async (req, res) => {
    const { images,address,city } = req.body;

    try {
        const owner = req.user.id;  // The logged-in user's ID
        const images = req.files ? req.files.map(file => file.path) : []; // Store the file paths in the DB

        const newProperty = new Property({
            owner,
            images,
            address,
            city
        });

        await newProperty.save();
        res.status(201).json(newProperty);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Get all properties of the logged-in user
router.get('/', authMiddleware, async (req, res) => {
    try {
  
        const properties = await Property.find({ owner: req.user.id });
        res.json(properties);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Get a specific property by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property || property.owner.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Property not found' });
        }

        res.json(property);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Update a property
router.put('/:id', authMiddleware, upload.array('images', 10), async (req, res) => {
    const { images,address,city } = req.body;

    try {
        let property = await Property.findById(req.params.id);

        if (!property || property.owner.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Update fields
        if (req.files) {
            property.images = req.files.map(file => file.path);  // Update images
        }
        property.address= address || property.address
        property.city = city || property.city;

        await property.save();
        res.json(property);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Delete a property
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        // Ensure the property exists and belongs to the logged-in user
        if (!property || property.owner.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Use deleteOne to remove the property
        await property.deleteOne();
        
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
