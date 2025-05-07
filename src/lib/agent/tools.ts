import { TavilySearch } from "@langchain/tavily";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { MongoClient } from "mongodb";
import Itinerary from "@/models/itinerary";
import dbConnect from "../dbConnect";
import { IItinerary } from "@/models/itinerary";
import { vi } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import { getItineraryChangesSummaryDetailed } from "./utils";
import { z } from "zod";

const MONGODB_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = "Vintellitour";

const addItineraryTool = new DynamicStructuredTool({
  name: "add_itinerary",
  description: "Add an itinerary to the database",
  schema: z.object({
    userId: z.string(),
    destination: z.string(),
    duration: z.string(),
    itinerary: z.array(
      z.object({
        day: z.number(),
        morning: z.object({
          activities: z.array(
            z.object({
              description: z.string(),
              cost: z.number(),
            })
          ),
        }),
        afternoon: z.object({
          activities: z.array(
            z.object({
              description: z.string(),
              cost: z.number(),
            })
          ),
        }),
        evening: z.object({
          activities: z.array(
            z.object({
              description: z.string(),
              cost: z.number(),
            })
          ),
        }),
      })
    ),
  }),

  func: async ({ userId, destination, duration, itinerary }) => {
    console.log("✅ Received userId from LangGraph:", userId);
    try {
      // Kết nối với MongoDB trước khi thực hiện thao tác lưu
      await dbConnect();

      // Tạo một lịch trình mới
      const newItinerary = new Itinerary({
        user: userId, // Gán userId vào lịch trình
        destination,
        duration,
        itinerary,
      });

      // Lưu vào cơ sở dữ liệu
      await newItinerary.save();

      return {
        success: true,
        message: `Lịch trình cho ${destination} đã được thêm thành công.`,
      };
    } catch (error) {
      console.error("Lỗi khi lưu lịch trình:", error);
      return {
        success: false,
        message: `Có lỗi xảy ra khi lưu lịch trình cho ${destination}.`,
      };
    }
  },
});

const findItinerariesTool = new DynamicStructuredTool({
  name: "find_itineraries",
  description:
    "Find itineraries for a user and return them in XML format to help select one",
  schema: z.object({
    userId: z.string(),
  }),

  func: async ({ userId }) => {
    await dbConnect();

    const itineraries = await Itinerary.find({ user: userId }).lean();

    if (itineraries.length === 0) {
      return {
        success: false,
        message: "Không tìm thấy lịch trình nào cho người dùng này.",
      };
    }

    // Tạo danh sách XML
    const itineraryContextList = itineraries.map((item, index) => {
      const id = item._id.toString();
      const destination = item.destination;
      const duration = item.duration;
      const indexValue = index + 1;

      return {
        id,
        index: indexValue,
        destination,
        duration,
        tag: `<iTinerary index=${indexValue} id="${id}">${destination} - ${duration}</iTinerary>`,
      };
    });

    return {
      success: true,
      message: `Tôi đã tìm thấy ${itineraries.length} lịch trình. Bạn muốn chọn lịch trình nào để cập nhật?`,
      readableList: itineraryContextList
        .map((item) => `- ${item.destination} - ${item.duration}`)
        .join("\n"),
      xmlTags: itineraryContextList.map((item) => item.tag).join("\n"),
      itineraryContextList, // <-- phần structured context bạn cần
    };
  },
});

const searchTavily = new TavilySearch({
  maxResults: 3,
  searchDepth: "advanced",
});

export const TOOLS = [
  searchTavily,
  addItineraryTool,
  findItinerariesTool,
  // updateItineraryTool,
];
