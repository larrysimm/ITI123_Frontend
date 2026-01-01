import { useState, useEffect } from "react";
import axios from "axios";

export function useInterviewData(apiUrl, serverStatus) {
  const [questionBank, setQuestionBank] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);

  // Default values to initialize the form
  const [defaultQuestion, setDefaultQuestion] = useState("");
  const [defaultRole, setDefaultRole] = useState("Software Engineer");

  useEffect(() => {
    if (serverStatus === "ready") {
      // 1. Fetch Questions
      axios
        .get(`${apiUrl}/questions`)
        .then((res) => {
          const sorted = res.data.sort((a, b) => a.text.localeCompare(b.text));
          setQuestionBank(sorted);
          if (sorted.length > 0) setDefaultQuestion(sorted[0].text);
        })
        .catch((e) => console.error("Error fetching questions:", e));

      // 2. Fetch Roles
      axios
        .get(`${apiUrl}/roles`)
        .then((res) => {
          setAvailableRoles(res.data);
          if (res.data.length > 0) setDefaultRole(res.data[0]);
        })
        .catch((e) => console.error("Error fetching roles:", e));
    }
  }, [serverStatus, apiUrl]);

  return { questionBank, availableRoles, defaultQuestion, defaultRole };
}
