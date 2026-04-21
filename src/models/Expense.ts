import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISplitDetail {
  user: mongoose.Types.ObjectId;
  amount: number;
}

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  date: Date;
  paidBy: mongoose.Types.ObjectId;
  splitAmong: mongoose.Types.ObjectId[];
  splitType: "equal" | "custom";
  splitDetails: ISplitDetail[];
  group: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    description: {
      type: String,
      required: [true, "Vui lòng nhập mô tả"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Vui lòng nhập số tiền"],
      min: [0, "Số tiền phải lớn hơn 0"],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Vui lòng chọn người trả"],
    },
    splitAmong: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    splitType: {
      type: String,
      enum: ["equal", "custom"],
      default: "equal",
    },
    splitDetails: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        amount: {
          type: Number,
          default: 0,
        },
      },
    ],
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Expense: Model<IExpense> =
  mongoose.models.Expense ||
  mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
