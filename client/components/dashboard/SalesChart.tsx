import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface SalesData {
  day: string;
  sales: number;
}

const salesData: SalesData[] = [
  { day: "Mon", sales: 1200 },
  { day: "Tue", sales: 1800 },
  { day: "Wed", sales: 1500 },
  { day: "Thu", sales: 2400 },
  { day: "Fri", sales: 3100 },
  { day: "Sat", sales: 4200 },
  { day: "Sun", sales: 2900 },
];

const SalesChart = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Sales Trend
        </h2>

        <p className="text-sm text-gray-500">
          Sales for the last 7 days
        </p>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="day" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="sales"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;