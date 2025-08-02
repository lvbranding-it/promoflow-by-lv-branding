
"use client";

import {useState, useRef} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Checkbox} from "@/components/ui/checkbox";
import Image from "next/image";
import {Download} from "lucide-react";
import Link from "next/link";
import {Logo} from "@/components/logo";
import Confetti from "react-confetti";
import {useWindowSize} from "react-use";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {type Customer, findCustomerByEmail, addCustomer} from "@/lib/firestore";

const formSchema = z.object({
  name: z.string().min(2, {message: "Name must be at least 2 characters."}),
  email: z.string().email({message: "Please enter a valid email."}),
  phone: z.string().min(10, {message: "Please enter a valid phone number."}),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms.",
  }),
});

export default function LandingPage() {
  const [submittedCustomer, setSubmittedCustomer] = useState<Customer | null>(null);
  const {width, height} = useWindowSize();
  const rewardCardContentRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      birthdate: "",
      consent: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let customer = await findCustomerByEmail(values.email);

    if (!customer) {
      const newCustomerData = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        birthdate: values.birthdate,
        redemptions: {},
      };
      const newId = await addCustomer(newCustomerData);
      customer = {id: newId, ...newCustomerData};
    }

    setSubmittedCustomer(customer);
  }

  const handleDownload = async () => {
    const canvasContainer = rewardCardContentRef.current;
    if (!canvasContainer) return;

    // Temporarily set a higher resolution for capture
    const originalWidth = canvasContainer.style.width;
    const originalHeight = canvasContainer.style.height;
    canvasContainer.style.width = "1000px";
    canvasContainer.style.height = "auto";

    const canvas = await html2canvas(canvasContainer, {
      useCORS: true,
      backgroundColor: "#ffffff", // Set a background color
      scale: 2, // Increase scale for better quality
    });

    // Restore original size
    canvasContainer.style.width = originalWidth;
    canvasContainer.style.height = originalHeight;

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`Orbig-Promos-Reward-${submittedCustomer?.name.replace(/\s+/g, "_")}.pdf`);
  };


  const isSubmitted = !!submittedCustomer;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${submittedCustomer?.id}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {isSubmitted && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} style={{zIndex: 100}} />}
      <Link href="/dashboard" className="absolute top-4 right-4 text-sm text-muted-foreground hover:text-primary z-20">Admin Dashboard</Link>
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20" style={{backgroundColor: "hsl(var(--background))"}}></div>

      <Card className="w-full max-w-md shadow-2xl z-10 animate-in fade-in-50 zoom-in-90 duration-500">
        {!isSubmitted ? (
          <>
            <CardHeader className="text-center">
              <Logo className="mx-auto h-12 w-12 text-primary" />
              <CardTitle className="font-headline text-3xl mt-2">Claim Your Reward!</CardTitle>
              <CardDescription>Enter your details below to receive an exclusive offer.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="(555) 555-5555" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthdate"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Birthdate</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="consent"
                    render={({field}) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>I agree to the terms and conditions and to receive marketing emails.</FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Submitting..." : "Claim My Reward"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </>
        ) : (
          <div className="animate-in fade-in-50 duration-500">
            <div className='p-6'>
              <div ref={rewardCardContentRef} className="bg-card p-6">
                <CardHeader className="text-center p-0">
                  <Logo className="mx-auto h-10 w-10 mb-4 text-primary" />
                  <CardTitle className="font-headline text-3xl mt-2">Success!</CardTitle>
                  <CardDescription>Your unique reward for {submittedCustomer.name} is ready. Present this QR code in-store.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4 pt-6">
                  <div className="p-4 bg-white rounded-lg border">
                    <Image
                      src={qrCodeUrl}
                      alt="Your unique QR code"
                      width={200}
                      height={200}
                      data-ai-hint="qr code"
                      unoptimized
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">20% Off Your Next Purchase</p>
                    <p className="text-sm text-muted-foreground">Expires in 30 days</p>
                  </div>
                </CardContent>
              </div>
            </div>
            <CardFooter className="flex flex-col gap-2 p-6 pt-0">
              <Button className="w-full" onClick={handleDownload}>
                <Download className="mr-2" />
                    Download Reward
              </Button>
              <Button variant="outline" className="w-full" onClick={() => {
                form.reset(); setSubmittedCustomer(null);
              }}>Claim Another</Button>
            </CardFooter>
          </div>
        )}
      </Card>
    </div>
  );
}
