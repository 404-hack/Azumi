export type User = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: "admin" | "user";
};

export type AuthResponse = {
  user: User;
  token: string;
};
