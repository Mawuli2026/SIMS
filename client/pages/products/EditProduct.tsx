import { useParams, useNavigate } from "react-router-dom";

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="rounded-xl bg-white border p-6 shadow">
      <div className="border-b pb-4 mb-6">
        <h2 className="text-xl font-semibold">Edit Product</h2>
        <p className="text-sm text-gray-500">Updating product ID: {id}</p>
      </div>

      <div className="text-sm text-gray-600">
        Product editing form fields go here.
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => navigate("/products")}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Cancel
        </button>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditProduct;