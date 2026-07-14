import { ReactNode } from "react";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: "blue" | "green" | "orange" | "red";
  subtitle?: string;
}

const colorStyles = {
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-600",
    border: "border-green-200",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    border: "border-orange-200",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-600",
    border: "border-red-200",
  },
};

const StatCard = ({
  title,
  value,
  icon,
  color = "blue",
  subtitle,
}: StatCardProps) => {
  const style = colorStyles[color];

  return (
    <div
      className={`
        bg-white
        rounded-xl
        border
        ${style.border}
        shadow-sm
        hover:shadow-lg
        transition-all
        duration-300
        p-6
      `}
    >
      <div className="flex items-center justify-between">
        {/* Text */}
        <div>
          <p className="text-sm text-gray-500 font-medium">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-800">
            {value}
          </h2>

          {subtitle && (
            <p className="mt-2 text-sm text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Icon */}
        <div
          className={`
            h-14
            w-14
            rounded-full
            flex
            items-center
            justify-center
            ${style.bg}
            ${style.text}
          `}
        >
          <div className="text-3xl">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;