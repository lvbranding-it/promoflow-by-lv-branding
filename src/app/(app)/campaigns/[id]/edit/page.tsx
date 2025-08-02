
"use client";

import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Card, CardContent} from "@/components/ui/card";
import {useRouter} from "next/navigation";
import {useToast} from "@/hooks/use-toast";
import Link from "next/link";
import {ArrowLeft} from "lucide-react";
import {useEffect, useState, useCallback} from "react";
import {getCampaign, getInventory, updateCampaign, type Campaign, type InventoryItem, getFirestoreInstance} from "@/lib/firestore";
import {useFirebaseAuth} from "@/lib/auth";
import LoadingAnimation from "@/components/ui/loading-animation";
import {getStorageInstance} from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const formSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters."),
  inventoryId: z.string().min(1, "Please select a reward item."),
  status: z.enum(["Scheduled", "Active", "Finished"]),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Start date is required.",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "End date is required.",
  }),
  flyerImage: z.any().optional(),
});

export default function EditCampaignPage({params}: { params: { id: string }}) {
  const router = useRouter();
  const {toast} = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentFlyerImage, setCurrentFlyerImage] = useState<string | null>(null);
  const {id} = params;
  const {user, loading: authLoading} = useFirebaseAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      inventoryId: "",
      status: "Scheduled",
      startDate: "",
      endDate: "",
    },
  });

  const fetchAndSetData = useCallback(async () => {
    if (authLoading || !user) return;
    if (typeof window === "undefined") return;
    try {
      const [items, fetchedCampaign] = await Promise.all([
        getInventory(),
        getCampaign(id),
      ]);
      setInventoryItems(items);

      if (fetchedCampaign) {
        setCampaign(fetchedCampaign);
        form.reset({
          ...fetchedCampaign,
          inventoryId: fetchedCampaign.inventoryId || "",
          flyerImage: undefined,
        });
        setCurrentFlyerImage(fetchedCampaign.flyerImage || null);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({title: "Error", description: "Failed to load campaign data.", variant: "destructive"});
    }
  }, [id, form, toast, user, authLoading]);

  useEffect(() => {
    fetchAndSetData();
  }, [fetchAndSetData]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    const selectedInventoryItem = inventoryItems.find((item) => item.id === values.inventoryId);
    if (!selectedInventoryItem) {
      toast({title: "Error!", description: "Invalid inventory item selected.", variant: "destructive"});
      setIsSubmitting(false);
      return;
    }

    let updatedFlyerImageUrl = currentFlyerImage;
    const newFlyerImageFile = values.flyerImage?.[0];

    if (newFlyerImageFile) {
      const storage = getStorageInstance();
      if (!storage) {
        toast({ title: "Error!", description: "Storage not initialized.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      const storageRef = ref(storage, `campaign_flyers/${id}-${newFlyerImageFile.name}`);
      try {
        const snapshot = await uploadBytes(storageRef, newFlyerImageFile);
        updatedFlyerImageUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Error uploading flyer image:", error);
        toast({ title: "Error!", description: "Could not upload flyer image.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
    }

    const updatedCampaignData: Partial<Campaign> = {
      ...values,
      rewardType: "Inventory Item",
      rewardValue: selectedInventoryItem.name,
      flyerImage: updatedFlyerImageUrl, // Use the uploaded URL or existing one
    };

    try {
      await updateCampaign(id, updatedCampaignData);
      toast({
        title: "Campaign Updated!",
        description: `The campaign "${updatedCampaignData.name}" has been successfully updated.`,
      });
      router.push("/campaigns");
    } catch (error) {
      console.error("Failed to update campaign:", error);
      toast({title: "Error!", description: "Could not update the campaign.", variant: "destructive"});
    } finally {
      setIsSubmitting(false);
    }
  };


  if (authLoading || !campaign) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/campaigns"><ArrowLeft /></Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-4xl font-headline font-bold">Edit Campaign</h1>
          <p className="text-muted-foreground mt-2">
            Modify the details of your promotional campaign below.
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Black Friday Sale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inventoryId"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Reward Item</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                      <SelectTrigger>
                       <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {inventoryItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>The reward to be given out for this campaign.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="flyerImage"
                render={({field: {onChange, value, ...rest}}) => (
                  <FormItem>
                    <FormLabel>Flyer Background Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.readAsDataURL(file);
                            reader.onload = () => {
                              setCurrentFlyerImage(reader.result as string);
                            };
                          }
                          onChange(e.target.files);
                        }}
                        {...rest}
                      />
                    </FormControl>
                    <FormDescription>Upload a 4x6 inch (1200x1800 px) image. Leave blank to keep the existing image.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {currentFlyerImage && (
                <div>
                  <FormLabel>Current Flyer Image</FormLabel>
                  <div className="mt-2 rounded-md border p-2 inline-block">
                    <img src={currentFlyerImage} alt="Current flyer" width={120} height={180} className="rounded-md object-cover" />
                  </div>
                </div>
              )}


              <FormField
                control={form.control}
                name="status"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Finished">Finished</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({field}) => (
                    <FormItem className="flex-1">
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({field}) => (
                    <FormItem className="flex-1">
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.push("/campaigns")}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
