import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Group from "@/models/Group";

// GET: List groups for current user
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    await dbConnect();

    let groups;
    if (session.user.role === "admin") {
      groups = await Group.find({})
        .populate("members", "name username")
        .populate("createdBy", "name username")
        .sort({ createdAt: -1 });
    } else {
      groups = await Group.find({ members: session.user.id })
        .populate("members", "name username")
        .populate("createdBy", "name username")
        .sort({ createdAt: -1 });
    }

    return NextResponse.json(groups);
  } catch (error: unknown) {
    console.error("Get groups error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}

// POST: Create a new group
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { name, description, members } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên nhóm" },
        { status: 400 }
      );
    }

    // Ensure creator is in members list
    const memberList = members || [];
    if (!memberList.includes(session.user.id)) {
      memberList.push(session.user.id);
    }

    const group = await Group.create({
      name,
      description: description || "",
      members: memberList,
      createdBy: session.user.id,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate("members", "name username")
      .populate("createdBy", "name username");

    return NextResponse.json(populatedGroup, { status: 201 });
  } catch (error: unknown) {
    console.error("Create group error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}
