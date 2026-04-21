import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// GET: List all users (admin only) - includes password for admin
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }

    await dbConnect();
    // User can only see basic info, Admin can see all including password
    const selectFields = session.user.role === "admin" ? "" : "-password";
    const users = await User.find({}).select(selectFields).sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error: unknown) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}

// POST: Create a new user (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }

    await dbConnect();
    const { name, username, password, role = "user" } = await req.json();

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "Tên đăng nhập đã tồn tại" },
        { status: 400 }
      );
    }

    const newUser = new User({
      name,
      username: username.toLowerCase(),
      password,
      role,
    });

    await newUser.save();
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: unknown) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo người dùng" },
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
