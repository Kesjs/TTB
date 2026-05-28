import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Top Talent du Bénin - La Scène des Révélations",
  description: "Plateforme officielle de détection de talents du Bénin. Candidatez, votez et suivez vos artistes préférés en direct.",
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className="h-full"
    >
      <body className="min-h-full bg-background text-foreground font-sans antialiased">
        <NextTopLoader color="#e5c47f" />
        {children}
      </body>
    </html>
  );
}
