import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Expense from "@/models/Expense";

// POST: Calculate settlement for a group
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

    // Luôn luôn lấy toàn bộ chi tiêu trên hệ thống để quyết toán toàn cục
    const expenses = await Expense.find({})
      .populate("paidBy", "name username")
      .populate("splitDetails.user", "name username");

    // Calculate net balance for each user
    const balances: Record<string, { 
      name: string; 
      username: string; 
      balance: number;
      paidAmount: number;
      owedAmount: number;
      expensesInvolved: { description: string; amount: number; type: "paid" | "owed"; date: Date }[]
    }> = {};

    for (const expense of expenses) {
      const payer = expense.paidBy as unknown as {
        _id: { toString: () => string };
        name: string;
        username: string;
      };
      const payerId = payer._id.toString();

      if (!balances[payerId]) {
        balances[payerId] = {
          name: payer.name,
          username: payer.username,
          balance: 0,
          paidAmount: 0,
          owedAmount: 0,
          expensesInvolved: []
        };
      }
      // Payer paid this amount
      balances[payerId].balance += expense.amount;
      balances[payerId].paidAmount += expense.amount;
      balances[payerId].expensesInvolved.push({
        description: expense.description,
        amount: expense.amount,
        type: "paid",
        date: expense.date
      });

      // Each split person owes their portion
      for (const detail of expense.splitDetails) {
        const splitUser = detail.user as unknown as {
          _id: { toString: () => string };
          name: string;
          username: string;
        };
        const splitUserId = splitUser._id.toString();

        if (!balances[splitUserId]) {
          balances[splitUserId] = {
            name: splitUser.name,
            username: splitUser.username,
            balance: 0,
            paidAmount: 0,
            owedAmount: 0,
            expensesInvolved: []
          };
        }
        // This person owes this amount
        balances[splitUserId].balance -= detail.amount;
        balances[splitUserId].owedAmount += detail.amount;
        balances[splitUserId].expensesInvolved.push({
          description: expense.description,
          amount: detail.amount,
          type: "owed",
          date: expense.date
        });
      }
    }

    // Calculate settlements (who pays whom)
    const debtors: { id: string; name: string; amount: number }[] = [];
    const creditors: { id: string; name: string; amount: number }[] = [];

    for (const [id, info] of Object.entries(balances)) {
      if (info.balance < -0.01) {
        debtors.push({ id, name: info.name, amount: Math.abs(info.balance) });
      } else if (info.balance > 0.01) {
        creditors.push({ id, name: info.name, amount: info.balance });
      }
    }

    // Sort to optimize settlements
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements: {
      from: { id: string; name: string };
      to: { id: string; name: string };
      amount: number;
    }[] = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].amount, creditors[j].amount);

      if (amount > 0.01) {
        settlements.push({
          from: { id: debtors[i].id, name: debtors[i].name },
          to: { id: creditors[j].id, name: creditors[j].name },
          amount: Math.round(amount * 100) / 100,
        });
      }

      debtors[i].amount -= amount;
      creditors[j].amount -= amount;

      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }

    return NextResponse.json({
      balances: Object.entries(balances).map(([id, info]) => ({
        id,
        ...info,
        balance: Math.round(info.balance * 100) / 100,
      })),
      settlements,
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
      expenseCount: expenses.length,
    });
  } catch (error: unknown) {
    console.error("Settlement error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi" },
      { status: 500 }
    );
  }
}
