import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authClient, GROK_PROVIDERS, signIn } from "@/lib/auth/client";

const BEARER_KEY = "grok-auth.bearer-token";

function keepToken(token: string | null | undefined) {
  if (!token || typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BEARER_KEY, token);
  } catch {
    /* ignore */
  }
}

export function SignInPanel() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function finish(token?: string | null) {
    keepToken(token);
    await authClient.getSession();
    if (window.location.pathname !== "/") void navigate({ to: "/" });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (mode === "up" && name.trim().length < 2) {
      setError("Add the name your coach should see.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "up") {
        const { data, error: err } = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
        });
        if (err) throw new Error(err.message || "Could not create the account.");
        await finish(data?.token);
      } else {
        const { data, error: err } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (err) throw new Error(err.message || "Could not sign in.");
        await finish(data?.token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <p className="eyebrow">For the box</p>
      <h1 className="display mt-2 text-6xl">CrossFit Log</h1>
      <p className="mt-4 text-muted">
        Each athlete signs in on their own phone. Workouts save to their account, so clearing the browser or switching phones does not wipe the log.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        {mode === "up" ? (
          <input className="field" placeholder="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        ) : null}
        <input className="field" type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="field" type="password" placeholder="Password" autoComplete={mode === "up" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error ? <p className="text-sm text-muted">{error}</p> : null}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "One moment…" : mode === "up" ? "Create account" : "Sign in"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => { setMode(mode === "up" ? "in" : "up"); setError(""); }}>
          {mode === "up" ? "I already have an account" : "New here? Create an account"}
        </button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="space-y-2">
        {GROK_PROVIDERS.map((p) => (
          <button key={p.providerId} className="btn btn-ghost" type="button" onClick={() => void signIn(p.providerId, { callbackURL: "/" })}>
            Continue with {p.label}
          </button>
        ))}
      </div>
    </main>
  );
}
