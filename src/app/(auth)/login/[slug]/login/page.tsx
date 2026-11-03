import { LoginInvitationRedirect } from "./login-invitation-redirect";

// Misma instancia estática que /login/[slug]: .htaccess reescribe /login/<slug>/login.
export function generateStaticParams() {
  return [{ slug: "__" }];
}

export default function Page() {
  return <LoginInvitationRedirect />;
}
