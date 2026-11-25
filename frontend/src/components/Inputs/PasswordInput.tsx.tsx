import React, { useState } from "react";
import { useField } from "formik";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface PasswordInputProps {
  label: string;
  name: string;
  placeholder?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ label, ...props }) => {
  const [field, meta] = useField(props.name);
  const [show, setShow] = useState(false);

  return (
    <div>
      <label
        className="block text-gray-700 font-medium mb-1"
        htmlFor={props.name}
      >
        {label}
      </label>
      <div className="relative">
        <input
          {...field}
          {...props}
          type={show ? "text" : "password"}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            meta.touched && meta.error
              ? "border-red-500 focus:ring-red-400"
              : "border-gray-300 focus:ring-blue-400"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 focus:outline-none"
        >
          {show ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
        </button>
      </div>
      {meta.touched && meta.error && (
        <p className="text-red-500 text-sm mt-1">{meta.error}</p>
      )}
    </div>
  );
};

export default PasswordInput;
