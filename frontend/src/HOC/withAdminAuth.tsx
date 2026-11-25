import { jwtDecode } from "jwt-decode";

const withAdminAuth = (WrappedComponent: any) => {
  return (props: any) => {
    console.log("HOC Called");

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

export default withAdminAuth;
