import "./globals.css";

export const metadata = {
  title: "Stay Alive ILU Bitch",
  description: "MVP — acompañante personal de gestión de diabetes",
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
