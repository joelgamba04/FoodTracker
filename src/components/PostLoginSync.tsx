// src/components/PostLoginSync.tsx

import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { syncDraftIfServerEmpty } from "@/services/profileSyncService";
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
        const result = await syncDraftIfServerEmpty();

        // 1) Always refresh from local cache first (fast + reflects promoted draft)
        await refreshProfile();

        // 2) If we updated server, refresh again from server if your refreshProfile() is server-based.
        // If refreshProfile() only reads cache, you can instead call a separate fetch-from-server method.
        // If your refreshProfile() already calls GET /user/profile, remove the first refresh.
        // For now, leave as one refresh (depends on your ProfileContext implementation).

        console.log("PostLoginSync result:", result);
      } catch (e) {
        console.warn("PostLoginSync failed:", e);
        // still try to load whatever is cached
        try {
          await refreshProfile();
        } catch {}
      }
    })();
  }, [user, refreshProfile]);

  return null;
}
