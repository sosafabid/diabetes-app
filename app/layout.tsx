export const metadata = {
  title: "Acompañante de gestión de diabetes",
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
