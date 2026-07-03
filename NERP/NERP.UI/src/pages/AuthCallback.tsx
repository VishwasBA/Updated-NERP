import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";

export default function AuthCallback() {
  const { instance } = useMsal();

  useEffect(() => {
    instance.handleRedirectPromise().then((response) => {
      if (response) {
        console.log("Login success:", response);
      }
    });
  }, [instance]);

  return <div>Logging you in...</div>;
}