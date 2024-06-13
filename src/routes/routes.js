const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../modules/Users');
const Goal = require('../modules/Goal');
const CompletedGoal = require('../modules/CompletedGoal');

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    const savedUser = await newUser.save();
    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: savedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/goals', async (req, res) => {
  const { description, points, mulct, deadline, repeatable, executionDate, userId } = req.body;
  try {
    const newGoal = new Goal({ description, points, mulct, deadline, repeatable, executionDate, userId });
    const savedGoal = await newGoal.save();
    res.status(201).json(savedGoal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/goals/:id', async (req, res) => {
  try {
    const goal = await Goal.findByIdAndDelete(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.status(200).json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/completeGoal/:id', async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const completedGoal = new CompletedGoal({
      description: goal.description,
      points: goal.points,
      mulct: goal.mulct,
      deadline: goal.deadline,
      repeatable: goal.repeatable,
      executionDate: Date.now(),
      userId: goal.userId
    });

    await completedGoal.save();
    await goal.remove();
    res.status(200).json({ message: 'Goal completed and moved to completed goals' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/completedGoals/:id', async (req, res) => {
  try {
    const completedGoal = await CompletedGoal.findByIdAndDelete(req.params.id);
    if (!completedGoal) return res.status(404).json({ message: 'Completed goal not found' });
    res.status(200).json({ message: 'Completed goal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
