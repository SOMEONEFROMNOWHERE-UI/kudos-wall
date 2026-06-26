import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  streak: number;
  lastKudosGiven: Date | null;
  bio?: string;
  title?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      trim: true,
      minlength: [1, 'Name cannot be empty'],
      maxlength: [50, 'Name too long'],
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastKudosGiven: {
      type: Date,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [160, 'Bio cannot exceed 160 characters'],
      default: '',
    },
    title: {
      type: String,
      maxlength: [50, 'Title cannot exceed 50 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ name: 1 }, { unique: true });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
