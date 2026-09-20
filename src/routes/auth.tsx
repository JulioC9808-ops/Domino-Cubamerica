import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AppNav } from "@/components/AppNav";
import { FLAGS } from "@/lib/domino/themes";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar o crear cuenta | Domino" },
      {
        name: "description",
        content:
          "Inicia sesión en Domino para guardar tu nivel, ranking, amigos y personalización.",
      },
      { property: "og:title", content: "Entrar en Domino" },
      { property: "og:description", content: "Accede para jugar dominó cubano online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [flag, setFlag] = useState("cu");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { username: username || email.split("@")[0], flag },
        },
      });
      setMsg(error ? error.message : "Revisa tu correo para confirmar la cuenta.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else navigate({ to: "/" });
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <AppNav />
      <h1 className="font-display text-3xl font-extrabold">
        {mode === "in" ? "Entrar" : "Crear cuenta"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tu cuenta guarda nivel, ranking, amigos y personalización.
      </p>

      <button
        onClick={() =>
          lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })
        }
        className="mt-5 w-full rounded-full border border-border bg-card py-2.5 text-sm font-semibold"
      >
        Continuar con Google
      </button>

      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> o con correo{" "}
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="grid gap-3">
        {mode === "up" ? (
          <>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nombre de jugador"
              className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
            />
            <select
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
              aria-label="Bandera"
            >
              {FLAGS.map((f) => (
                <option key={f.code} value={f.code}>
                  {f.emoji} {f.label}
                </option>
              ))}
            </select>
          </>
        ) : null}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo"
          className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
        />
        <button
          disabled={busy}
          className="rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {mode === "in" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>

      {msg ? <p className="mt-3 text-sm text-muted-foreground">{msg}</p> : null}

      <button
        onClick={() => setMode((m) => (m === "in" ? "up" : "in"))}
        className="mt-4 text-sm text-gold underline"
      >
        {mode === "in" ? "No tengo cuenta" : "Ya tengo cuenta"}
      </button>
    </main>
  );
}
