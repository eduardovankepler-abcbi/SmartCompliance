import { verifyToken } from "./token.js";

export function requireAuth(store) {
  return async (req, res, next) => {
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
    if (!user) {
      return res.status(401).json({ error: "Usuario nao encontrado." });
    }

    req.auth = {
      user
    };
    next();
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

