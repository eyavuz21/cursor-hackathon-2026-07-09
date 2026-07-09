import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wander — Interest Travel Guide",
  description:
    "Discover nearby places tailored to how far you like to walk and what you're interested in.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
