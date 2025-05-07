import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const itineraryId = params.id;
    // const { userId } = req.nextUrl.searchParams;

    if (!itineraryId) {
      return NextResponse.json({ error: "Itinerary ID and User ID are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Vintellitour");

    // Kiểm tra và chuyển đổi id của lịch trình
    let itineraryIdObj;
    try {
      itineraryIdObj = new ObjectId(itineraryId);
    } catch (error) {
      return NextResponse.json({ error: "Invalid itinerary ID format" }, { status: 400 });
    }

    // Tìm lịch trình trong cơ sở dữ liệu
    const itinerary = await db.collection("itineraries").findOne({
      _id: itineraryIdObj,
      // user: new ObjectId(userId),
    });

    if (!itinerary) {
      return NextResponse.json(
        { error: "Lịch trình không tồn tại hoặc bạn không có quyền truy cập" },
        { status: 404 }
      );
    }

    return NextResponse.json(itinerary, { status: 200 });
  } catch (error) {
    console.error("GET itinerary error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve itinerary" },
      { status: 500 }
    );
  }
}
// DELETE: Xóa lịch trình theo id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itineraryId = params.id;
    const { userId } = await req.json();

    if (!itineraryId) {
      return NextResponse.json({ error: "Itinerary ID is required" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Vintellitour");

    // Kiểm tra xem lịch trình có tồn tại và thuộc về user không
    let userIdQuery;
    try {
      userIdQuery = new ObjectId(userId);
    } catch (error) {
      userIdQuery = userId; // Nếu không chuyển đổi được, sử dụng string
    }

    let itineraryIdObj;
    try {
      itineraryIdObj = new ObjectId(itineraryId);
    } catch (error) {
      return NextResponse.json({ error: "Invalid itinerary ID format" }, { status: 400 });
    }

    // Thử tìm bằng ObjectId cho user
    const itinerary = await db.collection("itineraries").findOne({
      _id: itineraryIdObj,
      user: userIdQuery
    });

    // Nếu không tìm thấy, thử tìm với user là string
    if (!itinerary && typeof userIdQuery !== 'string') {
      const itineraryAlt = await db.collection("itineraries").findOne({
        _id: itineraryIdObj,
        user: userId
      });
      
      if (!itineraryAlt) {
        return NextResponse.json(
          { error: "Lịch trình không tồn tại hoặc bạn không có quyền xóa" },
          { status: 404 }
        );
      }
    }

    // Thực hiện xóa lịch trình
    const result = await db.collection("itineraries").deleteOne({
      _id: itineraryIdObj,
      $or: [
        { user: userIdQuery },
        { user: userId }
      ]
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Không thể xóa lịch trình" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Xóa lịch trình thành công" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE itinerary error:", error);
    return NextResponse.json(
      { error: "Failed to delete itinerary" },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật lịch trình
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const itineraryId = params.id;
    const { userId, updates } = await req.json();

    if (!itineraryId) {
      return NextResponse.json({ error: "Itinerary ID is required" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Vintellitour");

    // Kiểm tra và chuyển đổi id của lịch trình
    let itineraryIdObj;
    try {
      itineraryIdObj = new ObjectId(itineraryId);
    } catch (error) {
      return NextResponse.json({ error: "Invalid itinerary ID format" }, { status: 400 });
    }

    // Kiểm tra nếu lịch trình tồn tại
    const itinerary = await db.collection("itineraries").findOne({
      _id: itineraryIdObj,
      user: new ObjectId(userId),
    });

    if (!itinerary) {
      return NextResponse.json(
        { error: "Lịch trình không tồn tại hoặc bạn không có quyền sửa" },
        { status: 404 }
      );
    }

    // Cập nhật lịch trình
    const result = await db.collection("itineraries").updateOne(
      { _id: itineraryIdObj, user: new ObjectId(userId) },
      { $set: updates }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Không thể cập nhật lịch trình" }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, message: "Cập nhật lịch trình thành công" },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT itinerary error:", error);
    return NextResponse.json(
      { error: "Failed to update itinerary" },
      { status: 500 }
    );
  }
}