
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
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ThumbsUp, Bot} from "lucide-react";
import {useToast} from "@/hooks/use-toast";
import {getCustomers, type Customer} from "@/lib/firestore";

const formSchema = z.object({
  customerId: z.string().min(1, "Please select a customer."),
  platform: z.string().min(1, "Please select a platform."),
});

interface RewardResult {
  reward: string;
  reasoning: string;
}

export default function SocialRewardForm() {
  const [rewardResult, setRewardResult] = useState<RewardResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const {toast} = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoadingData(true);
      try {
        const customerData = await getCustomers();
        setCustomers(customerData);
      } catch (error) {
        console.error("Failed to fetch customers:", error);
        toast({title: "Error", description: "Failed to load customers.", variant: "destructive"});
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
      platform: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setRewardResult(null);

    try {
      // We assume the API is hosted at the same origin
      const response = await fetch("/api/social-reward", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: values.customerId,
          platform: values.platform,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate reward.");
      }

      const result = await response.json();
      setRewardResult(result);
    } catch (error: any) {
      console.error("Reward generation failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate reward. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Social Reward Input</CardTitle>
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
                  name="platform"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Social Media Platform</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="twitter">Twitter / X</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading || isLoadingData} className="w-full">
                  {isLoading ? "Generating Reward..." : "Generate Social Reward"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card className="sticky top-8">
        <CardHeader>
          <CardTitle>AI Generated Reward</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading && <p>Thinking...</p>}
          {!isLoading && !rewardResult && (
            <div className="text-center text-muted-foreground py-12">
              <ThumbsUp className="mx-auto h-12 w-12 mb-4" />
              <p>The AI's reward will appear here.</p>
            </div>
          )}
          {rewardResult && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-accent/20 p-4 rounded-lg text-center">
                <p className="text-sm text-accent-foreground/80">Generated Reward</p>
                <p className="text-2xl font-bold font-headline text-primary">{rewardResult.reward}</p>
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
