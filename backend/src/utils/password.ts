import bcrypt from "bcryptjs";

const PASSWORD_SALT_ROUNDS = 12;

export const hashPassword = (password: string) => bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

export const comparePassword = (password: string, hashedPassword: string) => bcrypt.compare(password, hashedPassword);
