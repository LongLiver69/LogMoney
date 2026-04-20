import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { name, username, password } = await req.json();

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "Tên đăng nhập đã được sử dụng" },
        { status: 400 }
      );
    }

    // Check if this is the first user - make them admin
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    // Store password as plain text
    const user = await User.create({
      name,
      username: username.toLowerCase(),
      password,
      role: isFirstUser ? "admin" : "user",
      approved: isFirstUser ? true : false,
    });

    return NextResponse.json(
      {
        message: isFirstUser
          ? "Tài khoản admin đã được tạo thành công!"
          : "Đăng ký thành công! Vui lòng chờ admin phê duyệt tài khoản.",
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          role: user.role,
          approved: user.approved,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi đăng ký" },
      { status: 500 }
    );
  }
}
