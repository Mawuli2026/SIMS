import { Link, useNavigate, useParams } from "react-router-dom";
import {
  HiArrowLeft,
  HiPencil,
  HiTrash,
  HiCash,
  HiUser,
  HiPhone,
  HiMail,
  HiLocationMarker,
} from "react-icons/hi";

import customerService from "../../services/customerService";
import salesService from "../../services/salesService";

const CustomerProfile = () => {

  const { id } = useParams();

  const navigate = useNavigate();

  const customer = id
    ? customerService.getById(id)
    : undefined;

  if (!customer) {

    return (

      <div className="p-8">

        <h2 className="text-2xl font-bold">

          Customer Not Found

        </h2>

        <Link
          to="/customers"
          className="mt-4 inline-flex text-blue-600"
        >

          Back to Customers

        </Link>

      </div>

    );

  }

  const sales = salesService
    .getAll()
    .filter(
      sale => sale.customerId === customer.id
    );

  const handleDelete = () => {

    if (
      window.confirm(
        "Delete this customer?"
      )
    ) {

      customerService.remove(customer.id);

      navigate("/customers");

    }

  };

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <Link
            to="/customers"
            className="mb-3 inline-flex items-center gap-2 text-blue-600"
          >

            <HiArrowLeft />

            Back

          </Link>

          <h1 className="text-3xl font-bold">

            {customer.firstName} {customer.lastName}

          </h1>

          <p className="text-gray-500">

            {customer.customerNumber}

          </p>

        </div>

        <div className="flex gap-3">

          <Link
            to={`/customers/edit/${customer.id}`}
            className="rounded-lg bg-yellow-500 px-4 py-2 text-white"
          >

            <HiPencil />

          </Link>

          <button
            onClick={handleDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-white"
          >

            <HiTrash />

          </button>

        </div>

      </div>

      {/* Customer Information */}

      <div className="grid gap-6 md:grid-cols-2">

        <div className="rounded-xl border bg-white p-6 shadow">

          <div className="mb-4 flex items-center gap-2">

            <HiUser />

            <h2 className="text-xl font-semibold">

              Customer Information

            </h2>

          </div>

          <div className="space-y-3">

            <p>

              <HiPhone className="mr-2 inline" />

              {customer.phone}

            </p>

            <p>

              <HiMail className="mr-2 inline" />

              {customer.email || "-"}

            </p>

            <p>

              <HiLocationMarker className="mr-2 inline" />

              {customer.address}

            </p>

            <p>

              {customer.city}, {customer.country}

            </p>

            <p>

              <strong>Status:</strong>{" "}

              {customer.status}

            </p>

          </div>

        </div>

        {/* Statistics */}

        <div className="rounded-xl border bg-white p-6 shadow">

          <div className="mb-4 flex items-center gap-2">

            <HiCash />

            <h2 className="text-xl font-semibold">

              Purchase Statistics

            </h2>

          </div>

          <div className="space-y-4">

            <div className="flex justify-between">

              <span>Total Purchases</span>

              <strong>

                {sales.length}

              </strong>

            </div>

            <div className="flex justify-between">

              <span>Total Spent</span>

              <strong>

                $
                {sales
                  .reduce(
                    (sum, sale) =>
                      sum + sale.grandTotal,
                    0
                  )
                  .toFixed(2)}

              </strong>

            </div>

            <div className="flex justify-between">

              <span>Average Sale</span>

              <strong>

                $

                {sales.length === 0
                  ? "0.00"
                  : (
                      sales.reduce(
                        (
                          sum,
                          sale
                        ) =>
                          sum +
                          sale.grandTotal,
                        0
                      ) /
                      sales.length
                    ).toFixed(2)}

              </strong>

            </div>

          </div>

        </div>

      </div>

      {/* Purchase History */}

      <div className="rounded-xl border bg-white shadow">

        <div className="border-b p-5">

          <h2 className="text-xl font-semibold">

            Purchase History

          </h2>

        </div>

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-5 py-3 text-left">

                Invoice

              </th>

              <th className="px-5 py-3">

                Date

              </th>

              <th className="px-5 py-3">

                Cashier

              </th>

              <th className="px-5 py-3">

                Total

              </th>

              <th className="px-5 py-3">

                Status

              </th>

              <th className="px-5 py-3">

                Action

              </th>

            </tr>

          </thead>

          <tbody>

            {sales.map((sale) => (

              <tr
                key={sale.id}
                className="border-t"
              >

                <td className="px-5 py-4">

                  {sale.saleNumber}

                </td>

                <td className="px-5 py-4">

                  {new Date(
                    sale.createdAt
                  ).toLocaleDateString()}

                </td>

                <td className="px-5 py-4">

                  {sale.cashierName}

                </td>

                <td className="px-5 py-4">

                  $

                  {sale.grandTotal.toFixed(2)}

                </td>

                <td className="px-5 py-4">

                  {sale.status}

                </td>

                <td className="px-5 py-4">

                  <Link
                    to={`/sales/${sale.id}`}
                    className="text-blue-600"
                  >

                    View

                  </Link>

                </td>

              </tr>

            ))}

            {sales.length === 0 && (

              <tr>

                <td
                  colSpan={6}
                  className="py-10 text-center text-gray-500"
                >

                  No purchases yet.

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default CustomerProfile;