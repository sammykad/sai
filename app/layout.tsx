import { Cormorant_Garamond, JetBrains_Mono, Outfit, Plus_Jakarta_Sans } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SmoothScroll } from "@/components/smooth-scroll"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";

const sans = Plus_Jakarta_Sans({subsets:['latin'],variable:'--font-sans'})

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
})

const display = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
})

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        sans.variable,
        serif.variable,
        display.variable,
        fontMono.variable,
        "font-sans"
      )}
    >
      <body>
        <ThemeProvider>
          <div className="grain-overlay" />
          <SmoothScroll />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
