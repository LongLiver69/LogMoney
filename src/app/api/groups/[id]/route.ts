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

// PUT: Update group (add/remove members, update info)
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
    const body = await req.json();
    const { name, description, members, action, membersToAdd, membersToRemove } = body as {
      name?: string;
      description?: string;
      members?: string[];
      action?: string;
      membersToAdd?: string[];
      membersToRemove?: string[];
    };

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

    let updateData: Record<string, unknown> = {};

    if (action === "addMembers" && membersToAdd && membersToAdd.length > 0) {
      // Add specific members
      const currentMembers = group.members.map((m) => m.toString());
      const creatorId = group.createdBy.toString();
      const newMembers = membersToAdd.filter(
        (m) => !currentMembers.includes(m)
      );
      // Ensure creator is always included
      const allMembers = currentMembers.includes(creatorId)
        ? [...currentMembers, ...newMembers]
        : [creatorId, ...currentMembers, ...newMembers];
      updateData = { members: allMembers };
    } else if (action === "removeMembers" && membersToRemove && membersToRemove.length > 0) {
      // Remove specific members (cannot remove creator)
      const creatorId = group.createdBy.toString();
      const currentMembers = group.members.map((m) => m.toString());
      const filteredMembers = currentMembers.filter(
        (m) => !membersToRemove.includes(m) || m === creatorId
      );
      updateData = { members: filteredMembers };
    } else {
      // Full update (name, description, or replace all members)
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (members) {
        const creatorId = group.createdBy.toString();
        const memberList = members.includes(creatorId)
          ? members
          : [...members, creatorId];
        updateData.members = memberList;
      }
    }

    const updated = await Group.findByIdAndUpdate(id, updateData, { new: true })
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
