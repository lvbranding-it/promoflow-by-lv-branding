
"use client";

import {useState, useEffect} from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {MoreHorizontal, PlusCircle} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useToast} from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {getCampaigns, deleteCampaign as deleteCampaignFromDb, type Campaign} from "@/lib/firestore";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const {toast} = useToast();

  useEffect(() => {
    async function fetchCampaigns() {
      setIsLoading(true);
      try {
        const campaignData = await getCampaigns();
        setCampaigns(campaignData);
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
        toast({title: "Error", description: "Failed to load campaigns.", variant: "destructive"});
      } finally {
        setIsLoading(false);
      }
    }
    fetchCampaigns();
  }, [toast]);

  const deleteCampaign = async (id: string) => {
    try {
      await deleteCampaignFromDb(id);
      setCampaigns(campaigns.filter((c) => c.id !== id));
      toast({
        title: "Campaign Deleted!",
        description: "The campaign has been successfully deleted.",
      });
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      toast({title: "Error", description: "Failed to delete campaign.", variant: "destructive"});
    }
  };

  const getLandingPageUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin + "/landing";
    }
    return "";
  };

  const handleGeneratePdf = async (campaign: Campaign) => {
    if (!campaign?.flyerImage) {
      toast({title: "No Flyer Image", description: "This campaign does not have a flyer image to generate a PDF.", variant: "destructive"});
      return;
    };

    // Use a temporary, off-screen div for high-resolution rendering
    const tempFlyerContainer = document.createElement("div");
    tempFlyerContainer.style.position = "absolute";
    tempFlyerContainer.style.left = "-9999px";
    tempFlyerContainer.style.width = "1200px";
    tempFlyerContainer.style.height = "1800px";
    document.body.appendChild(tempFlyerContainer);

    const tempFlyer = document.createElement("div");
    tempFlyer.style.position = "relative";
    tempFlyer.style.width = "100%";
    tempFlyer.style.height = "100%";
    tempFlyer.style.fontFamily = "sans-serif"; // Ensure consistent font rendering
    tempFlyerContainer.appendChild(tempFlyer);

    const backgroundImage = document.createElement("img");
    backgroundImage.src = campaign.flyerImage;
    backgroundImage.style.position = "absolute";
    backgroundImage.style.width = "100%";
    backgroundImage.style.height = "100%";
    backgroundImage.style.objectFit = "cover";
    backgroundImage.style.zIndex = "1";
    tempFlyer.appendChild(backgroundImage);

    const qrWrapper = document.createElement("div");
    qrWrapper.style.position = "absolute";
    qrWrapper.style.top = "39%";
    qrWrapper.style.left = "50%";
    qrWrapper.style.transform = "translate(-50%, -50%)";
    qrWrapper.style.padding = "20px"; // Increased padding for white border
    qrWrapper.style.backgroundColor = "white";
    qrWrapper.style.borderRadius = "8px";
    qrWrapper.style.zIndex = "2";
    tempFlyer.appendChild(qrWrapper);

    const qrImage = document.createElement("img");
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(getLandingPageUrl())}&q=H&margin=1`;
    qrImage.style.width = "350px";
    qrImage.style.height = "350px";
    qrImage.style.display = "block";
    qrImage.style.imageRendering = "pixelated"; // Keeps QR code sharp
    qrWrapper.appendChild(qrImage);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const canvas = await html2canvas(tempFlyer, {
      useCORS: true,
      scale: 1,
    });

    document.body.removeChild(tempFlyerContainer);

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "in",
      format: [4, 6],
    });

    pdf.addImage(imgData, "PNG", 0, 0, 4, 6);
    pdf.save(`${campaign.name.replace(/\s+/g, "_")}-Flyer.pdf`);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-headline font-bold">Campaign Manager</h1>
          <p className="text-muted-foreground mt-2">
                Create, manage, and track all your promotional campaigns.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/campaigns/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flyer</TableHead>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Redemptions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Loading campaigns...</TableCell>
                </TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">No campaigns found.</TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <Image
                        unoptimized
                        src={campaign.flyerImage || "https://placehold.co/60x90.png"}
                        alt={campaign.name}
                        width={40}
                        height={60}
                        data-ai-hint="flyer thumbnail"
                        className="rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant={campaign.status === "Active" ? "default" : "secondary"} className={campaign.status === "Active" ? "bg-green-600" : ""}>{campaign.status}</Badge>
                    </TableCell>
                    <TableCell>{campaign.rewardValue}</TableCell>
                    <TableCell>{campaign.redemptions}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem asChild>
                            <Link href={`/campaigns/${campaign.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/campaigns/${campaign.id}/edit`}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGeneratePdf(campaign)} disabled={!campaign.flyerImage}>Generate Flyer</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteCampaign(campaign.id)} className="text-red-500">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
