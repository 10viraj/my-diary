const mongoose = require('mongoose');

const diarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  content: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: null
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isHandwritten: {
    type: Boolean,
    default: false
  },
  date: {
    type: String,
    required: true
  },
  mood: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Diary', diarySchema);
