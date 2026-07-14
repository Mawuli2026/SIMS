import { HiMinus, HiPlus, HiTrash } from "react-icons/hi";
import inventoryService from "../../services/inventoryService";
import { SaleItem } from "../../types/sale";

interface ShoppingCartProps {
  cart: SaleItem[];
  setCart: React.Dispatch<React.SetStateAction<SaleItem[]>>;
}

const ShoppingCart = ({
  cart,
  setCart,
}: ShoppingCartProps) => {

  const increaseQuantity = (id: string) => {

    setCart(current =>
      current.map(item => {

        if (item.id !== id) return item;

        const stock = inventoryService
          .getAll()
          .find(i => i.productId === item.productId);

        if (!stock) return item;

        if (item.quantity >= stock.quantity) {
          alert("Not enough stock.");
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
          total: (item.quantity + 1) * item.price,
        };

      })
    );

  };

  const decreaseQuantity = (id: string) => {

    setCart(current =>
      current
        .map(item => {

          if (item.id !== id) return item;

          if (item.quantity === 1) return item;

          return {

            ...item,

            quantity: item.quantity - 1,

            total: (item.quantity - 1) * item.price,

          };

        })
    );

  };

  const removeItem = (id: string) => {

    setCart(current =>
      current.filter(item => item.id !== id)
    );

  };

  if (cart.length === 0) {

    return (

      <div className="rounded-xl border bg-white p-12 shadow">

        <div className="text-center">

          <h2 className="text-xl font-semibold">

            Shopping Cart

          </h2>

          <p className="mt-3 text-gray-500">

            No products added yet.

          </p>

        </div>

      </div>

    );

  }

  return (

    <div className="rounded-xl border bg-white shadow">

      <div className="border-b p-5">

        <h2 className="text-xl font-semibold">

          Shopping Cart

        </h2>

      </div>

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-4 py-3 text-left">
                Product
              </th>

              <th className="px-4 py-3 text-center">
                Qty
              </th>

              <th className="px-4 py-3 text-right">
                Price
              </th>

              <th className="px-4 py-3 text-right">
                Total
              </th>

              <th className="px-4 py-3 text-center">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {cart.map(item => (

              <tr
                key={item.id}
                className="border-t"
              >

                <td className="px-4 py-4">

                  <div>

                    <p className="font-semibold">

                      {item.productName}

                    </p>

                  </div>

                </td>

                <td className="px-4 py-4">

                  <div className="flex justify-center gap-2">

                    <button
                      onClick={() =>
                        decreaseQuantity(item.id)
                      }
                      className="rounded bg-gray-200 p-2"
                    >
                      <HiMinus />
                    </button>

                    <div className="flex w-10 items-center justify-center font-bold">

                      {item.quantity}

                    </div>

                    <button
                      onClick={() =>
                        increaseQuantity(item.id)
                      }
                      className="rounded bg-blue-600 p-2 text-white"
                    >
                      <HiPlus />
                    </button>

                  </div>

                </td>

                <td className="px-4 py-4 text-right">

                  ${item.price.toFixed(2)}

                </td>

                <td className="px-4 py-4 text-right font-semibold">

                  ${item.total.toFixed(2)}

                </td>

                <td className="px-4 py-4">

                  <div className="flex justify-center">

                    <button
                      onClick={() =>
                        removeItem(item.id)
                      }
                      className="rounded bg-red-100 p-2 text-red-700"
                    >
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

export default ShoppingCart;