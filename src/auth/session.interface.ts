export interface Session {
  id: string;
  name: string;
  email: string;
}

export interface JwtPayload {
  sub: string;
  name: string;
  email: string;
}
