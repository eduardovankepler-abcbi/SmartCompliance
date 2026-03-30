function ThemeGlyph({ theme }) {
  if (theme === "dark") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 3.5v2.2M12 18.3v2.2M5.9 5.9l1.6 1.6M16.5 16.5l1.6 1.6M3.5 12h2.2M18.3 12h2.2M5.9 18.1l1.6-1.6M16.5 7.5l1.6-1.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15.5 3.8a7.8 7.8 0 1 0 4.7 14.1A8.8 8.8 0 0 1 15.5 3.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SectionGlyph({ icon }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  if (icon === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="6" height="6" rx="1.5" {...common} />
        <rect x="14" y="4" width="6" height="6" rx="1.5" {...common} />
        <rect x="4" y="14" width="6" height="6" rx="1.5" {...common} />
        <rect x="14" y="14" width="6" height="6" rx="1.5" {...common} />
      </svg>
    );
  }

  if (icon === "shield") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l6.5 2.8v5.7c0 4.3-2.6 6.9-6.5 9.5-3.9-2.6-6.5-5.2-6.5-9.5V5.8L12 3Z" {...common} />
      </svg>
    );
  }

  if (icon === "clipboard") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 4.5h6M9.8 3h4.4a1.6 1.6 0 0 1 1.6 1.6V6H8.2V4.6A1.6 1.6 0 0 1 9.8 3Z" {...common} />
        <path d="M7 6h10a2 2 0 0 1 2 2v9.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 17.5V8a2 2 0 0 1 2-2Z" {...common} />
        <path d="m9 12 2 2 4-4" {...common} />
      </svg>
    );
  }

  if (icon === "growth") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 18h14" {...common} />
        <path d="M7 15.5 11 11l3 3 5-6" {...common} />
        <path d="M16.5 8H19v2.5" {...common} />
      </svg>
    );
  }

  if (icon === "spark") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 4 1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7L12 4Z" {...common} />
        <path d="M18.5 4.5v2M19.5 5.5h-2" {...common} />
        <path d="M5 17.5v2M6 18.5H4" {...common} />
      </svg>
    );
  }

  if (icon === "people") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" {...common} />
        <path d="M16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" {...common} />
        <path d="M4.5 18.5a4.5 4.5 0 0 1 9 0" {...common} />
        <path d="M14 18.5a3.8 3.8 0 0 1 5-3.5" {...common} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" {...common} />
      <path d="M5 19a7 7 0 0 1 14 0" {...common} />
      <path d="M18 7h2M19 6v2" {...common} />
    </svg>
  );
}

function BrandLogo() {
  return (
    <div className="brand-logo" aria-label="abc technology group">
        <svg viewBox="0 0 520 104" aria-hidden="true">
        <g transform="translate(12 10)">
          <circle cx="44" cy="42" r="40" fill="none" stroke="#ef3139" strokeWidth="2" />
          <path
            d="M44 4 82 42 44 80 6 42 44 4Z"
            fill="none"
            stroke="#ef3139"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <path
            d="M44 16 70 42 44 68 18 42 44 16Z"
            fill="none"
            stroke="#ef3139"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M44 26 60 42 44 58 28 42 44 26Z"
            fill="none"
            stroke="#ef3139"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M6 42h76M44 4v76M17 15l54 54M17 69l54-54"
            fill="none"
            stroke="#ef3139"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
        <text
          x="120"
          y="63"
          fill="#ef3139"
          fontFamily="'Segoe UI', Arial, sans-serif"
          fontSize="31"
          fontWeight="700"
          letterSpacing="-0.9"
        >
          abc
        </text>
        <text
          x="186"
          y="63"
          fill="#111111"
          fontFamily="'Segoe UI', Arial, sans-serif"
          fontSize="31"
          fontWeight="600"
          letterSpacing="-1"
        >
          technology
        </text>
        <text
          x="394"
          y="30"
          fill="#ef3139"
          fontFamily="'Segoe UI', Arial, sans-serif"
          fontSize="15"
          fontWeight="700"
          letterSpacing="0"
        >
          group
        </text>
        <text
          x="480"
          y="66"
          fill="#6b7280"
          fontFamily="'Segoe UI', Arial, sans-serif"
          fontSize="14"
          fontWeight="700"
        >
          TM
        </text>
        </svg>
    </div>
  );
}

function UtilityGlyph({ type }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  if (type === "refresh") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 12a8 8 0 1 1-2.3-5.7" {...common} />
        <path d="M20 4v5h-5" {...common} />
      </svg>
    );
  }

  if (type === "bell") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 16.5h11" {...common} />
        <path d="M8 16.5V11a4 4 0 1 1 8 0v5.5" {...common} />
        <path d="M10.5 19a1.5 1.5 0 0 0 3 0" {...common} />
      </svg>
    );
  }

  if (type === "logout") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 7h-4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4" {...common} />
        <path d="M11 12h10" {...common} />
        <path d="m18 8 3 4-3 4" {...common} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" {...common} />
      <path d="M5 19a7 7 0 0 1 14 0" {...common} />
    </svg>
  );
}

function getInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "SC";
}

export function AppShell({
  activeSection,
  children,
  error,
  groupedSections,
  loading,
  onLogout,
  onRefresh,
  onSectionChange,
  onToggleTheme,
  profileArea,
  profileName,
  profileRoleLabel,
  statusLabel,
  theme
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-topbar">
          <div className="sidebar-brand-card">
            <BrandLogo />
          </div>
        </div>

        <div className="brand-block">
          <p className="sidebar-app-name">SmartCompliance</p>
        </div>

        <div className="sidebar-nav-scroll">
          {groupedSections.map((group) => (
            <section className="nav-group" key={group.key}>
              <p className="nav-group-title">{group.label}</p>
              <nav className="nav-list">
                {group.sections.map((section) => (
                  <button
                    key={section.key}
                    type="button"
                    className={section.key === activeSection ? "nav-item active" : "nav-item"}
                    onClick={() => onSectionChange(section.key)}
                  >
                    <span className="nav-icon-wrap">
                      <SectionGlyph icon={section.icon} />
                    </span>
                    <span className="nav-title">{section.label}</span>
                  </button>
                ))}
              </nav>
            </section>
          ))}
        </div>

        <div className="sidebar-card sidebar-user-card">
          <div>
            <strong>{profileName}</strong>
            <p className="sidebar-user-role">{profileRoleLabel}</p>
            <p className="muted">{profileArea}</p>
          </div>
        </div>
        <p className="sidebar-footer">Grupo ABC © 2026</p>
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="topbar-copy">
            <p className="topbar-product">SmartCompliance</p>
            <h2>{activeSection}</h2>
            <span className="topbar-context">{statusLabel}</span>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="utility-icon-button"
              onClick={onRefresh}
              aria-label="Atualizar dados"
              title="Atualizar dados"
            >
              <UtilityGlyph type="bell" />
            </button>
            <button
              type="button"
              className="utility-icon-button"
              onClick={onToggleTheme}
              aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
              title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              <ThemeGlyph theme={theme} />
            </button>
            <div className="topbar-divider" />
            <button
              type="button"
              className="utility-icon-button"
              onClick={onLogout}
              aria-label="Sair"
              title="Sair"
            >
              <UtilityGlyph type="logout" />
            </button>
            <div
              className="topbar-avatar"
              aria-label={`${profileName} · ${profileRoleLabel} · ${profileArea}`}
              title={`${profileName} · ${profileRoleLabel} · ${profileArea}`}
            >
              {getInitials(profileName)}
            </div>
          </div>
        </header>

        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? <div className="loading">Carregando dados do MVP...</div> : null}

        {children}
      </main>
    </div>
  );
}

export { ThemeGlyph };
