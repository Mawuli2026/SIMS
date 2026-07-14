import CategoryTable from "../../components/categories/CategoryTable";

const Categories = () => {
  return (
    <div className="space-y-8">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Categories
          </h1>

          <p className="text-gray-500">
            Manage product categories.
          </p>

        </div>

      </div>

      <CategoryTable />

    </div>
  );
};

export default Categories;