import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ApolloClientProvider } from "@/components/providers/ApolloProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IWMS — Inventory & Warehouse Management",
  description: "Enterprise Inventory & Warehouse Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <AuthProvider>
          <ApolloClientProvider>
            {children}
          </ApolloClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
