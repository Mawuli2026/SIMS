import { HiExclamationCircle } from "react-icons/hi";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal = ({
  isOpen,
  title,
  message,
  itemName,
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <HiExclamationCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {title}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {message}
              </p>
            </div>
          </div>

          {itemName && (
            <div className="mt-4 rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-800">
                <strong>Item:</strong> {itemName}
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              onClick={onConfirm}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;