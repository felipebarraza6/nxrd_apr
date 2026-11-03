import ResetPasswordPage from "../../../../reset-password/[token]/reset-password-client";

// El correo de recuperación apunta a /login/<slug>/reset-password/<token>.
// El token real se lee en el cliente (puede venir URL-encoded).
export function generateStaticParams() {
  return [{ slug: "__", token: "__" }];
}

export default function Page() {
  return <ResetPasswordPage />;
}
