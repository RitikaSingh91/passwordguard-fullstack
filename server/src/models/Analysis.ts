import { Schema, model } from 'mongoose';

export const CATEGORIES = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'] as const;

// IMPORTANT: stores metadata only. The password and its hash are never part of this model.
const schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, trim: true, maxlength: 80, default: '' },
    score: { type: Number, required: true, min: 0, max: 100 },
    category: { type: String, enum: CATEGORIES, required: true },
    guessesLog10: { type: Number, required: true, min: 0, max: 400 },
    length: { type: Number, required: true, min: 0, max: 1024 },
    patterns: { type: [String], default: [] },
    breachChecked: { type: Boolean, default: false },
    breached: { type: Boolean, default: null },
  },
  { timestamps: true },
);
schema.index({ user: 1, createdAt: -1 });

export const Analysis = model('Analysis', schema);
