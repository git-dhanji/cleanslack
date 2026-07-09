import mongoose, { Schema, type Model } from "mongoose"

// A reserved connection code. It carries no user data — just the random code
// and when it was reserved. A TTL index auto-deletes a reservation 2 days after
// it was created, so a code a user made stays resumable/rejoinable within that
// window, then cleans itself up even if the peer never releases it explicitly.
// An "exit & destroy" deletes it immediately (see /api/code release).

const CODE_TTL_SECONDS = 60 * 60 * 24 * 2 // 2 days

export interface ICode {
  code: string
  createdAt: Date
}

const CodeSchema = new Schema<ICode>({
  code: { type: String, required: true, unique: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now, expires: CODE_TTL_SECONDS },
})

const Code: Model<ICode> = mongoose.models.Code || mongoose.model<ICode>("Code", CodeSchema)

export default Code
