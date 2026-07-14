import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import customerService, {
  Customer,
} from "../../services/customerService";

const CustomerForm = () => {

  const navigate = useNavigate();

  const { id } = useParams();

  const isEdit = Boolean(id);

  const [form, setForm] = useState<Customer>({
    id: "",
    customerNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    status: "Active",
    createdAt: "",
    totalPurchases: 0,
    totalSpent: 0,
  });

  useEffect(() => {

    if (!isEdit) return;

    const customer = customerService.getById(id!);

    if (customer) {
      setForm(customer);
    }

  }, [id, isEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

  };

  const handleSubmit = (e: FormEvent) => {

    e.preventDefault();

    if (!form.firstName.trim()) {
      alert("First name is required.");
      return;
    }

    if (!form.lastName.trim()) {
      alert("Last name is required.");
      return;
    }

    if (!form.phone.trim()) {
      alert("Phone number is required.");
      return;
    }

    if (isEdit) {

      customerService.update(form.id, form);

    } else {

      customerService.create({

        ...form,

        id: crypto.randomUUID(),

        customerNumber:
          customerService.generateCustomerNumber(),

        createdAt: new Date().toISOString(),

      });

    }

    navigate("/customers");

  };

  return (

    <div className="mx-auto max-w-4xl space-y-6">

      <div>

        <h1 className="text-3xl font-bold">

          {isEdit
            ? "Edit Customer"
            : "Add Customer"}

        </h1>

        <p className="text-gray-500">

          Customer information

        </p>

      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border bg-white p-6 shadow"
      >

        <div className="grid gap-6 md:grid-cols-2">

          <div>

            <label className="mb-2 block font-medium">

              First Name

            </label>

            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
              required
            />

          </div>

          <div>

            <label className="mb-2 block font-medium">

              Last Name

            </label>

            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
              required
            />

          </div>

          <div>

            <label className="mb-2 block font-medium">

              Phone

            </label>

            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
              required
            />

          </div>

          <div>

            <label className="mb-2 block font-medium">

              Email

            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />

          </div>

          <div>

            <label className="mb-2 block font-medium">

              Address

            </label>

            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />

          </div>

          <div>

            <label className="mb-2 block font-medium">

              City

            </label>

            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />

          </div>

          <div>

            <label className="mb-2 block font-medium">

              Country

            </label>

            <input
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />

          </div>

          <div>

            <label className="mb-2 block font-medium">

              Status

            </label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            >

              <option value="Active">

                Active

              </option>

              <option value="Inactive">

                Inactive

              </option>

            </select>

          </div>

        </div>

        <div className="flex justify-end gap-4">

          <Link
            to="/customers"
            className="rounded-lg border px-5 py-3"
          >

            Cancel

          </Link>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-3 text-white"
          >

            {isEdit
              ? "Update Customer"
              : "Save Customer"}

          </button>

        </div>

      </form>

    </div>

  );

};

export default CustomerForm;