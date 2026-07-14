import { useState } from "react";

interface RefundDialogProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const RefundDialog = ({
  title,
  isOpen,
  onClose,
  onConfirm,
}: RefundDialogProps) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert("Please enter a reason.");
      return;
    }

    onConfirm(reason);

    setReason("");

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

        <h2 className="mb-4 text-xl font-bold">
          {title}
        </h2>

        <textarea
          rows={5}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason..."
          className="w-full rounded-lg border p-3"
        />

        <div className="mt-6 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-white"
          >
            Confirm
          </button>

        </div>

      </div>

    </div>
  );
};

export default RefundDialog;