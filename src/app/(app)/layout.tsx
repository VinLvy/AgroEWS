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
    <div className="min-h-screen bg-surface-canvas flex flex-col text-content-primary">
      <Navbar
        userName={session.user.name || "Petugas Lapangan"}
        userRole={session.user.role}
      />
      <main className="flex-1 w-full lg:pl-[276px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-10">
          {children}
        </div>
      </main>
    </div>
  );
}
