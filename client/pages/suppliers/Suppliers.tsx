import SupplierTable from "../../components/suppliers/SupplierTable";

const Suppliers = () => {
  return (
    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold">
          Suppliers
        </h1>

        <p className="text-gray-500">
          Manage supplier records.
        </p>

      </div>

      <SupplierTable />

    </div>
  );
};

export default Suppliers;