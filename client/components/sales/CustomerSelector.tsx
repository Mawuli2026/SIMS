import { useEffect, useState } from "react";
import { HiUser, HiPlus } from "react-icons/hi";

import customerService from "../../services/customerService";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface CustomerSelectorProps {
  customerId: string;
  customerName: string;

  setCustomerId: React.Dispatch<React.SetStateAction<string>>;
  setCustomerName: React.Dispatch<React.SetStateAction<string>>;
}

const CustomerSelector = ({
  customerId,
  customerName,
  setCustomerId,
  setCustomerName,
}: CustomerSelectorProps) => {

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [search, setSearch] = useState("");

  useEffect(() => {

    setCustomers(customerService.getAll());

  }, []);

  const filteredCustomers = customers.filter(customer => {

    const keyword = search.toLowerCase();

    return (

      customer.firstName
        .toLowerCase()
        .includes(keyword) ||

      customer.lastName
        .toLowerCase()
        .includes(keyword) ||

      customer.email
        .toLowerCase()
        .includes(keyword)

    );

  });

  const selectCustomer = (customer: Customer) => {

    setCustomerId(customer.id);

    setCustomerName(
      `${customer.firstName} ${customer.lastName}`
    );

  };

  const walkInCustomer = () => {

    setCustomerId("");

    setCustomerName("Walk-in Customer");

  };

  return (

    <div className="rounded-xl border bg-white shadow">

      <div className="border-b p-5">

        <h2 className="text-xl font-semibold">

          Customer

        </h2>

      </div>

      <div className="space-y-4 p-5">

        <button
          onClick={walkInCustomer}
          className="w-full rounded-lg bg-blue-600 py-2 text-white"
        >
          Walk-in Customer
        </button>

        <input
          type="text"
          placeholder="Search customer..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full rounded-lg border px-3 py-2"
        />

        <div className="max-h-64 overflow-y-auto">

          {filteredCustomers.map(customer => (

            <button
              key={customer.id}
              onClick={() =>
                selectCustomer(customer)
              }
              className={`mb-2 w-full rounded-lg border p-3 text-left hover:bg-gray-50 ${
                customerId === customer.id
                  ? "border-blue-600 bg-blue-50"
                  : ""
              }`}
            >

              <div className="flex items-center gap-3">

                <HiUser
                  className="text-blue-600"
                  size={20}
                />

                <div>

                  <div className="font-semibold">

                    {customer.firstName} {customer.lastName}

                  </div>

                  <div className="text-sm text-gray-500">

                    {customer.email}

                  </div>

                  <div className="text-sm text-gray-500">

                    {customer.phone}

                  </div>

                </div>

              </div>

            </button>

          ))}

        </div>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-lg border py-2 hover:bg-gray-50"
        >
          <HiPlus />

          New Customer

        </button>

        <div className="rounded-lg bg-gray-100 p-3">

          <div className="text-sm text-gray-500">

            Selected Customer

          </div>

          <div className="font-semibold">

            {customerName}

          </div>

        </div>

      </div>

    </div>

  );

};

export default CustomerSelector;