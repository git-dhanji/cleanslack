import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId
  content: string
  sender: mongoose.Types.ObjectId
  channel: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

MessageSchema.index({ channel: 1, createdAt: -1 })

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema)

export default Message
