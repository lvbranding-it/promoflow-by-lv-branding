
"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LayoutDashboard,
  Megaphone,
  Boxes,
  Users,
  QrCode,
  Gift,
  ArrowRight,
  BarChart3,
  Share2,
} from "lucide-react";
import Link from "next/link";
import {cn} from "@/lib/utils";

const menuItems = [
  {
    href: "/redeem",
    title: "Redeem Rewards",
    description: "Scan QR codes to validate customer rewards.",
    icon: <QrCode className="size-8 text-primary-foreground" />,
    isPrimary: true,
  },
  {
    href: "/dashboard/analytics",
    title: "View Analytics Dashboard",
    description: "See key metrics and campaign performance.",
    icon: <BarChart3 className="size-8 text-primary" />,
  },
  {
    href: "/campaigns",
    title: "Manage Campaigns",
    description: "Create, edit, and track your promotions.",
    icon: <Megaphone className="size-8 text-primary" />,
  },
  {
    href: "/inventory",
    title: "Manage Inventory",
    description: "Monitor and control promotional item stock.",
    icon: <Boxes className="size-8 text-primary" />,
  },
  {
    href: "/customers",
    title: "View Customers",
    description: "See your customer database and engagement.",
    icon: <Users className="size-8 text-primary" />,
  },
  {
    href: "/social-rewards",
    title: "Social Rewards",
    description: "Grant rewards for social media shares.",
    icon: <Share2 className="size-8 text-primary" />,
  },
  {
    href: "/birthday-rewards",
    title: "Birthday Automation",
    description: "Generate personalized birthday gifts for customers.",
    icon: <Gift className="size-8 text-primary" />,
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <Link href={item.href} key={item.title} className={cn(
            item.isPrimary && "md:col-span-2 lg:col-span-3"
          )}>
            <Card className={cn(
              "h-full hover:bg-accent/50 hover:border-primary/50 transition-colors group flex items-center",
              item.isPrimary && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}>
              <CardHeader className="flex-1 flex flex-row items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  {item.icon}
                  <div>
                    <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                    <CardDescription className={cn("text-xs", item.isPrimary && "text-primary-foreground/80")}>
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="size-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
