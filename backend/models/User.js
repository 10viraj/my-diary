const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true
  },
  password: {
    type: String,
    required: function() { return !this.googleId; }
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
