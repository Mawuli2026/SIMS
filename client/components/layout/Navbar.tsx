import { useState } from "react";
import {
  HiMenu,
  HiSearch,
  HiBell,
  HiChevronDown,
} from "react-icons/hi";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
}

const notifications: Notification[] = [
  {
    id: 1,
    title: "Low Stock Alert",
    message: "Milk has only 3 items remaining.",
    time: "2 min ago",
  },
  {
    id: 2,
    title: "Sale Completed",
    message: "Invoice INV-1024 was successfully completed.",
    time: "10 min ago",
  },
  {
    id: 3,
    title: "Out of Stock",
    message: "Sugar is currently out of stock.",
    time: "1 hour ago",
  },
];

const Navbar = () => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">

      <div className="flex items-center justify-between h-16 px-6">

        {/* Left Side */}
        <div className="flex items-center gap-4">

          {/* Mobile Menu */}
          <button
            className="md:hidden text-gray-700 hover:text-blue-600"
          >
            <HiMenu className="w-7 h-7" />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-96">

            <HiSearch className="text-gray-500 w-5 h-5" />

            <input
              type="text"
              placeholder="Search products..."
              className="ml-2 bg-transparent outline-none w-full text-sm"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6">

          {/* Notifications */}
          <div className="relative">

            <button
              onClick={() =>
                setShowNotifications(!showNotifications)
              }
              className="relative"
            >
              <HiBell className="w-7 h-7 text-gray-700 hover:text-blue-600" />

              <span
                className="
                absolute
                -top-1
                -right-2
                bg-red-600
                text-white
                text-xs
                rounded-full
                h-5
                w-5
                flex
                items-center
                justify-center
                "
              >
                {notifications.length}
              </span>
            </button>

            {/* Dropdown */}
            {showNotifications && (
              <div
                className="
                absolute
                right-0
                mt-3
                w-96
                bg-white
                rounded-xl
                shadow-xl
                border
                overflow-hidden
                "
              >

                <div className="p-4 border-b">

                  <h3 className="font-semibold">
                    Notifications
                  </h3>

                </div>

                <div className="max-h-96 overflow-y-auto">

                  {notifications.map((item) => (

                    <div
                      key={item.id}
                      className="
                      p-4
                      border-b
                      hover:bg-gray-50
                      cursor-pointer
                      "
                    >

                      <h4 className="font-medium">
                        {item.title}
                      </h4>

                      <p className="text-sm text-gray-600 mt-1">
                        {item.message}
                      </p>

                      <span className="text-xs text-gray-400">
                        {item.time}
                      </span>

                    </div>

                  ))}

                </div>

              </div>
            )}

          </div>

          {/* User Profile */}
          <button
            className="
            flex
            items-center
            gap-3
            hover:bg-gray-100
            rounded-lg
            px-3
            py-2
            "
          >

            <div
              className="
              h-10
              w-10
              rounded-full
              bg-blue-600
              text-white
              flex
              items-center
              justify-center
              font-bold
              "
            >
              H
            </div>

            <div className="hidden md:block text-left">

              <p className="font-semibold">
                Admin
              </p>

              <p className="text-sm text-gray-500">
                Administrator
              </p>

            </div>

            <HiChevronDown className="text-gray-500" />

          </button>

        </div>

      </div>

    </header>
  );
};

export default Navbar;