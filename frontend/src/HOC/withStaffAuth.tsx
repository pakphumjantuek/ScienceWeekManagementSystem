import { jwtDecode } from "jwt-decode";

const withStaffAuth = (WrappedComponent: any) => {
  return (props: any) => {
    console.log("Staff HOC Called");

    const accessToken = localStorage.getItem("token") ?? "";

    if (accessToken) {
      const decode: {
        role: string;
      } = jwtDecode(accessToken);

      const roleLower = (decode.role || "").toLowerCase();
      const isAllowed = roleLower === "admin" || roleLower === "staff" || roleLower === "เจ้าหน้าที่";
      if (!isAllowed) {
        window.location.replace("/accessDenied");
        return null;
      }
    } else {
      window.location.replace("/login");
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withStaffAuth;
