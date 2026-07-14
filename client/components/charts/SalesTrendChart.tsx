import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export interface SalesTrendData {
  period: string;
  sales: number;
}

interface SalesTrendChartProps {
  data: SalesTrendData[];
}

const SalesTrendChart = ({
  data,
}: SalesTrendChartProps) => {

  return (

    <div className="rounded-xl border bg-white p-6 shadow">

      <div className="mb-5">

        <h2 className="text-xl font-semibold">

          Sales Trend

        </h2>

        <p className="text-sm text-gray-500">

          Daily / Weekly / Monthly Sales

        </p>

      </div>

      <ResponsiveContainer
        width="100%"
        height={350}
      >

        <LineChart data={data}>

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="period"
          />

          <YAxis />

          <Tooltip
            formatter={(value:number)=>
              [`$${value.toFixed(2)}`, "Sales"]
            }
          />

          <Line
            type="monotone"
            dataKey="sales"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 5 }}
            activeDot={{ r: 7 }}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

};

export default SalesTrendChart;