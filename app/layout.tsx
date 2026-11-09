import "./globals.css";

export const metadata = {
  title: "Lar Esperança — Neste Natal, 112 crianças contam com você",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}