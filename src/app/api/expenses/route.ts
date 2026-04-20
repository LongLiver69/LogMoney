import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Expense from "@/models/Expense";
import Group from "@/models/Group";

// GET: List expenses (optionally filtered by group)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (groupId) {
      filter.group = groupId;
    }

    // Non-admin users can only see their own expenses
    if (session.user.role !== "admin") {
      filter.$or = [
        { createdBy: session.user.id },
        { paidBy: session.user.id },
        { splitAmong: session.user.id },
      ];
    }

    const expenses = await Expense.find(filter)
      .populate("paidBy", "name username")
      .populate("splitAmong", "name username")
      .populate("splitDetails.user", "name username")
      .populate("group", "name")
      .populate("createdBy", "name username")
      .sort({ date: -1 });

    return NextResponse.json(expenses);
  } catch (error: unknown) {
    console.error("Get expenses error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}

// POST: Create a new expense
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
    const body = await req.json();
    const { description, amount, date, paidBy, splitAmong, splitType, splitDetails, group } = body;

    if (!description || !amount || !paidBy || !group) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin" },
        { status: 400 }
      );
    }

    // Check group exists and user has access
    const groupDoc = await Group.findById(group);
    if (!groupDoc) {
      return NextResponse.json(
        { error: "Không tìm thấy nhóm" },
        { status: 404 }
      );
    }

    if (
      session.user.role !== "admin" &&
      !groupDoc.members.some(
        (m: { toString: () => string }) => m.toString() === session.user.id
      )
    ) {
      return NextResponse.json(
        { error: "Không có quyền thêm chi tiêu vào nhóm này" },
        { status: 403 }
      );
    }

    // Calculate split details if equal split
    let calculatedSplitDetails = splitDetails;
    if (splitType === "equal" && splitAmong && splitAmong.length > 0) {
      const splitAmount = amount / splitAmong.length;
      calculatedSplitDetails = splitAmong.map((userId: string) => ({
        user: userId,
        amount: Math.round(splitAmount * 100) / 100,
      }));
    }

    const expense = await Expense.create({
      description,
      amount,
      date: date || new Date(),
      paidBy,
      splitAmong: splitAmong || [],
      splitType: splitType || "equal",
      splitDetails: calculatedSplitDetails || [],
      group,
      createdBy: session.user.id,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate("paidBy", "name username")
      .populate("splitAmong", "name username")
      .populate("splitDetails.user", "name username")
      .populate("group", "name")
      .populate("createdBy", "name username");

    return NextResponse.json(populatedExpense, { status: 201 });
  } catch (error: unknown) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}
