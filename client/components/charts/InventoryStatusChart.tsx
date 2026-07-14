import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

export interface InventoryStatusData {
  status: string;
  value: number;
}

interface InventoryStatusChartProps {
  data: InventoryStatusData[];
}

const COLORS = [
  "#22c55e", // In Stock
  "#f59e0b", // Low Stock
  "#ef4444", // Out of Stock
];

const InventoryStatusChart = ({
  data,
}: InventoryStatusChartProps) => {

  const totalItems = data.reduce(
    (sum, item) => sum + item.value,
    0
  );

  return (

    <div className="rounded-xl border bg-white p-6 shadow">

      <div className="mb-5">

        <h2 className="text-xl font-semibold">

          Inventory Status

        </h2>

        <p className="text-sm text-gray-500">

          Current inventory health overview

        </p>

      </div>

      <ResponsiveContainer
        width="100%"
        height={360}
      >

        <PieChart>

          <Pie
            data={data}
            dataKey="value"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={110}
            label={({ status, percent }) =>
              `${status} ${(percent * 100).toFixed(1)}%`
            }
          >

            {data.map((entry, index) => (

              <Cell
                key={entry.status}
                fill={
                  COLORS[index % COLORS.length]
                }
              />

            ))}

          </Pie>

          <Tooltip
            formatter={(value: number) => [
              value,
              "Products",
            ]}
          />

          <Legend />

        </PieChart>

      </ResponsiveContainer>

      <div className="mt-5 border-t pt-4">

        <div className="grid grid-cols-3 gap-4 text-center">

          <div>

            <p className="text-sm text-gray-500">

              In Stock

            </p>

            <p className="text-xl font-bold text-green-600">

              {data.find(
                item => item.status === "In Stock"
              )?.value ?? 0}

            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">

              Low Stock

            </p>

            <p className="text-xl font-bold text-yellow-600">

              {data.find(
                item => item.status === "Low Stock"
              )?.value ?? 0}

            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">

              Out of Stock

            </p>

            <p className="text-xl font-bold text-red-600">

              {data.find(
                item => item.status === "Out of Stock"
              )?.value ?? 0}

            </p>

          </div>

        </div>

        <div className="mt-4 border-t pt-4 text-center">

          <p className="text-sm text-gray-500">

            Total Products

          </p>

          <p className="text-2xl font-bold">

            {totalItems}

          </p>

        </div>

      </div>

    </div>

  );

};

export default InventoryStatusChart;