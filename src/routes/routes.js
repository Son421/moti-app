const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../modules/Users');
const Goal = require('../modules/Goal');
const CompletedGoal = require('../modules/CompletedGoal');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
  });
};

router.post('/register', async (req, res) => {
  const { name, email, password, pointCounter } = req.body;
  try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
      }
      const newUser = new User({ name, email, password, pointCounter });
      const savedUser = await newUser.save();
      const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(201).json({ token, user: savedUser });
  } catch (err) {
      console.error('Error registering user:', err);
      res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
      const user = await User.findOne({ email });
      if (!user) {
          console.log('Login - User not found');
          return res.status(400).json({ message: 'Invalid email or password' });
      }
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
          console.log('Login - Invalid password');
          return res.status(400).json({ message: 'Invalid email or password' });
      }
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({ token, user });
  } catch (err) {
      console.error('Error logging in user:', err);
      res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/user', authenticateToken, async (req, res) => {
  try {
      const user = await User.findById(req.user.id).select('-password'); 
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
  } catch (err) {
      console.error('Error fetching user info:', err);
      res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/goals', async (req, res) => {
  const { description, points, mulct, deadline, repeatable, executionDate, userId } = req.body;

  try {
      const newGoal = new Goal({ description, points, mulct, deadline, repeatable, executionDate, userId });
      const savedGoal = await newGoal.save();
      res.status(201).json(savedGoal);
  } catch (err) {
      console.error('Error creating goal:', err);
      res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/goals', authenticateToken, async (req, res) => {
  try {
      const goals = await Goal.find({ userId: req.user.id });
      res.status(200).json(goals);
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

router.post('/completeGoals/:id', async (req, res) => {
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
    if(!goal.repeatable){
      await Goal.findByIdAndDelete(req.params.id); 
    }
    res.status(200).json({ message: 'Goal completed and moved to completed goals' });
  } catch (err) {
    console.error('Error completing goal:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/completedGoals', authenticateToken, async (req, res) => {
  try {
      const completedGoals = await CompletedGoal.find({userId: req.user.id});
      res.status(200).json(completedGoals);
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

router.delete('/completedGoals', authenticateToken, async (req, res) => {
  try {
      await CompletedGoal.deleteMany({userId: req.user.id});
      res.status(200).json({ message: 'All completed goals deleted successfully' });
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

router.post('/increment-points', async (req, res) => {
  const { userId, points } = req.body;

  if (typeof(points) !== 'number') {
    return res.status(400).json({ message: 'Invalid increment amount' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.pointCounter += points;
    await user.save();

    res.status(200).json({ message: `Point counter incremented by ${points}`, user });
  } catch (err) {
    console.error('Error incrementing point counter:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/decrement-points', async (req, res) => {
  const { userId, mulct } = req.body;

  if (typeof(mulct) !== 'number') {
    return res.status(400).json({ message: 'Invalid decrement amount' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.pointCounter -= mulct;
    await user.save();

    res.status(200).json({ message: `Point counter decremented by ${mulct}`, user });
  } catch (err) {
    console.error('Error decrementing point counter:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
