
"use client";

import {Bar, BarChart, CartesianGrid, XAxis, YAxis} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import {Button} from "@/components/ui/button";
import {Download, ArrowLeft} from "lucide-react";
import {useEffect, useState} from "react";
import Link from "next/link";
import {getCustomers, getCampaigns, type Customer, type Campaign} from "@/lib/firestore";

const chartConfig = {
  redemptions: {
    label: "Redemptions",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;


export default function AnalyticsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [customersData, campaignsData] = await Promise.all([getCustomers(), getCampaigns()]);
        setCustomers(customersData);
        setCampaigns(campaignsData);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleExportCsv = () => {
    const headers = ["ID", "Name", "Email", "Phone", "Birthdate", "TotalRedemptions", "RedeemedCampaignIDs"];
    const rows = customers.map((customer) => {
      const redemptionIds = Object.keys(customer.redemptions || {});
      return [
        customer.id,
        `"${customer.name}"`,
        customer.email,
        customer.phone,
        customer.birthdate,
        redemptionIds.length,
        `"${redemptionIds.join(", ")}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," +
        headers.join(",") + "\n" +
        rows.join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customer_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRedemptions = campaigns.reduce((acc, campaign) => acc + (campaign.redemptions || 0), 0);
  const totalOptIns = customers.length;
  const activeCampaigns = campaigns.filter((c) => c.status === "Active").length;

  const topCampaign = campaigns.length > 0 ?
    campaigns.reduce((prev, current) => ((prev.redemptions || 0) > (current.redemptions || 0)) ? prev : current) :
    null;

  const chartData = campaigns.map((c) => ({
    campaign: c.name,
    redemptions: c.redemptions || 0,
  }));

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard"><ArrowLeft /></Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-4xl font-headline font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-2">
                    Key metrics and campaign performance at a glance.
            </p>
          </div>
        </div>
        <Button onClick={handleExportCsv} disabled={customers.length === 0} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Redemptions</CardTitle>
            <CardDescription>All campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalRedemptions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Opt-Ins</CardTitle>
            <CardDescription>All customers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalOptIns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
            <CardDescription>Currently running</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{activeCampaigns}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle>Top Campaign</CardTitle>
            <CardDescription className="text-primary-foreground/80">By redemptions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{topCampaign ? topCampaign.name : "N/A"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Total redemptions per campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={chartData} margin={{top: 20, right: 20, bottom: 20, left: 20}}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="campaign"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.length > 15 ? `${value.slice(0, 15)}...` : value}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="redemptions" fill="var(--color-redemptions)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
