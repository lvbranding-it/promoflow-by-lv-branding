
"use client";

import {useState, useEffect, useRef, useCallback, memo} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {CheckCircle, XCircle, Gift, AlertTriangle, QrCode} from "lucide-react";
import {useToast} from "@/hooks/use-toast";
import {Html5Qrcode, Html5QrcodeScannerState} from "html5-qrcode";
import {Alert, AlertTitle, AlertDescription} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {
  type Campaign,
  type Customer,
  getCustomer,
  getActiveCampaign,
  getInventory,
  redeemReward,
  getCampaigns,
} from "@/lib/firestore";


type ValidationStatus = "idle" | "success" | "failure" | "loading";

interface RedemptionResult {
    customerName: string;
    campaignName: string;
    rewardValue: string;
    message?: string;
}

const qrcodeRegionId = "html5qr-code-full-region";

const Scanner = memo(function Scanner({onScanSuccess}: { onScanSuccess: (decodedText: string) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // cleanup function
    const cleanup = () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err) => console.error("Error stopping scanner on cleanup:", err));
      }
    };

    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(qrcodeRegionId, false);
    }
    const html5Qrcode = scannerRef.current;

    const startScanner = async () => {
      try {
        if (html5Qrcode.isScanning) return;
        await html5Qrcode.start(
          {facingMode: "environment"},
          {fps: 10, qrbox: {width: 250, height: 250}},
          (decodedText, _decodedResult) => {
            if (html5Qrcode.isScanning) {
              html5Qrcode.stop().then(() => onScanSuccess(decodedText));
            }
          },
          (_errorMessage) => {
            // ignore
          }
        );
        setHasPermission(true);
      } catch (err) {
        setHasPermission(false);
        console.error("Camera permission error:", err);
      }
    };

    startScanner();

    return () => {
      cleanup();
    };
  }, [onScanSuccess]);

  return (
    <Card>
      <CardContent className="p-2">
        <div id={qrcodeRegionId} className="w-full aspect-square bg-slate-100 rounded-md" />
        {!hasPermission && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Camera Permission Required</AlertTitle>
            <AlertDescription>
              Please grant camera permissions in your browser to use the scanner.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
});
Scanner.displayName = "Scanner";


export default function RedeemPage() {
  const [status, setStatus] = useState<ValidationStatus>("idle");
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const {toast} = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleRedeem = useCallback(async (scannedCustomerId: string) => {
    if (!scannedCustomerId || !scannedCustomerId.startsWith("cust_")) {
      toast({title: "Invalid Scan", description: "The scanned code is not a valid customer ID.", variant: "destructive"});
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setResult(null);

    try {
      const customer = await getCustomer(scannedCustomerId);

      if (!customer) {
        setResult({customerName: "Unknown", campaignName: "N/A", rewardValue: "N/A", message: "Customer ID not found."});
        setStatus("failure");
        return;
      }

      const activeCampaign = await getActiveCampaign();

      if (!activeCampaign) {
        setResult({customerName: customer.name, campaignName: "N/A", rewardValue: "N/A", message: "No active campaigns available for redemption."});
        setStatus("failure");
        return;
      }

      // This is now handled by the redeemReward function's transaction
      // const redemptionCollectionRef = collection(db, `customers/${scannedCustomerId}/redemptions`);
      // const q = query(redemptionCollectionRef, where("campaignId", "==", activeCampaign.id));
      // const existingRedemption = await getDocs(q);

      // if (!existingRedemption.empty) {
      //     const redeemedAt = new Date(existingRedemption.docs[0].data().redeemedAt.toDate()).toLocaleDateString();
      //     setResult({ customerName: customer.name, campaignName: activeCampaign.name, rewardValue: activeCampaign.rewardValue, message: `Customer has already redeemed this offer on ${redeemedAt}.` });
      //     setStatus('failure');
      //     return;
      // }

      if (activeCampaign.inventoryId) {
        const inventoryItem = (await getInventory()).find((i) => i.id === activeCampaign.inventoryId);

        if (inventoryItem && inventoryItem.stock !== "Unlimited") {
          const allCampaigns = await getCampaigns();
          const totalRedemptions = allCampaigns
            .filter((c) => c.inventoryId === activeCampaign.inventoryId)
            .reduce((sum, c) => sum + c.redemptions, 0);

          if (totalRedemptions >= inventoryItem.stock) {
            setResult({customerName: customer.name, campaignName: activeCampaign.name, rewardValue: activeCampaign.rewardValue, message: `Reward is out of stock (Campaign: ${activeCampaign.name}).`});
            setStatus("failure");
            return;
          }
        }
      }

      await redeemReward(customer.id, activeCampaign);

      setResult({customerName: customer.name, campaignName: activeCampaign.name, rewardValue: activeCampaign.rewardValue});
      setStatus("success");
      toast({title: "Success!", description: `${customer.name} redeemed ${activeCampaign.name}.`});
      audioRef.current?.play();
    } catch (error) {
      console.error("Redemption failed:", error);
      setResult({customerName: "Error", campaignName: "N/A", rewardValue: "N/A", message: "An unexpected error occurred."});
      setStatus("failure");
    }
  }, [toast]);

  const resetScanner = () => {
    setStatus("idle");
    setResult(null);
  };

  const renderStatus = () => {
    switch (status) {
    case "success":
      return (
        <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="items-center text-center">
            <CheckCircle className="size-12 text-green-500" />
            <CardTitle className="text-green-700 dark:text-green-400">Reward Validated!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-1">
            <p><span className="font-semibold">Customer:</span> {result?.customerName}</p>
            <p><span className="font-semibold">Campaign:</span> {result?.campaignName}</p>
            <p><span className="font-semibold">Reward:</span> {result?.rewardValue}</p>
            <p className="text-sm text-muted-foreground">Logged at {new Date().toLocaleTimeString()}</p>
          </CardContent>
        </Card>
      );
    case "failure":
      return (
        <Card className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
          <CardHeader className="items-center text-center">
            <XCircle className="size-12 text-red-500" />
            <CardTitle className="text-red-700 dark:text-red-400">Redemption Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>{result?.message || "This code is invalid or expired."}</p>
          </CardContent>
        </Card>
      );
    case "loading":
      return <p className="text-center animate-pulse">Validating...</p>;
    case "idle":
    default:
      return (
        <div className="text-center text-muted-foreground p-8 border rounded-lg">
          <Gift className="mx-auto size-12 mb-4 text-primary"/>
          <h3 className="text-lg font-semibold">Ready to Redeem</h3>
          <p>Point the camera at a customer's QR code.</p>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-headline font-bold">Redemption Scanner</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
                Scan a customer's unique QR code to validate and redeem their reward.
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        {status === "idle" && <Scanner onScanSuccess={handleRedeem} />}

        <div className="animate-in fade-in duration-500">
          {renderStatus()}
        </div>

        {(status === "success" || status === "failure") && (
          <Button onClick={resetScanner} className="w-full">
            <QrCode className="mr-2" />
                Scan Again
          </Button>
        )}

        <audio ref={audioRef} src="/cash-register.mp3" preload="auto" />
      </div>
    </div>
  );
}
