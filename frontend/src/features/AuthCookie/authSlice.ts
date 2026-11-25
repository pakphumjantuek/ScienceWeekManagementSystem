import type { UnknownAction } from "@reduxjs/toolkit";

export type User = {
  userId: string;
  email?: string | null;
  displayName?: string | null;
  roles: string[];
  profilePictureUrl?: string | null;
};

type AuthState = {
  user: User | null;
  csrfToken: string | null;
};

const initial: AuthState = { user: null, csrfToken: null };

export default function authReducer(
  state: AuthState = initial,
  action: UnknownAction
): AuthState {
  switch (action.type) {
    case "auth/setUser":
      if ("payload" in action) {
        return { ...state, user: action.payload as User | null };
      }
      return state;

    case "auth/setCsrf":
      if ("payload" in action) {
        return { ...state, csrfToken: action.payload as string | null };
      }
      return state;

    default:
      return state;
  }
}

// action creators (คงเดิม)
export const setUser = (u: User | null) =>
  ({ type: "auth/setUser", payload: u } as const);
export const setCsrfToken = (t: string | null) =>
  ({ type: "auth/setCsrf", payload: t } as const);
