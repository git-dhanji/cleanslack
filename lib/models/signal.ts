import mongoose, { Schema, type Model } from "mongoose"

// Ephemeral signaling mailbox. Holds ONLY WebRTC handshake notes (SDP / ICE)
// in transit between the two peers who share a code — never chat, files, or any
// identity. A TTL index deletes anything older than 60s, so nothing lingers even
// if a peer never drains it. This is what lets two peers on DIFFERENT serverless
// instances find each other: they meet through the shared database, not memory.

export interface ISignal {
  code: string
  from: string
  data: unknown
  createdAt: Date
}

const SignalSchema = new Schema<ISignal>({
  code: { type: String, required: true, index: true, lowercase: true, trim: true },
  from: { type: String, required: true },
  data: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 },
})

const Signal: Model<ISignal> =
  mongoose.models.Signal || mongoose.model<ISignal>("Signal", SignalSchema)

export default Signal
