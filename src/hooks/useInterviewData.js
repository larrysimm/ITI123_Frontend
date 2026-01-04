import { useState, useEffect } from "react";
import axios from "axios";

export function useInterviewData(apiUrl, serverStatus) {
  const [questionBank, setQuestionBank] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);

  // 1. SET INITIAL DEFAULT TO "Software Engineer"
  const [defaultQuestion, setDefaultQuestion] = useState("");
  const [defaultRole, setDefaultRole] = useState("Software Engineer");

  const apiSecret = process.env.REACT_APP_BACKEND_SECRET;
  const config = {
    headers: {
      "X-Poly-Secret": apiSecret,
    },
  };

  useEffect(() => {
    if (serverStatus === "ready") {
      // --- Fetch Questions ---
      axios
        .get(`${apiUrl}/questions`, config)
        .then((res) => {
          const sorted = res.data.sort((a, b) => a.text.localeCompare(b.text));
          setQuestionBank(sorted);
          if (sorted.length > 0) setDefaultQuestion(sorted[0].text);
        })
        .catch((e) => console.error("Error fetching questions:", e));

      // --- Fetch Roles ---
      axios
        .get(`${apiUrl}/roles`, config)
        .then((res) => {
          const roles = res.data;
          setAvailableRoles(roles);

          // 2. SMART DEFAULT SELECTION
          if (roles.length > 0) {
            // Check if "Software Engineer" exists in the list
            if (roles.includes("Software Engineer")) {
              setDefaultRole("Software Engineer");
            } else {
              // If not found, fall back to the first item in the list
              setDefaultRole(roles[0]);
            }
          }
        })
        .catch((e) => console.error("Error fetching roles:", e));
    }
  }, [serverStatus, apiUrl]);

  return { questionBank, availableRoles, defaultQuestion, defaultRole };
}
