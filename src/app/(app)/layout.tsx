import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/agro/Navbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--surface-ground)] flex flex-col text-[var(--text-primary)]">
      <Navbar
        userName={session.user.name || "Petugas Lapangan"}
        userRole={session.user.role}
      />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-8">
        {children}
      </main>
    </div>
  );
}
