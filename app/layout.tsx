import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ToasterWrapper } from "@/components/toaster-wrapper";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#C4A882",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "eximIA Workspace",
  description: "Portal centralizado para todos os sistemas eximIA",
  manifest: "/manifest.json",
  openGraph: {
    title: "eximIA Workspace",
    description: "Portal centralizado para todos os sistemas eximIA",
    type: "website",
    locale: "pt_BR",
  },
  icons: {
    icon: "/favicon.svg",
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen bg-bg text-primary antialiased font-body">
        <ThemeProvider>
          {children}
          <ToasterWrapper />
        </ThemeProvider>
      </body>
    </html>
  );
}
