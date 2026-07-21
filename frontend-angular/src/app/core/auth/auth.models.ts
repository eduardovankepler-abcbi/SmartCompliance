export interface AuthPerson {
  id: string;
  name: string;
  area?: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  roleKey: string;
  status: string;
  person: AuthPerson | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
