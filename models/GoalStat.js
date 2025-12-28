const mongoose = require('mongoose');
const { Schema } = mongoose;

const GoalStatSchema = new Schema(
  {
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, default: Date.now },
    amount: { type: Number, required: true }, // treated as incremental change
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GoalStat', GoalStatSchema);
