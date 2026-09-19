import { createFileRoute, Link } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";

export const Route = createFileRoute("/ayuda")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ayuda y guías | Domino" },
      {
        name: "description",
        content: "Cómo jugar dominó cubano: reglas del doble 6 y doble 9, guía de la app, niveles y preguntas frecuentes.",
      },
    ],
  }),
  component: Ayuda,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="glass-panel group rounded-2xl p-4 [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer list-none font-display text-lg font-bold">
        <span className="mr-2 inline-block transition-transform group-open:rotate-90">▸</span>
        {title}
      </summary>
      <div className="mt-3 space-y-2 text-sm text-muted-foreground">{children}</div>
    </details>
  );
}

function Ayuda() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <AppNav />
      <h1 className="font-display text-3xl font-extrabold">Ayuda</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Reglas, guías e información del juego.
      </p>

      <div className="mt-4 space-y-3">
        <Section title="🎲 Cómo jugar dominó cubano">
          <p>
            Se juega <strong className="text-foreground">en pareja (2 vs 2)</strong> con
            doble 6 o doble 9. Cada jugador recibe fichas y el que trae el doble más alto
            (o el mayor en mano a mano) <strong className="text-foreground">sale</strong>.
          </p>
          <p>
            En tu turno, arrastra una ficha a cualquiera de las dos puntas del tablero si
            uno de sus números coincide. Si no puedes jugar, <em>pasas el turno</em>.
          </p>
          <p>
            <strong className="text-foreground">Capicúa</strong>: ganar la mano colocando
            tu última ficha por ambos lados. <strong className="text-foreground">Tranca</strong>:
            nadie puede jugar y gana quien menos puntos tenga en la mano.
          </p>
          <p>
            La partida va a <strong className="text-foreground">100 puntos</strong>: los
            puntos de las fichas que les quedaron en la mano a los perdedores suman a la
            pareja ganadora (el de la pareja que tranca suma también el de su compañero).
          </p>
        </Section>

        <Section title="🕹️ Guía rápida de la app">
          <p>
            <strong className="text-foreground">Jugar</strong>: elige doble 6 o doble 9,
            en pareja o mano a mano. Toca una ficha para colocarla, o arrástrala a la punta
            del tablero que quieras (se ilumina en dorado).
          </p>
          <p>
            Usa el <strong className="text-foreground">chat rápido</strong> con emojis para
            comunicarte sin escribir. Tu nivel, rango y recompensas se ven en Ajustes.
          </p>
        </Section>

        <Section title="⭐ Niveles, rangos y recompensas">
          <p>
            Ganas XP al terminar cada partida (más si ganas y con margen). Al subir de
            nivel desbloqueas temas de mesa, diseños de fichas, banderas, marcos y títulos.
          </p>
          <p>
            El <strong className="text-foreground">ranking</strong> usa puntos estilo Elo:
            vencer a rivales de rango alto sube más. Consulta{" "}
            <Link to="/ranking" className="text-gold underline">
              el ranking
            </Link>
            .
          </p>
        </Section>

        <Section title="🆓 Cuenta gratuita y planes">
          <p>
            Gratis juegas <strong className="text-foreground">30 minutos cada 48 horas</strong>{" "}
            (lo cuenta el servidor, no tu teléfono). Puedes subir de nivel siempre, pero las
            recompensas y los torneos requieren un plan.
          </p>
          <p>
            Si el tiempo se acaba en medio de una partida, puedes terminarla, pero no
            empezar otra hasta tener plan o que te llegue el próximo tiempo gratis.
          </p>
          <p>
            <Link to="/planes" className="text-gold underline">
              Ver planes y precios →
            </Link>
          </p>
        </Section>

        <Section title="🏆 Torneos">
          <p>
            Llave de 32 jugadores en grupos de 4: avanza el ganador de cada mesa (o pareja
            ganadora) hasta la final. Solo para cuentas con plan.
          </p>
          <p>
            <Link to="/torneos" className="text-gold underline">
              Ver torneos →
            </Link>
          </p>
        </Section>

        <Section title="❓ Preguntas frecuentes">
          <p>
            <strong className="text-foreground">¿Puedo cambiar mi bandera?</strong> Sí: la de
            tu país siempre está libre desde el nivel 1; las demás se desbloquean con nivel + plan.
          </p>
          <p>
            <strong className="text-foreground">¿Se acumula mi tiempo gratis?</strong> No:
            cada 48 horas vuelves a tener 30 minutos frescos.
          </p>
          <p>
            <strong className="text-foreground">¿Cuándo se activa mi compra?</strong> El
            administrador la aprueba manualmente (normalmente en minutos). Verás el estado
            en <Link to="/planes" className="text-gold underline">Planes</Link>.
          </p>
        </Section>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        ¿Otra duda? Escríbele al administrador desde el chat del grupo oficial.
      </p>
    </main>
  );
}
