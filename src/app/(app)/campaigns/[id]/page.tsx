
"use client";

import {useEffect, useState, useCallback} from "react";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {ArrowLeft, Edit, Tag, TrendingUp, CheckCircle, Download, FileText, Calendar} from "lucide-react";
import Image from "next/image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {getCampaign, type Campaign} from "@/lib/firestore"; // getCampaign now uses getFirestoreInstance internally
import {useToast} from "@/hooks/use-toast";
import {useFirebaseAuth} from "@/lib/auth";
import LoadingAnimation from "@/components/ui/loading-animation";

export default function CampaignDetailsPage({params}: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const {id} = params;
  const {toast} = useToast();
  const {user, loading: authLoading} = useFirebaseAuth();

  const fetchCampaign = useCallback(async () => {
    if (authLoading || !user) return;
    // This check ensures data fetching only happens in the browser
    if (typeof window === "undefined" || !id) return;
    try {
      const fetchedCampaign = await getCampaign(id);
      setCampaign(fetchedCampaign);
    } catch (error) {
      console.error("Failed to fetch campaign details:", error);
      toast({title: "Error", description: "Failed to load campaign details.", variant: "destructive"});
    }
  }, [id, toast, user, authLoading]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const getLandingPageUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin + "/landing";
    }
    return "";
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getLandingPageUrl())}`;

  const handleDownloadQrCode = () => {
    if (!campaign) return;
    const link = document.createElement("a");
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getLandingPageUrl())}`;
    link.download = `${campaign.name.replace(/\s+/g, "_")}-QRCode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGeneratePdf = async () => {
    if (!campaign?.flyerImage) return;

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
    tempFlyer.style.fontFamily = "sans-serif";
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
    qrWrapper.style.padding = "20px";
    qrWrapper.style.backgroundColor = "white";
    qrWrapper.style.borderRadius = "8px";
    qrWrapper.style.zIndex = "2";
    tempFlyer.appendChild(qrWrapper);

    const qrImage = document.createElement("img");
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(getLandingPageUrl())}&q=H&margin=1`;
    qrImage.style.width = "350px";
    qrImage.style.height = "350px";
    qrImage.style.display = "block";
    qrImage.style.imageRendering = "pixelated";
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

  if (authLoading || !campaign) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingAnimation />
      </div>
    );
  }

  const getRewardDisplay = () => {
    if (campaign.rewardType === "% Off") {
      return `${campaign.rewardValue}% Off`;
    }
    return campaign.rewardValue;
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/campaigns"><ArrowLeft /></Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-4xl font-headline font-bold">{campaign.name}</h1>
            <p className="text-muted-foreground mt-2">
                Detailed view of your promotional campaign.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/campaigns/${campaign.id}/edit`}>
            <Edit className="mr-2" />
                Edit Campaign
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="flex items-center gap-3">
                <CheckCircle className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold">{campaign.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Tag className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Reward</p>
                  <p className="font-semibold">{getRewardDisplay()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Redemptions</p>
                  <p className="font-semibold">{campaign.redemptions}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-semibold">{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Campaign Assets</CardTitle>
              <CardDescription>Download QR code or flyer.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <Image
                  unoptimized
                  src={qrCodeUrl}
                  alt={`QR Code for ${campaign.name}`}
                  width={150}
                  height={150}
                  data-ai-hint="qr code"
                />
              </div>
              <div className="w-full flex flex-col gap-2">
                <Button onClick={handleDownloadQrCode} variant="outline" className="w-full">
                  <Download className="mr-2" />
                          Download QR
                </Button>
                <Button onClick={handleGeneratePdf} className="w-full" disabled={!campaign.flyerImage}>
                  <FileText className="mr-2" />
                          Generate Flyer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {campaign.flyerImage && (
        <div>
          <h2 className="text-2xl font-headline font-bold mb-4">Flyer Preview</h2>
          <div className="relative w-full max-w-[400px] mx-auto aspect-[2/3] shadow-lg rounded-md overflow-hidden bg-gray-200">
            <img
              src={campaign.flyerImage}
              alt="Flyer background"
              className="object-cover w-full h-full"
            />
            <div className="absolute" style={{top: "39%", left: "50%", transform: "translate(-50%, -50%)"}}>
              <div className="p-2 bg-white rounded-md">
                <Image
                  unoptimized
                  src={qrCodeUrl}
                  alt={`QR Code for ${campaign.name}`}
                  width={150}
                  height={150}
                  data-ai-hint="qr code"
                  style={{imageRendering: "pixelated"}}
                  className="w-[100px] h-[100px] sm:w-[150px] sm:h-[150px]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
