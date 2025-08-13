import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ResolutionProvider } from "@/contexts/ResolutionContext";

export const metadata: Metadata = {
  title: "Crypto Analytics Dashboard Pro",
  description: "Advanced cryptocurrency market analytics and AI-powered trading insights platform",
  keywords: ["Crypto", "Analytics", "Trading", "AI", "Bitcoin", "Ethereum", "Dashboard"],
  authors: [{ name: "Crypto Analytics Team" }],
  openGraph: {
    title: "Crypto Analytics Dashboard Pro",
    description: "Advanced cryptocurrency market analytics and AI-powered trading insights",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto Analytics Dashboard Pro",
    description: "Advanced cryptocurrency market analytics and AI-powered trading insights",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ResolutionProvider>
          {children}
        </ResolutionProvider>
        <Toaster />
      </body>
    </html>
  );
}
