const mongoose = require('mongoose');
const { Schema } = mongoose;

const GoalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    targetAmount: { type: Number, required: true, default: 0 },
    currentAmount: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', GoalSchema);
