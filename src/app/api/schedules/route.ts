import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET: Lấy lịch trình theo userId
export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("Vintellitour");

    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Truy vấn lịch trình theo userId
    const rawSchedules = await db
      .collection("itineraries")
      .find({ user: new ObjectId(userId) })  // Chú ý `user` thay vì `userId`
      .toArray();

    // Chuyển _id và user từ ObjectId -> string để dùng được trên frontend
    const schedules = rawSchedules.map((s) => ({
      ...s,
      _id: s._id.toString(),
      user: s.user.toString(),  // Chuyển đổi ObjectId sang string
      itinerary: s.itinerary.map((day: any) => ({
        ...day,
        _id: day._id.toString(),  // Chuyển đổi _id trong từng ngày
      })),
    }));


    return NextResponse.json(schedules, { status: 200 });
  } catch (error) {
    console.error("GET schedules error:", error);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}
