import { useMemo, useState } from "react";
import {
  HiSearch,
  HiPlus,
} from "react-icons/hi";

import productService from "../../services/productService";
import inventoryService from "../../services/inventoryService";

import { SaleItem } from "../../types/sale";

interface ProductSearchProps {
  cart: SaleItem[];
  setCart: React.Dispatch<
    React.SetStateAction<SaleItem[]>
  >;
}

const ProductSearch = ({
  cart,
  setCart,
}: ProductSearchProps) => {

  const [search, setSearch] = useState("");

  const products = useMemo(() => {

    const keyword = search.toLowerCase();

    return productService
      .getAll()
      .filter((product) => {

        return (
          product.name
            .toLowerCase()
            .includes(keyword) ||
          product.sku
            .toLowerCase()
            .includes(keyword)
        );

      });

  }, [search]);

  const addToCart = (product: any) => {

    const inventory =
      inventoryService
        .getAll()
        .find(
          i => i.productId === product.id
        );

    if (!inventory) return;

    if (inventory.quantity <= 0) {

      alert("Product is out of stock.");

      return;

    }

    const existing =
      cart.find(
        item =>
          item.productId === product.id
      );

    if (existing) {

      setCart(

        cart.map(item => {

          if (
            item.productId !== product.id
          ) {
            return item;
          }

          if (
            item.quantity + 1 >
            inventory.quantity
          ) {

            alert(
              "Not enough stock."
            );

            return item;

          }

          return {

            ...item,

            quantity:
              item.quantity + 1,

            total:
              (item.quantity + 1) *
              item.price,

          };

        })

      );

      return;

    }

    const saleItem: SaleItem = {

      id: crypto.randomUUID(),

      productId: product.id,

      productName: product.name,

      quantity: 1,

      price: product.sellingPrice,

      total: product.sellingPrice,

    };

    setCart([...cart, saleItem]);

  };

  return (

    <div className="rounded-xl border bg-white shadow">

      <div className="border-b p-5">

        <h2 className="text-xl font-semibold">

          Products

        </h2>

      </div>

      <div className="p-5">

        <div className="relative mb-6">

          <HiSearch className="absolute left-3 top-3 text-gray-400" />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search product..."
            className="w-full rounded-lg border py-2 pl-10 pr-4"
          />

        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">

          {products.map(product => {

            const inventory =
              inventoryService
                .getAll()
                .find(
                  i =>
                    i.productId ===
                    product.id
                );

            const stock =
              inventory?.quantity ?? 0;

            return (

              <div
                key={product.id}
                className="rounded-lg border p-4 hover:shadow"
              >

                <div className="mb-3 h-32 rounded bg-gray-100 flex items-center justify-center">

                  {product.image ? (

                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full object-cover"
                    />

                  ) : (

                    <span className="text-gray-400">

                      No Image

                    </span>

                  )}

                </div>

                <h3 className="font-semibold">

                  {product.name}

                </h3>

                <p className="text-sm text-gray-500">

                  {product.sku}

                </p>

                <p className="mt-2 font-bold text-blue-600">

                  ${product.sellingPrice.toFixed(2)}

                </p>

                <p
                  className={`text-sm ${
                    stock > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >

                  Stock: {stock}

                </p>

                <button
                  disabled={stock <= 0}
                  onClick={() =>
                    addToCart(product)
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-white disabled:bg-gray-300"
                >

                  <HiPlus />

                  Add

                </button>

              </div>

            );

          })}

          {products.length === 0 && (

            <div className="col-span-full py-10 text-center text-gray-500">

              No products found.

            </div>

          )}

        </div>

      </div>

    </div>

  );

};

export default ProductSearch;