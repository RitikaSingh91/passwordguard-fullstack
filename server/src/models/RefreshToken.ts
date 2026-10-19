import { Schema, model } from 'mongoose';

// Only the SHA-256 of the token is stored, so a database leak cannot be replayed.
const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  family: { type: String, required: true, index: true }, // for reuse detection
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }, // TTL cleanup
  revokedAt: { type: Date, default: null },
});

export const RefreshToken = model('RefreshToken', schema);
