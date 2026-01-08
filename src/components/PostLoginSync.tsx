// src/components/PostLoginSync.tsx

import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { syncDraftProfileAfterLogin } from "@/services/profileSyncService";
import { useEffect, useRef } from "react";

export default function PostLoginSync() {
  const { user } = useAuth();
  const { refreshProfile } = useProfile();

  const didRunRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (didRunRef.current) return;
    didRunRef.current = true;

    (async () => {
      try {
        await syncDraftProfileAfterLogin(); // should no-op if no draft

        // still good to refresh once after login (optional)
        await refreshProfile();     
      } catch (e) {
        console.warn("PostLoginSync failed:", e);
      }
    })();
  }, [user, refreshProfile]);

  return null;
}
