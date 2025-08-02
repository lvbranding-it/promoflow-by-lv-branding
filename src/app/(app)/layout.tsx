"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from "@/lib/auth";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";

const sidebarNavItems = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Campaigns", href: "/campaigns" },
  { title: "Customers", href: "/customers" },
  { title: "Inventory", href: "/inventory" },
  { title: "Redeem", href: "/redeem" },
  { title: "Birthday Rewards", href: "/birthday-rewards" },
  { title: "Social Media Rewards", href: "/social-rewards" },
  { title: "Analytics", href: "/dashboard/analytics" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFirebaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* TODO: Implement a proper header */}
      <header className="border-b py-4 px-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">PromoFlow</h1>
        {/* Add user menu/auth status here */}
      </header>
      <div className="flex flex-1">
        <aside className="w-60 border-r p-4 hidden md:block">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
