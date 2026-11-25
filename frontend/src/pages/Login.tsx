import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, UserRound } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [register, setRegister] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    if (loading) return;

    if (form.password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (register && !form.name.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = register ? "register" : "login";

      const requestBody = register
        ? {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password
          }
        : {
            email: form.email.trim(),
            password: form.password
          };

      const response = await fetch(
        `http://localhost:5000/api/auth/${endpoint}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Authentication failed."
        );
      }

      if (!data.token || !data.user) {
        throw new Error("Invalid authentication response.");
      }

      // Store JWT token
      sessionStorage.setItem(
        "shopSquareToken",
        data.token
      );

      // Store user information
      sessionStorage.setItem(
        "shopSquareUser",
        JSON.stringify(data.user)
      );

      // Redirect to shopping cart
      navigate("/cart", { replace: true });

    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">

      <div className="auth-card">

        <Link to="/" className="auth-logo">
          shopSquare.
        </Link>

        <h1>
          {register ? "Create Account" : "Welcome Back"}
        </h1>

        <p className="muted">
          {register
            ? "Join shopSquare and discover your style."
            : "Sign in to your shopSquare account."}
        </p>

        <form onSubmit={handleSubmit}>

          {register && (
            <label className="input-group">

              <UserRound size={19} />

              <input
                type="text"
                placeholder="Full name"
                aria-label="Full name"
                autoComplete="name"
                required
                disabled={loading}
                value={form.name}
                onChange={e =>
                  setForm({
                    ...form,
                    name: e.target.value
                  })
                }
              />

            </label>
          )}

          <label className="input-group">

            <Mail size={19} />

            <input
              type="email"
              placeholder="Email address"
              aria-label="Email address"
              autoComplete="email"
              required
              disabled={loading}
              value={form.email}
              onChange={e =>
                setForm({
                  ...form,
                  email: e.target.value
                })
              }
            />

          </label>

          <label className="input-group">

            <LockKeyhole size={19} />

            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              autoComplete={
                register
                  ? "new-password"
                  : "current-password"
              }
              required
              minLength={8}
              maxLength={128}
              disabled={loading}
              value={form.password}
              onChange={e =>
                setForm({
                  ...form,
                  password: e.target.value
                })
              }
            />

          </label>

          <button
            className="btn btn-dark full-width"
            type="submit"
            disabled={loading}
            style={{
              opacity: loading ? 0.6 : 1,
              cursor: loading
                ? "not-allowed"
                : "pointer"
            }}
          >
            {loading
              ? "PLEASE WAIT..."
              : register
                ? "CREATE ACCOUNT"
                : "SIGN IN"}
          </button>

          {message && (
            <p
              className="form-message"
              role="alert"
              style={{
                color: "#b91c1c",
                marginTop: "15px"
              }}
            >
              {message}
            </p>
          )}

        </form>

        <p className="auth-switch">

          {register
            ? "Already have an account?"
            : "New to shopSquare?"}

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setRegister(!register);
              setMessage("");
              setForm({
                name: "",
                email: "",
                password: ""
              });
            }}
          >
            {register ? "Sign in" : "Create account"}
          </button>

        </p>

      </div>

    </div>
  );
}