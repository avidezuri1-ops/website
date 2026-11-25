import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AVIDEZURI | The Art of Fragrance",
  description: "Discover the world of Avidezuri fragrances.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
