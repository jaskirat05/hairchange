"use client"
import type { Metadata } from "next";
import { Header } from "@/components/ui/header";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import {
  ClerkProvider,
  UserButton
} from '@clerk/nextjs'
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) 
{
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  useEffect(() => {
    // Function to check screen size
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768); // Set desktop mode if width is >= 768px
    };

    // Initial check
    handleResize();

    // Listen for window resizing
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  return (
        
    <ClerkProvider>
    <html lang="en">
     
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      > 
      <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      
      <div className="h-[100vh]">
        {isDesktop?<h1 className="text-5xl">Please open this App in a mobile for the best Experience</h1>:
           
            children}
        </div>
        <Toaster/>
        </ThemeProvider>
      </body>
    </html>
    </ClerkProvider>
  );}

