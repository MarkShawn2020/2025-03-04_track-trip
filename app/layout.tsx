import { ThemeSwitcher } from "@/components/theme-switcher";
import { Inter, Montserrat } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";
import Script from "next/script";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "TravelTrack Pro | Visualize Your Journey",
  description: "Transform your travel memories into beautiful interactive maps. Share, plan, and relive your journeys with TravelTrack Pro.",
  keywords: "travel tracking, journey visualization, travel map, trip planner, interactive travel map",
  authors: [{ name: "CS Magic" }],
  openGraph: {
    title: "TravelTrack Pro | Visualize Your Journey",
    description: "Transform your travel memories into beautiful interactive maps",
    url: defaultUrl,
    siteName: "TravelTrack Pro",
    images: [{
      url: "/opengraph-image.png",
      width: 1200,
      height: 630,
    }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TravelTrack Pro | Visualize Your Journey",
    description: "Transform your travel memories into beautiful interactive maps",
    images: ["/twitter-image.png"],
  },
};

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-background text-foreground font-inter" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-1.5">
                    <span className="text-xl text-white">🗺️</span>
                  </div>
                  <span className="font-montserrat font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    TravelTrack Pro
                  </span>
                </Link>
                <nav className="flex items-center space-x-6">
                  <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
                    Home
                  </Link>
                  <Link href="#features" className="text-sm font-medium transition-colors hover:text-primary">
                    Features
                  </Link>
                  <Link href="#how-it-works" className="text-sm font-medium transition-colors hover:text-primary">
                    How It Works
                  </Link>
                  <ThemeSwitcher />
                </nav>
              </div>
            </header>

            <main className="flex-1">
              {children}
            </main>

            <footer className="border-t border-border/40 bg-muted/40">
              <div className="container py-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-1">
                        <span className="text-sm text-white">🗺️</span>
                      </div>
                      <span className="font-montserrat font-bold text-base">TravelTrack Pro</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Transform your travel memories into beautiful interactive maps.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-3">Product</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><Link href="#" className="hover:underline">Features</Link></li>
                      <li><Link href="#" className="hover:underline">Pricing</Link></li>
                      <li><Link href="#" className="hover:underline">FAQ</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-3">Resources</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><Link href="#" className="hover:underline">Documentation</Link></li>
                      <li><Link href="#" className="hover:underline">Blog</Link></li>
                      <li><Link href="#" className="hover:underline">Support</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-3">Company</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><Link href="#" className="hover:underline">About</Link></li>
                      <li><Link href="#" className="hover:underline">Privacy</Link></li>
                      <li><Link href="#" className="hover:underline">Terms</Link></li>
                    </ul>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-border/40 flex flex-col md:flex-row justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} TravelTrack Pro. All rights reserved.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 md:mt-0">
                    Made with 💖 by{" "}
                    <a
                      href="https://github.com/markshawn2020"
                      target="_blank"
                      className="font-medium hover:underline"
                      rel="noreferrer"
                    >
                      CS Magic
                    </a>
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
        
        {/* Analytics script placeholder */}
        <Script
          id="analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Analytics code would go here in a production environment
              console.log('Analytics loaded');
            `,
          }}
        />
      </body>
    </html>
  );
}
