import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { RootProviders } from "./root-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gjykata Artificiale",
  description: "Asistent IA per ligjet e Shqiperise dhe EU-se",
  icons: {
    icon: [
      { url: '/albania_favicon.png', type: 'image/png' },
    ],
    shortcut: '/albania_favicon.png',
    apple: '/albania_favicon.png',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // For iOS notch support
};

// Root layout is a Server Component that wraps minimal providers
// Auth pages (login) need AuthProvider, so we provide it at root level
// Dashboard-specific providers (TenantProvider) are in the dashboard layout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
