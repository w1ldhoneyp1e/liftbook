import type { Metadata, Viewport } from "next"
import "./globals.css"
import { PwaRegistrar } from "./pwa-registrar"
import { ThemeController } from "./theme-controller"

export const metadata: Metadata = {
  applicationName: "Liftbook",
  title: "Liftbook",
  description: "Mobile-first offline workout journal",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Liftbook",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
    shortcut: "/favicon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#ecfdf5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ThemeController />
        {children}
        <PwaRegistrar />
      </body>
    </html>
  )
}
