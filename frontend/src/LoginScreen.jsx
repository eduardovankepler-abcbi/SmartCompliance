export function LoginScreen({
  Input,
  ThemeGlyph,
  authError,
  demoAccounts,
  handleLogin,
  loginForm,
  setLoginForm,
  theme,
  toggleTheme
}) {
  return (
    <div className="login-shell">
      <div className="login-backdrop" />
      <button
        type="button"
        className="theme-icon-button login-theme-button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
        title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      >
        <ThemeGlyph theme={theme} />
      </button>
      <form className="login-card" onSubmit={handleLogin}>
        <p className="eyebrow">Smart Compliance</p>
        <h1>Governanca com presenca executiva</h1>
        <p className="muted hero-copy">
          Um painel unico para etica, reputacao interna, desenvolvimento e feedback continuo.
        </p>
        <Input
          label="Email"
          value={loginForm.email}
          onChange={(value) => setLoginForm({ ...loginForm, email: value })}
        />
        <Input
          label="Senha"
          type="password"
          value={loginForm.password}
          onChange={(value) => setLoginForm({ ...loginForm, password: value })}
        />
        {authError ? <div className="error-banner">{authError}</div> : null}
        <button className="primary-button" type="submit">
          Entrar no ambiente
        </button>
        <div className="stack-list login-accounts">
          <strong>Contas demo</strong>
          {demoAccounts.map((item) => (
            <p className="muted" key={item}>
              {item}
            </p>
          ))}
        </div>
      </form>
    </div>
  );
}
