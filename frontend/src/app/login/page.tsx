import React from "react";
import LoginPageUI from "@/components/pages/LoginPage/LoginPage";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function LoginPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LoginPageUI />
    </GoogleOAuthProvider>
  );
}
