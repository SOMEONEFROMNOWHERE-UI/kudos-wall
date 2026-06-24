import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKudos extends Document {
  sender: string;
  receiver: string;
  message: string;
  category: string;
  isAnonymous: boolean;
  expiresAt?: Date | null;
  createdAt: Date;
}

const KudosSchema = new Schema<IKudos>(
  {
    sender: {
      type: String,
      required: [true, 'Sender name is required'],
      trim: true,
      maxlength: [50, 'Sender name too long'],
    },
    receiver: {
      type: String,
      required: [true, 'Receiver name is required'],
      trim: true,
      maxlength: [50, 'Receiver name too long'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [1, 'Message cannot be empty'],
      maxlength: [2000, 'Message too long'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['🔥', '💎', '🚀', '🧠', '🫂'],
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
KudosSchema.index({ createdAt: -1 });
KudosSchema.index({ receiver: 1 });
KudosSchema.index({ sender: 1 });

const Kudos: Model<IKudos> =
  mongoose.models.Kudos || mongoose.model<IKudos>('Kudos', KudosSchema);

export default Kudos;
