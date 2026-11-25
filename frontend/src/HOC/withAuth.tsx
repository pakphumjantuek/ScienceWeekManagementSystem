// withAuth.tsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const withAuth = (WrappedComponent: any) => {
  const AuthComponent = (props: any) => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      const accessToken = localStorage.getItem("token");
      if (!accessToken) {
        // ส่งทั้ง path/search/hash + state ปัจจุบัน
        const payload = {
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
          prevState: location.state, // << เก็บ state เดิมของหน้าปลายทาง
        };

        // กันพลาดกรณี refresh หรือ OAuth redirect: cache ไว้ชั่วคราว
        sessionStorage.setItem("postLoginRedirect", JSON.stringify(payload));

        navigate("/login", {
          state: payload,
          replace: true,
        });
      }
    }, [
      navigate,
      location.pathname,
      location.search,
      location.hash,
      location.state,
    ]);

    const accessToken = localStorage.getItem("token");
    if (!accessToken) return null;

    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;
