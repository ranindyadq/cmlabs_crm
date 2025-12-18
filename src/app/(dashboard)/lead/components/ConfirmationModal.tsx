import { FileCheck, Trash2 } from "lucide-react";

interface ConfirmationModalProps {
  open: boolean;
  type: "won" | "lost" | "delete" | "save" | null;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmationModal({
  open,
  type,
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  if (!open || !type) return null;

  const getConfig = () => {
    switch (type) {
      case "save":
        return {
          icon: <FileCheck size={32} color="white" />,
          bg: "bg-green-600",
          title: "Confirm to Save Change?",
          desc: "Press confirm if you are sure",
        };
      case "delete":
        return {
          icon: <Trash2 size={32} color="white" />,
          bg: "bg-red-600",
          title: "Delete Lead?",
          desc: "Press confirm if you are sure",
        };
      case "won":
        return {
          icon: <FileCheck size={32} color="white" />,
          bg: "bg-green-600",
          title: "Confirm to Mark as Won?",
          desc: "Press confirm if you are sure",
        };
      case "lost":
        return {
          icon: <FileCheck size={32} color="white" />,
          bg: "bg-green-600",
          title: "Confirm to Mark as Lost?",
          desc: "Press confirm if you are sure",
        };
      default:
        return null;
    }
  };

  const config = getConfig();
  if (!config) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl w-[360px] text-center shadow-lg transition-colors">
        {/* === Icon === */}
        <div className={`mx-auto mb-4 w-16 h-16 ${config.bg} rounded-full flex items-center justify-center`}>
          {config.icon}
        </div>

        {/* === Title & Description === */}
        <h3 className="text-lg font-bold text-black dark:text-white mb-2">{config.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{config.desc}</p>

        {/* === Buttons === */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="bg-[#5A4FB5] text-white font-semibold rounded-2xl px-6 py-2.5 hover:bg-[#4B42A8] transition"
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 dark:bg-gray-700 text-[#2E2E2E] dark:text-gray-200 font-semibold rounded-2xl px-6 py-2.5 hover:bg-gray-400 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}