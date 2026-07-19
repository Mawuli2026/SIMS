interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  type?: "primary" | "success" | "warning" | "danger" | "info";
}

const DashboardCard = ({
  title,
  value,
  subtitle,
  type = "primary",
}: DashboardCardProps) => {
  return (
    <div className={`dashboard-card dashboard-card-${type}`}>
      <p>{title}</p>
      <h3>{value}</h3>

      {subtitle && <span>{subtitle}</span>}
    </div>
  );
};

export default DashboardCard;
