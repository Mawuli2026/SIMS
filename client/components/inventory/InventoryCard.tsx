interface InventoryCardProps {
  title: string;
  value: string | number;
  color?: string;
}

const InventoryCard = ({
  title,
  value,
  color = "bg-blue-600",
}: InventoryCardProps) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow border">

      <div
        className={`h-2 rounded ${color} mb-4`}
      />

      <h3 className="text-gray-500 text-sm">
        {title}
      </h3>

      <h2 className="mt-2 text-3xl font-bold">
        {value}
      </h2>

    </div>
  );
};

export default InventoryCard;