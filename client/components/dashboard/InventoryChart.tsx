import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface InventoryData {
  name: string;
  value: number;
}

const inventoryData: InventoryData[] = [
  { name: "Food", value: 420 },
  { name: "Drinks", value: 280 },
  { name: "Electronics", value: 180 },
  { name: "Cosmetics", value: 120 },
  { name: "Others", value: 75 },
];

const COLORS = [
  "#2563eb", // Blue
  "#16a34a", // Green
  "#f97316", // Orange
  "#dc2626", // Red
  "#7c3aed", // Purple
];

const InventoryChart = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Inventory Distribution
        </h2>

        <p className="text-sm text-gray-500">
          Products by category
        </p>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={inventoryData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={95}
              innerRadius={45}
              paddingAngle={3}
              label={({ name, percent }) =>
                `${name} ${(percent! * 100).toFixed(0)}%`
              }
            >
              {inventoryData.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />

            <Legend verticalAlign="bottom" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InventoryChart;