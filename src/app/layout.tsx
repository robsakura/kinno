import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import UsernameModal from "@/components/UsernameModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kinno — Show your movie knowledge",
  description: "Show your movie knowledge and climb the leaderboards!",
  icons: {
    icon: "/kinno_icon.png",
    apple: "/kinno_icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-cinema-bg text-slate-100 antialiased`}>
        <Providers>
          <Navbar />
          <UsernameModal />
          <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
