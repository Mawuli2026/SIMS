import { Link, useNavigate, useParams } from "react-router-dom";
import {
  HiArrowLeft,
  HiPencil,
  HiTrash,
  HiOfficeBuilding,
  HiPhone,
  HiMail,
  HiGlobe,
  HiLocationMarker,
} from "react-icons/hi";
import { useState } from "react";

import supplierService from "../../services/supplierService";
import DeleteConfirmationModal from "../../common/DeleteConfirmationModal";

const statusStyles = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-red-100 text-red-700",
};

const SupplierDetails = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const supplier = id
    ? supplierService.getById(id)
    : undefined;

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  if (!supplier) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow">
        <h1 className="mb-4 text-3xl font-bold">
          Supplier Not Found
        </h1>

        <Link
          to="/suppliers"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white"
        >
          Back to Suppliers
        </Link>
      </div>
    );
  }

  const deleteSupplier = () => {
    supplierService.delete(supplier.id);
    navigate("/suppliers");
  };

  return (
    <>
      <div className="space-y-8">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-4">

            <Link
              to="/suppliers"
              className="rounded-lg border p-2 hover:bg-gray-100"
            >
              <HiArrowLeft className="h-5 w-5" />
            </Link>

            <div>

              <h1 className="text-3xl font-bold">
                {supplier.companyName}
              </h1>

              <p className="text-gray-500">
                Supplier Details
              </p>

            </div>

          </div>

          <div className="flex gap-3">

            <Link
              to={`/suppliers/edit/${supplier.id}`}
              className="flex items-center gap-2 rounded-lg bg-yellow-500 px-5 py-2 text-white"
            >
              <HiPencil />
              Edit
            </Link>

            <button
              onClick={() =>
                setShowDeleteModal(true)
              }
              className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-white"
            >
              <HiTrash />
              Delete
            </button>

          </div>

        </div>

        <div className="rounded-xl border bg-white shadow">

          <div className="grid gap-8 p-8 lg:grid-cols-2">

            <Info
              icon={<HiOfficeBuilding />}
              label="Company"
              value={supplier.companyName}
            />

            <Info
              icon={<HiOfficeBuilding />}
              label="Contact Person"
              value={supplier.contactPerson}
            />

            <Info
              icon={<HiMail />}
              label="Email"
              value={supplier.email}
            />

            <Info
              icon={<HiPhone />}
              label="Phone"
              value={supplier.phone}
            />

            <Info
              icon={<HiGlobe />}
              label="Website"
              value={supplier.website || "-"}
            />

            <Info
              icon={<HiLocationMarker />}
              label="City"
              value={supplier.city}
            />

            <Info
              icon={<HiLocationMarker />}
              label="Country"
              value={supplier.country}
            />

            <Info
              icon={<HiOfficeBuilding />}
              label="Tax Number"
              value={supplier.taxNumber}
            />

          </div>

          <div className="border-t p-8">

            <h3 className="mb-2 text-lg font-semibold">
              Address
            </h3>

            <p>{supplier.address || "-"}</p>

          </div>

          <div className="border-t p-8">

            <h3 className="mb-2 text-lg font-semibold">
              Notes
            </h3>

            <p>{supplier.notes || "-"}</p>

          </div>

          <div className="border-t p-8">

            <span
              className={`rounded-full px-4 py-2 font-semibold ${statusStyles[supplier.status]}`}
            >
              {supplier.status}
            </span>

          </div>

          <div className="grid gap-4 border-t p-8 md:grid-cols-2">

            <Info
              label="Created"
              value={new Date(
                supplier.createdAt
              ).toLocaleString()}
            />

            <Info
              label="Updated"
              value={new Date(
                supplier.updatedAt
              ).toLocaleString()}
            />

          </div>

        </div>

        {/* Products supplied (placeholder) */}

        <div className="rounded-xl border bg-white p-8 shadow">

          <h2 className="mb-4 text-2xl font-bold">
            Products Supplied
          </h2>

          <p className="text-gray-500">
            This section will automatically list
            products linked to this supplier in
            Phase 3.
          </p>

        </div>

      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Supplier"
        message="This action cannot be undone."
        itemName={supplier.companyName}
        onCancel={() =>
          setShowDeleteModal(false)
        }
        onConfirm={deleteSupplier}
      />
    </>
  );
};

interface InfoProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}

const Info = ({
  icon,
  label,
  value,
}: InfoProps) => (
  <div className="flex items-start gap-3">

    {icon && (
      <div className="mt-1 text-blue-600">
        {icon}
      </div>
    )}

    <div>

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="font-semibold">
        {value}
      </p>

    </div>

  </div>
);

export default SupplierDetails;