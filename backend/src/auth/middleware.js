import { credentialVersion, verifyToken } from "./token.js";

export function requireAuth(store, { allowPasswordChange = false } = {}) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const [, token] = header.split(" ");

      if (!token) {
        return res.status(401).json({ error: "Autenticacao obrigatoria." });
      }

      const payload = verifyToken(token);
      if (!payload?.userId) {
        return res.status(401).json({ error: "Token invalido ou expirado." });
      }

      const user = await store.getUserById(payload.userId);
      if (!user || user.status !== "active") {
        return res.status(401).json({ error: "Usuario nao encontrado." });
      }

      const credentials = await store.findUserByEmail(user.email);
      if (!credentials || credentials.id !== user.id || credentials.status !== "active" ||
          payload.credentialVersion !== credentialVersion(credentials.passwordHash)) {
        return res.status(401).json({ error: "Sessao expirada. Entre novamente." });
      }
      if (user.mustChangePassword && !allowPasswordChange) {
        return res.status(403).json({ error: "Troca de senha obrigatoria.", code: "password_change_required" });
      }

      req.auth = {
        user
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.auth?.user || !roles.includes(req.auth.user.roleKey)) {
      return res.status(403).json({ error: "Perfil sem permissao para esta acao." });
    }
    next();
  };
}
