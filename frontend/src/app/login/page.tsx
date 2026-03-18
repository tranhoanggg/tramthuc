import React from "react";
import LoginPageUI from "@/components/pages/LoginPage/LoginPage";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function LoginPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  console.log("kiem_tra_client_id: ", clientId);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LoginPageUI />
    </GoogleOAuthProvider>
  );
}
