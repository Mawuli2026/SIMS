import { UserRole } from "./auth.types";

export interface ProfileUser {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: UserRole;
  dateJoined: string;
  initial: string;
}

export interface ProfileResponse {
  user: ProfileUser;
}
