const output = document.getElementById("output");
const scanBtn = document.getElementById("scanBtn");
const fillBtn = document.getElementById("fillBtn");

let generatedAnswers = {};

scanBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  chrome.tabs.sendMessage(
    tab.id,
    { action: "scanFields" },
    async (response) => {
      if (!response || !response.fields) {
        output.textContent = "No fields found on this page.";
        return;
      }

      output.textContent = "Detected fields:\n\n" + JSON.stringify(response.fields, null, 2);

      const questions = response.fields.map((field) => field.question).join("\n");

      const backendResponse = await fetch("http://localhost:8000/api/autofill/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resume_text: localStorage.getItem("resumeText") || "Resume not available from extension.",
          company: "Target Company",
          role: "Target Role",
          job_description: questions,
          career_goal: "Generate answers for detected job application fields."
        })
      });

      generatedAnswers = await backendResponse.json();

      output.textContent =
        "Generated answers:\n\n" + JSON.stringify(generatedAnswers, null, 2);
    }
  );
});

fillBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  chrome.tabs.sendMessage(
    tab.id,
    {
      action: "fillFields",
      answers: generatedAnswers
    },
    (response) => {
      if (response?.success) {
        output.textContent = "Fields filled successfully. Please review before submitting.";
      } else {
        output.textContent = "Could not fill fields.";
      }
    }
  );
});