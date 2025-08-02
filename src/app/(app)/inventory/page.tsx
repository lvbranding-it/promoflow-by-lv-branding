
"use client";

import {useState, useEffect} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
import Image from "next/image";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useToast} from "@/hooks/use-toast";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {PlusCircle} from "lucide-react";
import {type InventoryItem, type Campaign, getInventory, getCampaigns, addInventoryItem, updateInventoryItem} from "@/lib/firestore";


const newItemSchema = z.object({
  name: z.string().min(3, "Item name must be at least 3 characters."),
  stock: z.string().min(1, "Stock is required (e.g., 100 or Unlimited)."),
  category: z.string().min(3, "Category is required."),
  image: z.string().url("Please enter a valid image URL.").or(z.literal("")),
  aiHint: z.string().min(2, "AI hint is required."),
});

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});
  const {toast} = useToast();

  const form = useForm<z.infer<typeof newItemSchema>>({
    resolver: zodResolver(newItemSchema),
    defaultValues: {
      name: "",
      stock: "",
      category: "",
      image: "",
      aiHint: "",
    },
  });

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [inventoryData, campaignsData] = await Promise.all([getInventory(), getCampaigns()]);
        setInventory(inventoryData);
        setCampaigns(campaignsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({title: "Error", description: "Could not fetch inventory and campaign data.", variant: "destructive"});
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const getRedemptionsForItem = (itemId: string) => {
    return campaigns
      .filter((c) => c.inventoryId === itemId)
      .reduce((acc, c) => acc + (c.redemptions || 0), 0);
  };

  const getStatus = (item: InventoryItem) => {
    if (item.stock === "Unlimited") return "Unlimited";
    const redemptions = getRedemptionsForItem(item.id);
    const remainingStock = item.stock - redemptions;
    if (remainingStock <= 0) return "Out of Stock";
    if (remainingStock < 10) return "Low Stock";
    return "In Stock";
  };

  const handleStockChange = (id: string, value: string) => {
    setEditingStock((prev) => ({...prev, [id]: value}));
  };

  const handleStockUpdate = async (id: string) => {
    const newStockValue = editingStock[id];
    if (newStockValue === undefined || newStockValue.trim() === "") return;

    let updatedStock: number | "Unlimited";
    if (newStockValue.toLowerCase() === "unlimited") {
      updatedStock = "Unlimited";
    } else {
      const parsedStock = parseInt(newStockValue, 10);
      if (isNaN(parsedStock) || parsedStock < 0) {
        toast({title: "Invalid Input", description: "Stock must be a non-negative number or \"unlimited\".", variant: "destructive"});
        return;
      }
      updatedStock = parsedStock;
    }

    try {
      await updateInventoryItem(id, {stock: updatedStock});
      setInventory((prev) => prev.map((item) =>
        item.id === id ? {...item, stock: updatedStock} : item
      ));
      setEditingStock((prev) => {
        const newState = {...prev};
        delete newState[id];
        return newState;
      });
      toast({title: "Success", description: "Stock level updated."});
    } catch (error) {
      console.error("Failed to update stock:", error);
      toast({title: "Error", description: "Failed to update stock level.", variant: "destructive"});
    }
  };

  async function onNewItemSubmit(values: z.infer<typeof newItemSchema>) {
    let stockValue: number | "Unlimited";
    if (values.stock.toLowerCase() === "unlimited") {
      stockValue = "Unlimited";
    } else {
      const parsed = parseInt(values.stock, 10);
      if (isNaN(parsed) || parsed < 0) {
        toast({title: "Invalid Stock", description: "Stock must be a non-negative number or \"unlimited\".", variant: "destructive"});
        return;
      }
      stockValue = parsed;
    }

    const newItemData = {
      name: values.name,
      stock: stockValue,
      category: values.category,
      image: values.image || "https://placehold.co/64x64.png",
      aiHint: values.aiHint,
    };

    try {
      const newId = await addInventoryItem(newItemData);
      const newItemWithId: InventoryItem = {id: newId, ...newItemData};
      setInventory((prev) => [...prev, newItemWithId]);
      toast({title: "Item Added", description: `${newItemWithId.name} has been added to the inventory.`});
      form.reset();
    } catch (error) {
      console.error("Failed to add item:", error);
      toast({title: "Error", description: "Failed to add new item.", variant: "destructive"});
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-headline font-bold">Inventory Control</h1>
        <p className="text-muted-foreground mt-2">
                Monitor and manage stock levels for all promotional items.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Item</CardTitle>
          <CardDescription>Add a new promotional item to your inventory.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onNewItemSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <FormField
                control={form.control}
                name="name"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Free T-Shirt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Initial Stock</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 100 or Unlimited" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Physical Good" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://placehold.co/64x64.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="aiHint"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>AI Hint</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., t-shirt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
                <PlusCircle className="mr-2"/>
                {form.formState.isSubmitting ? "Adding..." : "Add Item"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="rounded-lg border">
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Total Stock</TableHead>
                <TableHead>Redeemed</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">Loading inventory...</TableCell>
                </TableRow>
              ) : inventory.map((item) => {
                const redemptions = getRedemptionsForItem(item.id);
                const status = getStatus(item);
                const availableStock = item.stock === "Unlimited" ? "∞" : item.stock - redemptions;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-4">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={40}
                          height={40}
                          data-ai-hint={item.aiHint}
                          className="rounded-md"
                        />
                        <span>{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={editingStock[item.id] ?? item.stock}
                          onChange={(e) => handleStockChange(item.id, e.target.value)}
                          className="w-28 h-9"
                        />
                        <Button size="sm" onClick={() => handleStockUpdate(item.id)} disabled={editingStock[item.id] === undefined}>Save</Button>
                      </div>
                    </TableCell>
                    <TableCell>{redemptions}</TableCell>
                    <TableCell>{availableStock}</TableCell>
                    <TableCell>
                      <Badge
                        variant={status === "In Stock" ? "default" : status.includes("Stock") ? "destructive" : "secondary"}
                        className={status === "In Stock" ? "bg-green-600 text-white" : ""}
                      >
                        {status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
