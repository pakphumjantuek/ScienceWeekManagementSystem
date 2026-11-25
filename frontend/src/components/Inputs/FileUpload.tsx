import React, { useId } from "react";

interface FileUploadProps {
  label?: string;
  accept?: string;
  file?: File | null;
  files?: File[];
  setFile?: (file: File | null) => void;
  setFiles?: (files: File[]) => void;
  multiple?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label = "อัปโหลดไฟล์",
  accept = ".pdf,.doc,.docx,.zip,.rar",
  file,
  files = [],
  setFile,
  setFiles,
  multiple = false,
}) => {
  const inputId = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (multiple) {
      setFiles?.(Array.from(e.target.files ?? []));
      return;
    }

    setFile?.(e.target.files?.[0] || null);
  };

  const selectedLabel = multiple
    ? files.length > 0
      ? `${files.length} ไฟล์`
      : "ยังไม่ได้เลือกไฟล์"
    : file?.name || "ยังไม่ได้เลือกไฟล์";

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <label
          htmlFor={inputId}
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-sm rounded-md"
        >
          เลือกไฟล์
        </label>
        <span className="text-sm text-gray-600 truncate max-w-[200px]">
          {selectedLabel}
        </span>
      </div>
      <input
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};

export default FileUpload;
