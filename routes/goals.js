const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const Goal = require('../models/Goal');
const GoalStat = require('../models/GoalStat');

// Create a new goal (user required)
router.post('/', requireAuth, async (req, res) => {
  try {
    const payload = {
      userId: req.userId,
      title: req.body.title,
      description: req.body.description,
      targetAmount: typeof req.body.targetAmount === 'number' ? req.body.targetAmount : 0,
      currentAmount: typeof req.body.currentAmount === 'number' ? req.body.currentAmount : 0,
      currency: req.body.currency || 'USD',
    };

    const goal = new Goal(payload);
    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    console.error('POST /api/goals error:', err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Get all goals for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    console.error('GET /api/goals error:', err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Get a specific goal (owner-only)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (String(goal.userId) !== String(req.userId)) return res.status(403).json({ error: 'Forbidden' });
    res.json(goal);
  } catch (err) {
    console.error('GET /api/goals/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// Update a goal (owner-only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (String(goal.userId) !== String(req.userId)) return res.status(403).json({ error: 'Forbidden' });

    // Only allow updating selected fields
    const updates = {};
    if (typeof req.body.title === 'string') updates.title = req.body.title;
    if (typeof req.body.description === 'string') updates.description = req.body.description;
    if (typeof req.body.targetAmount === 'number') updates.targetAmount = req.body.targetAmount;
    if (typeof req.body.currency === 'string') updates.currency = req.body.currency;
    // currentAmount should normally be managed via stats; allow explicit set only if provided:
    if (typeof req.body.currentAmount === 'number') updates.currentAmount = req.body.currentAmount;

    const updated = await Goal.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/goals/:id error:', err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Delete a goal and its stats (owner-only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (String(goal.userId) !== String(req.userId)) return res.status(403).json({ error: 'Forbidden' });

    await Goal.deleteOne({ _id: req.params.id });
    await GoalStat.deleteMany({ goalId: req.params.id });
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/goals/:id error:', err);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Add a stat for a goal (incremental). Only the owner can add stats.
router.post('/:id/stats', requireAuth, async (req, res) => {
  try {
    const goalId = req.params.id;
    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (String(goal.userId) !== String(req.userId)) return res.status(403).json({ error: 'Forbidden' });

    const amount = Number(req.body.amount);
    if (Number.isNaN(amount)) return res.status(400).json({ error: 'amount is required and must be a number' });

    const stat = new GoalStat({
      goalId,
      userId: req.userId,
      amount,
      note: req.body.note || '',
      date: req.body.date || Date.now(),
    });

    await stat.save();

    // Increment goal.currentAmount by stat.amount (incremental behavior)
    const updatedGoal = await Goal.findByIdAndUpdate(
      goalId,
      { $inc: { currentAmount: amount } },
      { new: true }
    );

    res.status(201).json({ stat, goal: updatedGoal });
  } catch (err) {
    console.error('POST /api/goals/:id/stats error:', err);
    res.status(500).json({ error: 'Failed to create stat' });
  }
});

// List stats for a goal (only stats by the current user for owner-only security)
router.get('/:id/stats', requireAuth, async (req, res) => {
  try {
    const goalId = req.params.id;
    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (String(goal.userId) !== String(req.userId)) return res.status(403).json({ error: 'Forbidden' });

    const stats = await GoalStat.find({ goalId, userId: req.userId }).sort({ date: -1 });
    res.json(stats);
  } catch (err) {
    console.error('GET /api/goals/:id/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
