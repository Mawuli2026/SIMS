import { useMemo, useState } from "react";
import { HiSearch, HiPencil, HiTrash } from "react-icons/hi";
import categoryService from "../../services/categoryService";

const CategoryTable = () => {
  const [search, setSearch] = useState("");

  const categories = useMemo(() => {
    if (!search) return categoryService.getAll();

    return categoryService.search(search);
  }, [search]);

  return (
    <div className="rounded-xl bg-white border shadow">

      <div className="flex items-center justify-between border-b p-6">
        <h2 className="text-xl font-semibold">
          Categories
        </h2>

        <button className="rounded-lg bg-blue-600 px-5 py-2 text-white">
          Add Category
        </button>
      </div>

      <div className="p-6">

        <div className="relative max-w-sm mb-6">

          <HiSearch className="absolute left-3 top-3 text-gray-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category..."
            className="w-full rounded-lg border py-2 pl-10 pr-4"
          />

        </div>

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>
              <th className="px-4 py-3 text-left">Icon</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-center">Products</th>
              <th className="px-4 py-3 text-center">Color</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>

          </thead>

          <tbody>

            {categories.map((category) => (

              <tr
                key={category.id}
                className="border-t"
              >

                <td className="px-4 py-4 text-2xl">
                  {category.icon}
                </td>

                <td className="px-4 py-4 font-semibold">
                  {category.name}
                </td>

                <td className="px-4 py-4">
                  {category.description}
                </td>

                <td className="px-4 py-4 text-center">
                  {category.productCount}
                </td>

                <td className="px-4 py-4 text-center">
                  <span
                    className="inline-block h-6 w-6 rounded-full border"
                    style={{ background: category.color }}
                  />
                </td>

                <td className="px-4 py-4">

                  <div className="flex justify-center gap-2">

                    <button className="rounded bg-yellow-100 p-2 text-yellow-700">
                      <HiPencil />
                    </button>

                    <button className="rounded bg-red-100 p-2 text-red-700">
                      <HiTrash />
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default CategoryTable;