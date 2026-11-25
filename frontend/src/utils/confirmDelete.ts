import Swal from "sweetalert2";

export const confirmDelete = async (
  message = "คุณต้องการลบรายการนี้ใช่หรือไม่?"
) => {
  const result = await Swal.fire({
    title: "คุณแน่ใจหรือไม่?",
    text: message,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "ใช่, ลบเลย!",
    cancelButtonText: "ยกเลิก",
  });

  return result.isConfirmed;
};

export const showSuccess = (message = "ลบข้อมูลสำเร็จ!") => {
  return Swal.fire({
    title: message,
    icon: "success",
  });
};

export const showSuccessOk = (message = "ลบข้อมูลสำเร็จ!") => {
  return Swal.fire({
    title: message,
    icon: "success",
    showConfirmButton: false,
    timer: 700,
  });
};

export const showError = (message = "ไม่สามารถลบข้อมูลได้") => {
  return Swal.fire({
    title: "เกิดข้อผิดพลาด",
    text: message,
    icon: "error",
  });
};
