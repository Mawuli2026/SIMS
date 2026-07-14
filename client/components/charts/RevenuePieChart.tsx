import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

export interface RevenueCategoryData {
  category: string;
  revenue: number;
}

interface RevenuePieChartProps {
  data: RevenueCategoryData[];
}

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#7c3aed",
  "#dc2626",
  "#0891b2",
  "#ca8a04",
  "#db2777",
];

const RevenuePieChart = ({
  data,
}: RevenuePieChartProps) => {

  const totalRevenue = data.reduce(
    (sum, item) => sum + item.revenue,
    0
  );

  return (

    <div className="rounded-xl border bg-white p-6 shadow">

      <div className="mb-5">

        <h2 className="text-xl font-semibold">

          Revenue by Category

        </h2>

        <p className="text-sm text-gray-500">

          Revenue distribution across product categories

        </p>

      </div>

      <ResponsiveContainer
        width="100%"
        height={350}
      >

        <PieChart>

          <Pie
            data={data}
            dataKey="revenue"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={110}
            label={({ category, percent }) =>
              `${category} ${(percent * 100).toFixed(1)}%`
            }
          >

            {data.map((entry, index) => (

              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />

            ))}

          </Pie>

          <Tooltip
            formatter={(value: number) => [
              `$${value.toFixed(2)}`,
              "Revenue",
            ]}
          />

          <Legend />

        </PieChart>

      </ResponsiveContainer>

      <div className="mt-6 border-t pt-4">

        <div className="flex items-center justify-between">

          <span className="font-medium">

            Total Revenue

          </span>

          <span className="text-xl font-bold text-green-600">

            ${totalRevenue.toFixed(2)}

          </span>

        </div>

      </div>

    </div>

  );

};

export default RevenuePieChart;