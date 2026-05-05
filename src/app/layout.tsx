import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0d0c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const unregisterServiceWorkers = `
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((rs) => {
      rs.forEach((r) => r.unregister());
    });
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} ${lora.variable} antialiased`}>
      <body className="bg-bg text-fg">
        {children}
        <script dangerouslySetInnerHTML={{ __html: unregisterServiceWorkers }} />
      </body>
    </html>
  );
}
