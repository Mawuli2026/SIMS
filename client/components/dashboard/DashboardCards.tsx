import StatCard from "./StatCard";
import {
  HiCash,
  HiCube,
  HiCurrencyDollar,
  HiExclamationCircle,
} from "react-icons/hi";

const DashboardCards = () => {
  const stats = [
    {
      title: "",
      value: "$1,250",
      subtitle: "+15% from yesterday",
      icon: <HiCash />,
      color: "green" as const,
    },
    {
      title: "Total Products",
      value: 245,
      subtitle: "Products in inventory",
      icon: <HiCube />,
      color: "blue" as const,
    },
    {
      title: "Inventory Value",
      value: "$15,000",
      subtitle: "Current stock value",
      icon: <HiCurrencyDollar />,
      color: "orange" as const,
    },
    {
      title: "Low Stock",
      value: 12,
      subtitle: "Needs attention",
      icon: <HiExclamationCircle />,
      color: "red" as const,
    },
  ];

  return (
    <section className="mb-8">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>
    </section>
  );
};

export default DashboardCards;