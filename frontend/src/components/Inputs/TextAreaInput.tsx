import React from "react";
import { useField } from "formik";

interface TextAreaProps {
  label: string;
  name: string;
  placeholder?: string;
  className?: string;
  rows?: number;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  className = "",
  rows = 4,
  ...props
}) => {
  const [field, meta] = useField(props.name);

  return (
    <div>
      <label
        className="block text-gray-700 font-medium mb-1"
        htmlFor={props.name}
      >
        {label}
      </label>
      <textarea
        {...field}
        {...props}
        rows={rows}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
          meta.touched && meta.error
            ? "border-red-500 focus:ring-red-400"
            : "border-gray-300 focus:ring-blue-400"
        } ${className}`}
      />
      {meta.touched && meta.error && (
        <p className="text-red-500 text-sm mt-1">{meta.error}</p>
      )}
    </div>
  );
};

export default TextArea;
