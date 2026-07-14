// client/services/customerService.ts

export type CustomerStatus = 'Active' | 'Inactive';

export interface Customer {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status: CustomerStatus;
  createdAt: string;
  totalPurchases: number;
  totalSpent: number;
}

export interface CreateCustomerDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status?: CustomerStatus;
}

export interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  totalSpent: number;
  averageSpent: number;
  topSpender: Customer | null;
  mostPurchases: Customer | null;
}

const STORAGE_KEY = 'customers';

class CustomerService {
  /**
   * Load customers from localStorage
   */
  private load(): Customer[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
      return [];
    }
  }

  /**
   * Save customers to localStorage
   */
  private save(customers: Customer[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    } catch (error) {
      console.error('Failed to save customers:', error);
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get all customers sorted by first name
   */
  getAll(): Customer[] {
    return this.load().sort((a, b) => 
      a.firstName.localeCompare(b.firstName)
    );
  }

  /**
   * Get customer by ID
   */
  getById(id: string): Customer | undefined {
    return this.load().find(customer => customer.id === id);
  }

  /**
   * Get customer by email
   */
  getByEmail(email: string): Customer | undefined {
    return this.load().find(
      customer => customer.email.toLowerCase() === email.toLowerCase()
    );
  }

  /**
   * Create a new customer with validation
   */
  create(customerData: CreateCustomerDTO): Customer {
    // Validate required fields
    if (!customerData.firstName?.trim()) {
      throw new Error('First name is required');
    }
    if (!customerData.lastName?.trim()) {
      throw new Error('Last name is required');
    }
    if (!customerData.email?.trim()) {
      throw new Error('Email is required');
    }
    if (!customerData.phone?.trim()) {
      throw new Error('Phone is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerData.email)) {
      throw new Error('Invalid email format');
    }

    // Check for duplicate email
    const existing = this.getByEmail(customerData.email);
    if (existing) {
      throw new Error('Customer with this email already exists');
    }

    const customers = this.load();
    
    const newCustomer: Customer = {
      id: this.generateId(),
      customerNumber: this.generateCustomerNumber(),
      firstName: customerData.firstName.trim(),
      lastName: customerData.lastName.trim(),
      email: customerData.email.trim().toLowerCase(),
      phone: customerData.phone.trim(),
      address: customerData.address?.trim() || '',
      city: customerData.city?.trim() || '',
      country: customerData.country?.trim() || '',
      status: customerData.status || 'Active',
      createdAt: new Date().toISOString(),
      totalPurchases: 0,
      totalSpent: 0
    };

    customers.push(newCustomer);
    this.save(customers);
    return newCustomer;
  }

  /**
   * Create multiple customers at once
   */
  createMany(customersData: CreateCustomerDTO[]): Customer[] {
    const created: Customer[] = [];
    const errors: string[] = [];

    for (const data of customersData) {
      try {
        const customer = this.create(data);
        created.push(customer);
      } catch (error) {
        errors.push(`Failed to create ${data.email}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Some customers failed to create:', errors);
    }

    return created;
  }

  /**
   * Update an existing customer
   */
  update(id: string, updates: Partial<Customer>): Customer | null {
    const customers = this.load();
    const index = customers.findIndex(c => c.id === id);

    if (index === -1) {
      return null;
    }

    // If email is being updated, check for duplicates
    if (updates.email) {
      const existing = this.getByEmail(updates.email);
      if (existing && existing.id !== id) {
        throw new Error('Email already in use by another customer');
      }
    }

    customers[index] = {
      ...customers[index],
      ...updates,
      // Don't allow these fields to be updated directly
      id: customers[index].id,
      customerNumber: customers[index].customerNumber,
      createdAt: customers[index].createdAt
    };

    this.save(customers);
    return customers[index];
  }

  /**
   * Update customer purchase history
   */
  updatePurchaseHistory(id: string, amount: number): Customer | null {
    const customer = this.getById(id);
    if (!customer) return null;

    return this.update(id, {
      totalPurchases: customer.totalPurchases + 1,
      totalSpent: customer.totalSpent + amount
    });
  }

  /**
   * Delete a customer by ID
   */
  delete(id: string): boolean {
    const customers = this.load();
    const filtered = customers.filter(c => c.id !== id);
    
    if (filtered.length === customers.length) {
      return false;
    }

    this.save(filtered);
    return true;
  }

  /**
   * Delete multiple customers
   */
  deleteMany(ids: string[]): number {
    const customers = this.load();
    const filtered = customers.filter(c => !ids.includes(c.id));
    const deleted = customers.length - filtered.length;
    this.save(filtered);
    return deleted;
  }

  /**
   * Search customers by keyword
   */
  search(keyword: string, exactMatch: boolean = false): Customer[] {
    if (!keyword?.trim()) {
      return this.getAll();
    }

    const q = keyword.trim().toLowerCase();
    
    return this.getAll().filter(customer => {
      const searchableFields = [
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.phone,
        customer.city,
        customer.country,
        customer.customerNumber,
        `${customer.firstName} ${customer.lastName}`
      ];

      return searchableFields.some(field => {
        const value = field.toLowerCase();
        return exactMatch ? value === q : value.includes(q);
      });
    });
  }

  /**
   * Get customers by status
   */
  getByStatus(status: CustomerStatus): Customer[] {
    return this.getAll().filter(customer => customer.status === status);
  }

  /**
   * Generate a unique customer number
   */
  generateCustomerNumber(): string {
    const customers = this.getAll();
    const nextNumber = customers.length + 1;
    return `CUS-${String(nextNumber).padStart(5, '0')}`;
  }

  /**
   * Get customer statistics
   */
  getStats(): CustomerStats {
    const customers = this.getAll();
    const active = customers.filter(c => c.status === 'Active');
    const inactive = customers.filter(c => c.status === 'Inactive');
    
    const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageSpent = customers.length > 0 
      ? totalSpent / customers.length 
      : 0;

    // Find top spender and most purchases
    let topSpender: Customer | null = null;
    let mostPurchases: Customer | null = null;
    let maxSpent = -Infinity;
    let maxPurchases = -Infinity;

    for (const customer of customers) {
      if (customer.totalSpent > maxSpent) {
        maxSpent = customer.totalSpent;
        topSpender = customer;
      }
      if (customer.totalPurchases > maxPurchases) {
        maxPurchases = customer.totalPurchases;
        mostPurchases = customer;
      }
    }

    return {
      total: customers.length,
      active: active.length,
      inactive: inactive.length,
      totalSpent,
      averageSpent,
      topSpender,
      mostPurchases
    };
  }

  /**
   * Export customers as CSV
   */
  exportToCSV(): string {
    const customers = this.getAll();
    if (customers.length === 0) return '';

    const headers = [
      'Customer Number',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Address',
      'City',
      'Country',
      'Status',
      'Created At',
      'Total Purchases',
      'Total Spent'
    ];

    const rows = customers.map(c => [
      c.customerNumber,
      c.firstName,
      c.lastName,
      c.email,
      c.phone,
      c.address,
      c.city,
      c.country,
      c.status,
      new Date(c.createdAt).toLocaleDateString(),
      c.totalPurchases,
      c.totalSpent.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Clear all customers (use with caution!)
   */
  clearAll(): void {
    if (confirm('Are you sure you want to delete all customers?')) {
      this.save([]);
    }
  }
}

// Export singleton instance
const customerService = new CustomerService();
export default customerService;