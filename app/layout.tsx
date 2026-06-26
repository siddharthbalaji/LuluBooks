import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "LuluBooks",
  description: "An interactive home for the LuluBooks library.",
  icons: {
    icon: "/favicon.svg"
  },
  openGraph: {
    title: "LuluBooks",
    description: "An interactive home for the LuluBooks library.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#0A1628",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
