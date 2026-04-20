import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Expense from "@/models/Expense";

type Params = { params: Promise<{ id: string }> };

// GET: Get expense by ID
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
    const expense = await Expense.findById(id)
      .populate("paidBy", "name username")
      .populate("splitAmong", "name username")
      .populate("splitDetails.user", "name username")
      .populate("group", "name")
      .populate("createdBy", "name username");

    if (!expense) {
      return NextResponse.json(
        { error: "Không tìm thấy chi tiêu" },
        { status: 404 }
      );
    }

    // Check access
    if (
      session.user.role !== "admin" &&
      expense.createdBy._id.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }

    return NextResponse.json(expense);
  } catch (error: unknown) {
    console.error("Get expense error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}

// PUT: Update expense
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
    const expense = await Expense.findById(id);

    if (!expense) {
      return NextResponse.json(
        { error: "Không tìm thấy chi tiêu" },
        { status: 404 }
      );
    }

    // Only admin or creator can update
    if (
      session.user.role !== "admin" &&
      expense.createdBy.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Không có quyền chỉnh sửa" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { description, amount, date, paidBy, splitAmong, splitType, splitDetails } = body;

    // Recalculate split details if equal split
    let calculatedSplitDetails = splitDetails;
    if (splitType === "equal" && splitAmong && splitAmong.length > 0) {
      const splitAmount = (amount || expense.amount) / splitAmong.length;
      calculatedSplitDetails = splitAmong.map((userId: string) => ({
        user: userId,
        amount: Math.round(splitAmount * 100) / 100,
      }));
    }

    const updated = await Expense.findByIdAndUpdate(
      id,
      {
        description: description || expense.description,
        amount: amount || expense.amount,
        date: date || expense.date,
        paidBy: paidBy || expense.paidBy,
        splitAmong: splitAmong || expense.splitAmong,
        splitType: splitType || expense.splitType,
        splitDetails: calculatedSplitDetails || expense.splitDetails,
      },
      { new: true }
    )
      .populate("paidBy", "name username")
      .populate("splitAmong", "name username")
      .populate("splitDetails.user", "name username")
      .populate("group", "name")
      .populate("createdBy", "name username");

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Update expense error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}

// DELETE: Delete expense
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
    const expense = await Expense.findById(id);

    if (!expense) {
      return NextResponse.json(
        { error: "Không tìm thấy chi tiêu" },
        { status: 404 }
      );
    }

    // Only admin or creator can delete
    if (
      session.user.role !== "admin" &&
      expense.createdBy.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Không có quyền xóa" },
        { status: 403 }
      );
    }

    await Expense.findByIdAndDelete(id);

    return NextResponse.json({ message: "Đã xóa chi tiêu" });
  } catch (error: unknown) {
    console.error("Delete expense error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}
