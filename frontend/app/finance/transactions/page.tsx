"use client";

import { useEffect, useState } from "react";

type Transaction = {
  id: number;
  type: "Income" | "Expense";
  title: string;
  amount: number;
  category: string;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [type, setType] = useState<"Income" | "Expense">("Expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

    const fetchTransactions = async () => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/finance/`
    );

    const data = await res.json();

    setTransactions(data);
  } catch (error) {
    console.error(error);
  }
};

 const addTransaction = async () => {
  if (!title || !amount || !category) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/finance/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          title,
          amount: Number(amount),
          category,
          date: new Date().toISOString(),
        }),
      }
    );

    if (!res.ok) {
      throw new Error("Failed");
    }

    await fetchTransactions();

    setTitle("");
    setAmount("");
    setCategory("");

  } catch (error) {
    console.error(error);
    alert("Could not save transaction");
  }
};

const deleteTransaction = async (id: number) => {
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/finance/${id}`,
      {
        method: "DELETE",
      }
    );

    fetchTransactions();
  } catch (error) {
    console.error(error);
  }
};

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">Finance Transactions</h1>

      <p className="mt-2 text-slate-400">
        Add income and expenses to build your financial profile.
      </p>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "Income" | "Expense")}
            className="bg-slate-800 p-3 rounded-lg outline-none"
          >
            <option>Income</option>
            <option>Expense</option>
          </select>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            type="number"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <button
            onClick={addTransaction}
            className="bg-indigo-600 px-4 py-3 rounded-lg hover:bg-indigo-500"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <h2 className="text-xl font-semibold">Recent Transactions</h2>

        {transactions.length === 0 ? (
          <p className="mt-4 text-slate-400">No transactions added yet.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {transactions.map((item) => (
              <div
  key={item.id}
  className="flex items-center justify-between bg-slate-800 p-4 rounded-lg"
>
  <div>
    <p className="font-medium">
      {item.title}
    </p>

    <p className="text-sm text-slate-400">
      {item.category} • {item.type}
    </p>
  </div>

  <div className="flex items-center gap-4">

    <p
      className={
        item.type === "Income"
          ? "text-green-400 font-bold"
          : "text-red-400 font-bold"
      }
    >
      {item.type === "Income" ? "+" : "-"}$
      {item.amount}
    </p>

    <button
      onClick={() => deleteTransaction(item.id)}
      className="bg-red-600 px-3 py-1 rounded"
    >
      Delete
    </button>

  </div>
</div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}