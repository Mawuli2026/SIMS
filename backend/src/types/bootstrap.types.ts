export interface BootstrapSystemAdminInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface BootstrappedSystemAdmin {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "SystemAdmin";
  createdAt: Date;
}
