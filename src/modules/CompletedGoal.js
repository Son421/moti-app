const mongoose = require('mongoose');

const completedGoalSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  mulct: {
    type: Number,
    required: true,
  },
  deadline: {
    type: String,
    required: true,
  },
  repeatable: {
    type: Boolean,
    default: false,
  },
  executionDate: {
    type: Number,
  },
  userId: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('CompletedGoal', completedGoalSchema);
