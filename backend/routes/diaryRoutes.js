const express = require('express');
const router = express.Router();
const Diary = require('../models/Diary');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// @desc    Get diary entries
// @route   GET /api/diary
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { filter, search, mood, tags, date } = req.query;
    let query = { user: req.user.id };

    if (filter === 'archived') {
      query.isArchived = true;
      query.isDeleted = false;
      query.isLocked = false;
    } else if (filter === 'favorites') {
      query.isFavorite = true;
      query.isDeleted = false;
      query.isArchived = false;
      query.isLocked = false;
    } else if (filter === 'handwritten') {
      query.isHandwritten = true;
      query.isDeleted = false;
      query.isLocked = false;
    } else if (filter === 'deleted') {
      query.isDeleted = true;
    } else if (filter === 'locked') {
      query.isLocked = true;
      query.isDeleted = false;
    } else {
      // Default: All notes (not archived, not deleted, not locked)
      query.isArchived = false;
      query.isDeleted = false;
      query.isLocked = false;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    if (mood) {
      query.mood = mood;
    }
    if (tags) {
      const tagsArray = tags.split(',').map(t => t.trim());
      query.tags = { $in: tagsArray };
    }
    if (date) {
      query.date = date;
    }

    const entries = await Diary.find(query).sort({ createdAt: -1 });
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Create diary entry
// @route   POST /api/diary
// @access  Private
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).json({ message: 'Please add a title' });
    }
    
    const isHandwritten = req.body.isHandwritten === 'true' || req.body.isHandwritten === true;
    if (!req.body.content && !req.file && !isHandwritten) {
      return res.status(400).json({ message: 'Please add content or an image' });
    }

    let parsedTags = [];
    if (req.body.tags) {
      try {
        parsedTags = JSON.parse(req.body.tags);
      } catch (e) {
        parsedTags = typeof req.body.tags === 'string' ? req.body.tags.split(',') : req.body.tags;
      }
    }

    const entryData = {
      title: req.body.title,
      content: req.body.content || '',
      date: req.body.date || new Date().toISOString().split('T')[0],
      isHandwritten: req.body.isHandwritten === 'true' || req.body.isHandwritten === true,
      mood: req.body.mood || '',
      tags: parsedTags,
      user: req.user.id,
    };

    if (req.file) {
      // Store the relative path or full URL. Here we just store the filename for simplicity,
      // but it's better to store the relative path for the frontend to fetch.
      entryData.image = `/uploads/${req.file.filename}`;
    }

    const entry = await Diary.create(entryData);

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Update diary entry
// @route   PUT /api/diary/:id
// @access  Private
router.put('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const entry = await Diary.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    // Check for user
    if (entry.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updateData = { ...req.body };
    if (req.body.tags) {
      try {
        updateData.tags = JSON.parse(req.body.tags);
      } catch (e) {
        updateData.tags = typeof req.body.tags === 'string' ? req.body.tags.split(',') : req.body.tags;
      }
    }
    
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updatedEntry = await Diary.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.status(200).json(updatedEntry);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Soft Delete diary entry
// @route   DELETE /api/diary/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const entry = await Diary.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    if (entry.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    entry.isDeleted = true;
    await entry.save();

    res.status(200).json({ id: req.params.id, message: 'Entry moved to recently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Permanently Delete diary entry
// @route   DELETE /api/diary/:id/permanent
// @access  Private
router.delete('/:id/permanent', protect, async (req, res) => {
  try {
    const entry = await Diary.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    if (entry.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await entry.deleteOne();

    res.status(200).json({ id: req.params.id, message: 'Entry permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
