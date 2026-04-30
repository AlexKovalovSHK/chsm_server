export interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}
