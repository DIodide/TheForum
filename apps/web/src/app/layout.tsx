import type { Metadata } from "next";
import { Inter, Unbounded } from "next/font/google";
import { Toaster } from "~/components/ui/sonner";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-unbounded",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "The Forum",
  description: "A community platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${unbounded.variable} ${inter.variable}`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
