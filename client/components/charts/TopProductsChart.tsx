import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export interface TopProductData {
  productName: string;
  unitsSold: number;
  revenue: number;
}

interface TopProductsChartProps {
  data: TopProductData[];
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
  "#4f46e5",
  "#059669",
];

const TopProductsChart = ({
  data,
}: TopProductsChartProps) => {

  const topProducts = [...data]
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 10);

  return (

    <div className="rounded-xl border bg-white p-6 shadow">

      <div className="mb-5">

        <h2 className="text-xl font-semibold">

          Top Selling Products

        </h2>

        <p className="text-sm text-gray-500">

          Top 10 products ranked by quantity sold

        </p>

      </div>

      <ResponsiveContainer
        width="100%"
        height={420}
      >

        <BarChart
          data={topProducts}
          layout="vertical"
          margin={{
            top: 10,
            right: 30,
            left: 40,
            bottom: 10,
          }}
        >

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            type="number"
          />

          <YAxis
            type="category"
            dataKey="productName"
            width={140}
          />

          <Tooltip
            formatter={(value: number, name: string) => {

              if (name === "unitsSold") {

                return [value, "Units Sold"];

              }

              return [
                `$${value.toFixed(2)}`,
                "Revenue",
              ];

            }}
          />

          <Bar
            dataKey="unitsSold"
            radius={[0, 8, 8, 0]}
          >

            {topProducts.map((_, index) => (

              <Cell
                key={index}
                fill={
                  COLORS[
                    index % COLORS.length
                  ]
                }
              />

            ))}

          </Bar>

        </BarChart>

      </ResponsiveContainer>

      <div className="mt-5 border-t pt-4">

        <table className="w-full text-sm">

          <thead>

            <tr className="text-left text-gray-600">

              <th>Rank</th>

              <th>Product</th>

              <th className="text-right">

                Units

              </th>

              <th className="text-right">

                Revenue

              </th>

            </tr>

          </thead>

          <tbody>

            {topProducts.map((product, index) => (

              <tr
                key={product.productName}
                className="border-t"
              >

                <td className="py-2">

                  #{index + 1}

                </td>

                <td>

                  {product.productName}

                </td>

                <td className="text-right">

                  {product.unitsSold}

                </td>

                <td className="text-right">

                  ${product.revenue.toFixed(2)}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default TopProductsChart;