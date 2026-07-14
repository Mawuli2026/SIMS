import { useState } from "react";
import { useNavigate } from "react-router-dom";

import supplierService from "../../services/supplierService";
import { SupplierFormData } from "../../types/supplier";

const AddSupplier = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<SupplierFormData>({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    website: "",
    taxNumber: "",
    notes: "",
    status: "Active",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    supplierService.create(form);

    navigate("/suppliers");
  };

  return (
    <div className="mx-auto max-w-6xl">

      <div className="rounded-xl border bg-white p-8 shadow">

        <h1 className="mb-2 text-3xl font-bold">
          Add Supplier
        </h1>

        <p className="mb-8 text-gray-500">
          Register a new supplier.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <div className="grid gap-6 md:grid-cols-2">

            <div>
              <label className="mb-2 block font-medium">
                Company Name
              </label>

              <input
                required
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Contact Person
              </label>

              <input
                required
                name="contactPerson"
                value={form.contactPerson}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Email
              </label>

              <input
                type="email"
                required
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Phone
              </label>

              <input
                required
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Website
              </label>

              <input
                type="url"
                name="website"
                value={form.website}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Tax / VAT Number
              </label>

              <input
                name="taxNumber"
                value={form.taxNumber}
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

          </div>

          <div>
            <label className="mb-2 block font-medium">
              Address
            </label>

            <textarea
              rows={3}
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Notes
            </label>

            <textarea
              rows={4}
              name="notes"
              value={form.notes}
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
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-4">

            <button
              type="button"
              onClick={() => navigate("/suppliers")}
              className="rounded-lg border px-6 py-3"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              Save Supplier
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AddSupplier;