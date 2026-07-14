import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export interface ProfitTrendData {
  period: string;
  revenue: number;
  cost: number;
  profit: number;
}

interface ProfitTrendChartProps {
  data: ProfitTrendData[];
}

const ProfitTrendChart = ({
  data,
}: ProfitTrendChartProps) => {

  const totalProfit = data.reduce(
    (sum, item) => sum + item.profit,
    0
  );

  return (

    <div className="rounded-xl border bg-white p-6 shadow">

      <div className="mb-5 flex items-center justify-between">

        <div>

          <h2 className="text-xl font-semibold">

            Profit Trend

          </h2>

          <p className="text-sm text-gray-500">

            Revenue, cost and profit over time

          </p>

        </div>

        <div className="text-right">

          <p className="text-sm text-gray-500">

            Total Profit

          </p>

          <p className="text-2xl font-bold text-green-600">

            ${totalProfit.toFixed(2)}

          </p>

        </div>

      </div>

      <ResponsiveContainer
        width="100%"
        height={380}
      >

        <AreaChart data={data}>

          <defs>

            <linearGradient
              id="profitGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >

              <stop
                offset="5%"
                stopColor="#16a34a"
                stopOpacity={0.8}
              />

              <stop
                offset="95%"
                stopColor="#16a34a"
                stopOpacity={0}
              />

            </linearGradient>

          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="period"
          />

          <YAxis />

          <Tooltip
            formatter={(value: number, name: string) => {

              return [
                `$${value.toFixed(2)}`,
                name.charAt(0).toUpperCase() +
                  name.slice(1),
              ];

            }}
          />

          <Area
            type="monotone"
            dataKey="profit"
            stroke="#16a34a"
            strokeWidth={3}
            fill="url(#profitGradient)"
          />

        </AreaChart>

      </ResponsiveContainer>

    </div>

  );

};

export default ProfitTrendChart;