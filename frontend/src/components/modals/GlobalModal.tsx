import { useModal } from "./ModalContext";

export const GlobalModal = () => {
  const { modalContent } = useModal();

  if (!modalContent) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
      <div className="relative w-full max-w-full max-h-[90vh] overflow-auto">
        <div>{modalContent}</div>
      </div>
    </div>
  );
};
