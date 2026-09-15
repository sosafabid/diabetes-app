export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "3rem", maxWidth: 640 }}>
      <h1>Acompañante de gestión de diabetes</h1>
      <p>
        MVP en construcción. Este esqueleto confirma que el deploy y la
        conexión a la base de datos funcionan correctamente.
      </p>
      <p>
        Verifica la conexión a la base de datos en{" "}
        <a href="/api/health">/api/health</a>.
      </p>
    </main>
  );
}
