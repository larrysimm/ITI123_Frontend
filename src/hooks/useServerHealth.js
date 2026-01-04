import { useState, useEffect, useRef } from "react";
import axios from "axios";

export function useServerHealth(apiUrl, maxWaitTime = 300000) {
  const [serverStatus, setServerStatus] = useState("sleeping"); // sleeping, waking, ready, timeout
  const [elapsedTime, setElapsedTime] = useState(0);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const startTimeRef = useRef(null);

  const apiSecret = process.env.REACT_APP_BACKEND_SECRET;

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    setServerStatus("waking");
    setElapsedTime(0);
    startTimeRef.current = Date.now();

    const ping = async () => {
      if (!isMounted) return;

      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      setElapsedTime(Math.floor(elapsed / 1000));

      if (elapsed > maxWaitTime) {
        if (isMounted) setServerStatus("timeout");
        return;
      }

      try {
        const res = await axios.get(`${apiUrl}/`, {
          headers: {
            "X-Poly-Secret": apiSecret,
          },
          timeout: 5000,
        });
        if (res.data.status === "OK") {
          if (isMounted) setServerStatus("ready");
          return;
        }
      } catch (err) {
        // Ignore error and retry
      }

      if (isMounted) timeoutId = setTimeout(ping, 2000);
    };

    ping();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [retryTrigger, apiUrl, maxWaitTime]);

  return { serverStatus, elapsedTime, setRetryTrigger };
}
