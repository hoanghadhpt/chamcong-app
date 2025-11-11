import Navigation from "@/components/Navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 pb-24">
        {children}
      </main>
    </div>
  );
}
