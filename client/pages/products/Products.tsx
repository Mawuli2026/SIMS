import { Link } from "react-router-dom";
import ProductTable from "../../components/products/ProductTable";

const Products = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Products
          </h1>

          <p className="mt-1 text-gray-500">
            Manage your inventory products.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/products/new"
            className="
              rounded-lg
              bg-blue-600
              px-5
              py-2
              text-sm
              font-medium
              text-white
              hover:bg-blue-700
            "
          >
            Add Product
          </Link>
        </div>
      </div>

      {/* Product Table */}
      <ProductTable />
    </div>
  );
};

export default Products;