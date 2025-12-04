import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IChannel extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  description?: string
  isPrivate: boolean
  createdBy: mongoose.Types.ObjectId
  members: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const ChannelSchema = new Schema<IChannel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
)

ChannelSchema.index({ name: 1 }, { unique: true })

const Channel: Model<IChannel> = mongoose.models.Channel || mongoose.model<IChannel>("Channel", ChannelSchema)

export default Channel
