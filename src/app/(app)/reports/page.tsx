import React from "react";
import { auth } from "@/auth";
import { ReportsClient } from "./ReportsClient";

export const metadata = {
  title: "Feed Laporan Petani (Ground-Truthing) - AgroEWS",
};

export default async function ReportsPage() {
  const session = await auth();
  return <ReportsClient userRole={session?.user?.role || "ppl"} />;
}
