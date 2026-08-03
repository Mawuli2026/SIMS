import { getUserById } from "./auth.service";
import { ProfileUser } from "../types/profile.types";

export const getMyProfile = async (userId: number): Promise<ProfileUser> => {
  const user = await getUserById(userId);

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.role,
    dateJoined: user.createdAt.toISOString(),
    initial: user.firstName.charAt(0).toUpperCase(),
  };
};
