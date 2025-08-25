import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ResolutionProvider } from "@/contexts/ResolutionContext";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { DisplayPreferencesProvider } from "@/contexts/DisplayPreferencesContext";
import { initializePerformanceOptimization } from "@/lib/performance";
import { enhancedCachingService } from "@/lib/enhanced-caching-service";
import { realTimeMetricsCollector } from "@/lib/real-time-metrics";

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
  // Initialize enhanced caching service
  if (typeof window === 'undefined') {
    enhancedCachingService.initialize().catch(console.error);
    // Initialize real-time metrics collector
    realTimeMetricsCollector.initialize().catch(console.error);
    // Initialize performance optimization (caching-enabled version)
    initializePerformanceOptimization().catch(console.error);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <ResolutionProvider>
              <DisplayPreferencesProvider>
                {children}
              </DisplayPreferencesProvider>
            </ResolutionProvider>
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
