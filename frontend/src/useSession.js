import { useEffect, useMemo, useState } from "react";
import { auth } from "./api";
import { getCapabilities } from "./access.js";

export function useSession(initialLoginForm) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [loginForm, setLoginForm] = useState(initialLoginForm);

  const capabilities = useMemo(() => {
    return getCapabilities(user);
  }, [user]);

  useEffect(() => {
    async function loadSession() {
      if (!auth.getToken()) {
        setAuthLoading(false);
        return;
      }

      try {
        const me = await auth.me();
        setUser(me);
      } catch (_error) {
        auth.logout();
      } finally {
        setAuthLoading(false);
      }
    }

    loadSession();
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setAuthError("");

    try {
      const data = await auth.login(loginForm.email, loginForm.password);
      setUser(data.user);
    } catch (err) {
      setAuthError(err.message);
    }
  }

  function logoutSession() {
    auth.logout();
    setUser(null);
    setAuthError("");
  }

  return {
    authError,
    authLoading,
    capabilities,
    handleLogin,
    loginForm,
    logoutSession,
    setLoginForm,
    user
  };
}
