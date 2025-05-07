import mongoose, { Document, Schema, Types } from "mongoose";
import { IUser } from "@/models/user"; // Import interface User

// Định nghĩa interface cho Itinerary
export interface IItinerary extends Document {
  _id: Types.ObjectId;
  createdAt?: Date;

  user: Types.ObjectId;
  destination: string;
  duration: string;
  itinerary: Array<{
    day: number;
    morning: {
      activities: Array<{
        description: string;
        cost: number;
      }>;
    };
    afternoon: {
      activities: Array<{
        description: string;
        cost: number;
      }>;
    };
    evening: {
      activities: Array<{
        description: string;
        cost: number;
      }>;
    };
  }>;
}

// Định nghĩa schema cho Itinerary
const activityBlock = {
  activities: [
    {
      description: { type: String, required: true },
      cost: { type: Number, required: true },
    },
  ],
};

const itinerarySchema = new Schema<IItinerary>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    itinerary: [
      {
        day: { type: Number, required: true },
        morning: activityBlock,
        afternoon: activityBlock,
        evening: activityBlock,
      },
    ],
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
);

// Tạo model Itinerary
const Itinerary = mongoose.model<IItinerary>("Itinerary", itinerarySchema);

export default Itinerary;
