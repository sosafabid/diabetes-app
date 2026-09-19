import "./globals.css";

export const metadata = {
  title: "Stay Alive ILU",
  description: "Tu diabetes, tu historia — registra, entiende, avanza.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
