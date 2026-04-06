import React from "react";

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("Smart Compliance runtime error:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="center-screen">
          <div className="login-card">
            <p className="eyebrow">Smart Compliance</p>
            <h1>Não foi possível carregar a aplicação</h1>
            <p className="muted hero-copy">
              Detectamos um erro de execução no frontend. Atualize a página e, se persistir,
              revise o deploy e o console do navegador.
            </p>
            <div className="error-banner">{this.state.error.message || "Erro inesperado."}</div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
