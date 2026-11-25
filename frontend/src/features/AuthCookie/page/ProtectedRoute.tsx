import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAppSelector((s) => s.authCookies.user);
  return user ? <>{children}</> : <Navigate to="/" replace />;
}
