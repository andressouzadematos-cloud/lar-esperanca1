import "./globals.css";

export const metadata = {
  title: "Lar Esperança — Neste Natal, 112 crianças contam com você",
  description:
    "Ajude a garantir comida na mesa e um brinquedo novo para 112 crianças do Lar Esperança neste Natal.",
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