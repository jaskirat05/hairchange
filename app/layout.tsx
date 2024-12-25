import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { HistoryProvider } from "@/components/providers/history-provider";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";

export const metadata: Metadata = {
  title: "Hair Change App",
  description: "Try different hairstyles virtually",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ClerkProvider>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <HistoryProvider>
              {children}
            </HistoryProvider>
          </ThemeProvider>
        </body>
      </ClerkProvider>
    </html>
  );
}
