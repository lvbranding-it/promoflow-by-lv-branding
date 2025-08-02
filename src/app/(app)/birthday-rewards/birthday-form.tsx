
"use client";

import {useState, useEffect} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Gift, Bot} from "lucide-react";
import {useToast} from "@/hooks/use-toast";
import {getCustomers, getInventory, type Customer, type InventoryItem} from "@/lib/firestore";

const formSchema = z.object({
  customerId: z.string().min(1, "Please select a customer."),
  customerPreferences: z.string().min(5, "Preferences are required."),
});

export default function BirthdayForm() {
  const [rewardResult, setRewardResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const {toast} = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoadingData(true);
      try {
        const [customerData, inventoryData] = await Promise.all([getCustomers(), getInventory()]);
        setCustomers(customerData);
        setInventory(inventoryData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({title: "Error", description: "Failed to load customers and inventory.", variant: "destructive"});
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, [toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      customerPreferences: "Loves coffee, purchased mugs and beans in the past.",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setRewardResult(null);

    const selectedCustomer = customers.find((c) => c.id === values.customerId);
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Selected customer not found.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (inventory.length === 0) {
      toast({
        title: "Error",
        description: "No inventory items available to select a reward from.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const availableRewards = inventory.map((item) => ({
        rewardId: item.id,
        rewardDescription: item.name,
        quantityAvailable: item.stock === "Unlimited" ? 9999 : item.stock,
      }));

      const response = await fetch("/api/genkit/birthdayRewardFlow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            customerId: selectedCustomer.id,
            customerData: {
              name: selectedCustomer.name,
              birthdate: selectedCustomer.birthdate,
              preferences: values.customerPreferences,
            },
            availableRewards: availableRewards,
            campaignHistory: "Vouchers have low redemption, physical items perform better.",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate reward.");
      }

      const result = await response.json();
      setRewardResult(result);
    } catch (error) {
      console.error("Automation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate reward. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Birthday Automation Input</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <p>Loading customer data...</p>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} ({customer.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerPreferences"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Customer Preferences (AI Prompt)</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Describe customer preferences..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading || isLoadingData} className="w-full">
                  {isLoading ? "Generating Reward..." : "Generate Birthday Reward"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card className="sticky top-8">
        <CardHeader>
          <CardTitle>AI Selected Reward</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading && <p>Selecting best reward...</p>}
          {!isLoading && !rewardResult && (
            <div className="text-center text-muted-foreground py-12">
              <Gift className="mx-auto h-12 w-12 mb-4" />
              <p>The AI's reward choice will appear here.</p>
            </div>
          )}
          {rewardResult && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-accent/20 p-4 rounded-lg text-center">
                <p className="text-sm text-accent-foreground/80">Selected Reward</p>
                <p className="text-2xl font-bold font-headline text-primary">{rewardResult.rewardDescription}</p>
                <p className="text-xs text-muted-foreground">ID: {rewardResult.rewardId}</p>
              </div>

              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2"><Bot className="text-accent" /> AI Reasoning</h3>
                <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">{rewardResult.reasoning}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
