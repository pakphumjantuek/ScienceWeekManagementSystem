import React from "react";
import { useField, useFormikContext } from "formik";

interface SelectInputProps<T = string> {
  label: string;
  name: string;
  options: { value: T; label: string }[];
  className?: string;
  disabled?: boolean;
}

const SelectInput = <T extends string | number | boolean>({
  label,
  options,
  className = "",
  name,
  disabled = false,
}: SelectInputProps<T>) => {
  const [field, meta] = useField(name);
  const { setFieldValue } = useFormikContext();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;

    const option = options.find((opt) => String(opt.value) === selectedValue);

    if (option) {
      setFieldValue(name, option.value);
    } else {
      setFieldValue(name, selectedValue); // fallback
    }
  };

  return (
    <div>
      <label className="block text-gray-700 font-medium mb-1" htmlFor={name}>
        {label}
      </label>
      <select
        {...field}
        onChange={handleChange}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
          meta.touched && meta.error
            ? "border-red-500 focus:ring-red-400"
            : "border-gray-300 focus:ring-blue-400"
        } ${className}`}
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
      {meta.touched && meta.error && (
        <p className="text-red-500 text-sm mt-1">{meta.error}</p>
      )}
    </div>
  );
};

export default SelectInput;
