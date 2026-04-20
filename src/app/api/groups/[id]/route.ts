import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Group from "@/models/Group";

type Params = { params: Promise<{ id: string }> };

// GET: Get group by ID
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;
    const group = await Group.findById(id)
      .populate("members", "name username")
      .populate("createdBy", "name username");

    if (!group) {
      return NextResponse.json(
        { error: "Không tìm thấy nhóm" },
        { status: 404 }
      );
    }

    // Check access
    if (
      session.user.role !== "admin" &&
      !group.members.some(
        (m: { _id: { toString: () => string } }) =>
          m._id.toString() === session.user.id
      )
    ) {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }

    return NextResponse.json(group);
  } catch (error: unknown) {
    console.error("Get group error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}

// PUT: Update group
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;
    const { name, description, members } = await req.json();

    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json(
        { error: "Không tìm thấy nhóm" },
        { status: 404 }
      );
    }

    // Only admin or creator can update
    if (
      session.user.role !== "admin" &&
      group.createdBy.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Không có quyền chỉnh sửa" },
        { status: 403 }
      );
    }

    const updated = await Group.findByIdAndUpdate(
      id,
      { name, description, members },
      { new: true }
    )
      .populate("members", "name username")
      .populate("createdBy", "name username");

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Update group error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}

// DELETE: Delete group
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;
    const group = await Group.findById(id);

    if (!group) {
      return NextResponse.json(
        { error: "Không tìm thấy nhóm" },
        { status: 404 }
      );
    }

    // Only admin or creator can delete
    if (
      session.user.role !== "admin" &&
      group.createdBy.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Không có quyền xóa" },
        { status: 403 }
      );
    }

    await Group.findByIdAndDelete(id);

    return NextResponse.json({ message: "Đã xóa nhóm" });
  } catch (error: unknown) {
    console.error("Delete group error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}
