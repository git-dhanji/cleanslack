import mongoose, { Schema, type Model } from "mongoose"

// Who is currently present on a code (at most two). Holds only the code, an
// ephemeral random peer id, and timestamps — no identity, no content. A TTL
// index on `lastSeen` auto-clears peers that vanish without a clean disconnect,
// so a dropped phone never permanently blocks a code.

export interface IPresence {
  code: string
  peerId: string
  createdAt: Date
  lastSeen: Date
}

const PresenceSchema = new Schema<IPresence>({
  code: { type: String, required: true, lowercase: true, trim: true },
  peerId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  // Expire ~30s after the last heartbeat. The stream refreshes this every few
  // seconds while connected.
  lastSeen: { type: Date, default: Date.now, expires: 30 },
})
PresenceSchema.index({ code: 1, peerId: 1 }, { unique: true })

const Presence: Model<IPresence> =
  mongoose.models.Presence || mongoose.model<IPresence>("Presence", PresenceSchema)

export default Presence
