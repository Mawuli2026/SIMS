export interface AuditLog {

  id: string;

  user: string;

  module: string;

  action: string;

  description: string;

  createdAt: string;

}

class AuditService {

  private logs: AuditLog[] = [

    {

      id: "1",

      user: "Administrator",

      module: "Authentication",

      action: "Login",

      description: "Administrator logged into the system.",

      createdAt: new Date().toISOString(),

    },

    {

      id: "2",

      user: "Administrator",

      module: "Products",

      action: "Create",

      description: "Added product: Wireless Mouse",

      createdAt: new Date().toISOString(),

    },

    {

      id: "3",

      user: "Cashier",

      module: "Sales",

      action: "Sale",

      description: "Created Sale INV-000125",

      createdAt: new Date().toISOString(),

    },

  ];

  getAll() {

    return this.logs;

  }

  add(log: AuditLog) {

    this.logs.unshift(log);

  }

}

export default new AuditService();