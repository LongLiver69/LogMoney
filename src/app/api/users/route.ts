import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// GET: List all users (admin only) - includes password for admin
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }

    await dbConnect();
    // Admin can see all fields including password
    const users = await User.find({}).sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error: unknown) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}

// PATCH: Approve/reject user (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }

    await dbConnect();
    const { userId, approved } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Thiếu thông tin user" },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { approved },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy user" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error: unknown) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}

// DELETE: Delete user (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Thiếu thông tin user" },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Không thể xóa chính mình" },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: "Đã xóa user" });
  } catch (error: unknown) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}
