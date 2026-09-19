export default function ConsentimientoPage() {
  return (
    <main className="auth-page">
      <div className="auth-form" style={{ maxWidth: 640, textAlign: "left" }}>
        <h1>Manejo de datos y consentimiento</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
          Última actualización: {new Date().toLocaleDateString("es-CR")}
        </p>

        <h2>Qué datos recopilamos</h2>
        <p>
          Esta app guarda la información que tú registras directamente:
          lecturas de glucosa, dosis de insulina, comidas y carbohidratos,
          actividad física, episodios de hipoglucemia, tu plan de
          tratamiento, y —si lo usas— tu estado de ánimo, horas de sueño y
          días de ciclo menstrual. También tu nombre y correo para poder
          identificarte.
        </p>

        <h2>Cómo se usa</h2>
        <p>
          Tus datos se usan únicamente para mostrarte tu propio historial,
          tus estadísticas y los patrones que esta app calcula directamente
          de tus registros. No se comparten con anunciantes ni se venden a
          terceros.
        </p>

        <h2>Dónde se guarda</h2>
        <p>
          Tu información se almacena en una base de datos alojada por
          nuestro proveedor de infraestructura (actualmente Neon/PostgreSQL,
          sobre Vercel), con acceso restringido. Tu contraseña nunca se
          guarda en texto plano — se guarda un hash irreversible.
        </p>

        <h2>Análisis con inteligencia artificial (función futura)</h2>
        <p>
          Estamos construyendo una función opcional para ayudarte a preparar
          preguntas para tu equipo médico usando IA, a partir de estadísticas
          ya calculadas (nunca tus datos crudos). Cuando esa función esté
          lista, te pediremos tu consentimiento explícito por separado antes
          de enviar cualquier dato a un proveedor externo de IA — esta
          aceptación general no cubre eso.
        </p>

        <h2>Esto no es un dispositivo médico</h2>
        <p>
          Esta app es una herramienta de registro personal. No diagnostica,
          no prescribe tratamiento, no calcula dosis de forma automática
          (los cálculos que puedas ver, cuando existan, siempre requerirán
          validación clínica), y no sustituye el criterio de tu equipo
          médico. Ante cualquier emergencia, contacta a servicios médicos de
          inmediato.
        </p>

        <h2>Tus derechos</h2>
        <p>
          Puedes exportar tu resumen a PDF desde la app cuando quieras. Puedes
          eliminar tu cuenta y todo tu historial de forma permanente,
          directamente desde Ajustes y privacidad dentro de la app — no
          hace falta contactar a nadie.
        </p>

        <p style={{ marginTop: "1.5rem" }}>
          <a href="/registro">← Volver al registro</a>
        </p>
      </div>
    </main>
  );
}
