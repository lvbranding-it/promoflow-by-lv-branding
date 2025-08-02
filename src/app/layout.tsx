
import type {Metadata} from "next";
import "./globals.css";
import {Toaster} from "@/components/ui/toaster";
import {FirebaseAuthProvider} from "@/lib/auth";

export const metadata: Metadata = {
  title: "Orbig Promos",
  description: "AI-Powered Promotion Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseAuthProvider>
          {children}
        </FirebaseAuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
