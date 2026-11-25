// useFilteredData.js
import { useState, useMemo } from "react";
import { useDebounce } from "../utils/useDebounce";

const useFilteredData = (data: any, fields: string[] = [], delay = 300) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  const filteredData = useMemo(() => {
    const s = debouncedSearchTerm.toLowerCase().trim();
    if (!s) return data;

    return data?.filter((item: any) =>
      fields.some((field) => item[field]?.toString().toLowerCase().includes(s))
    );
  }, [data, fields, debouncedSearchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredData,
  };
};

export default useFilteredData;
