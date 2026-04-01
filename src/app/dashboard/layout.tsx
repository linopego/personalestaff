import Sidebar from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-zinc-50">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
