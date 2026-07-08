import mongoose, { Schema, type Model } from "mongoose"

// A reserved connection code. This is the ONLY thing Wisp writes to the
// database. It carries no user data — just the random code and when it was
// reserved. A TTL index auto-deletes stale reservations after 2 hours, so the
// collection cleans itself even if a peer never releases explicitly.

export interface ICode {
  code: string
  createdAt: Date
}

const CodeSchema = new Schema<ICode>({
  code: { type: String, required: true, unique: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 2 },
})

const Code: Model<ICode> = mongoose.models.Code || mongoose.model<ICode>("Code", CodeSchema)

export default Code
