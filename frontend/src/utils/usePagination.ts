// utils/usePagination.ts
import { useEffect, useState } from "react";

type Options = {
  initialRowsPerPage?: number;
  storageKey?: string; // ใส่คีย์เพื่อจำ page/rpp ข้ามหน้า
};

export const usePagination = (options: Options = {}) => {
  const { initialRowsPerPage = 10, storageKey } = options;

  const read = <T>(k: string, fallback: T): T => {
    try {
      const v = sessionStorage.getItem(k);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  };

  const [page, setPage] = useState<number>(() =>
    storageKey ? read<number>(`${storageKey}:page`, 0) : 0
  );

  const [rowsPerPage, setRowsPerPage] = useState<number>(() =>
    storageKey
      ? read<number>(`${storageKey}:rpp`, initialRowsPerPage)
      : initialRowsPerPage
  );

  // persist
  useEffect(() => {
    if (!storageKey) return;
    sessionStorage.setItem(`${storageKey}:page`, JSON.stringify(page));
  }, [page, storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    sessionStorage.setItem(`${storageKey}:rpp`, JSON.stringify(rowsPerPage));
  }, [rowsPerPage, storageKey]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newRpp = parseInt(event.target.value, 10);
    // คง “ตำแหน่ง” รายการแรกในหน้าเดิมให้ใกล้เคียงที่สุด
    const firstIndex = page * rowsPerPage;
    const newPage = Math.floor(firstIndex / newRpp);

    setRowsPerPage(newRpp);
    setPage(newPage);
  };

  return {
    page,
    rowsPerPage,
    setPage,
    setRowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
  };
};
