import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"

import UIThemeProvider from "@/providers/ui-theme-provider"

const inter = Inter({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title:
    "Emprende Chambala",

  description:
    "COOPERATIVA DE AHORRO Y CREDITO MULTIPLE CHAMBALA LTDA. - Emprende Chambala",

  keywords: [
    "Next.js Admin Dashboard",
    "Tailwind CSS Admin Template",
    "ShadCN UI Dashboard",
    "React Admin Template",
    "SaaS Dashboard",
    "Next.js Template",
    "Tailwind Admin",
    "Dashboard UI Kit",
  ],

  authors: [
    {
      name: "Codervent",
    },
  ],

  creator: "Codervent",

  openGraph: {
    title:
      "Syndron UI – Next.js & Tailwind CSS ShadCN Admin Dashboard Template",

    description:
      "Modern admin dashboard template built with Next.js, Tailwind CSS, React, and ShadCN UI.",

    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Syndron UI – Next.js & Tailwind CSS ShadCN Admin Dashboard Template",

    description:
      "Modern admin dashboard template built with Next.js, Tailwind CSS, React, and ShadCN UI.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UIThemeProvider>
            {children}
          </UIThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}