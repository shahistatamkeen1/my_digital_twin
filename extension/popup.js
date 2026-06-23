const output = document.getElementById("output");
const scanBtn = document.getElementById("scanBtn");
const fillBtn = document.getElementById("fillBtn");
const saveProfileBtn = document.getElementById("saveProfileBtn");

const roleInput = document.getElementById("roleInput");
const careerGoalInput = document.getElementById("careerGoalInput");
const resumeInput = document.getElementById("resumeInput");

let generatedAnswers = {};

chrome.storage.local.get(
  ["resumeText", "careerGoal", "targetRole"],
  (data) => {
    roleInput.value = data.targetRole || "";
    careerGoalInput.value = data.careerGoal || "";
    resumeInput.value = data.resumeText || "";
  }
);

saveProfileBtn.addEventListener("click", () => {
  chrome.storage.local.set(
    {
      targetRole: roleInput.value,
      careerGoal: careerGoalInput.value,
      resumeText: resumeInput.value,
    },
    () => {
      output.textContent = "Profile saved inside extension.";
    }
  );
});

scanBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  chrome.tabs.sendMessage(tab.id, { action: "scanFields" }, async (response) => {
  if (chrome.runtime.lastError) {
    output.textContent =
      "Could not connect to this page. Refresh the page and try again. Some browser pages cannot be scanned.";
    return;
  }

    chrome.storage.local.get(
      ["resumeText", "careerGoal", "targetRole"],
      async (profile) => {
        const detectedQuestions = response.fields.map((field) => field.question);

        output.textContent =
          "Detected fields:\n\n" + JSON.stringify(detectedQuestions, null, 2);

        try {
          const backendResponse = await fetch(
            "http://localhost:8000/api/autofill/custom",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                resume_text:
                  profile.resumeText || "Resume not provided by user.",
                target_role: profile.targetRole || "Software Engineer",
                career_goal:
                  profile.careerGoal ||
                  "Generate professional job application answers.",
                detected_questions: detectedQuestions,
              }),
            }
          );

          const data = await backendResponse.json();

          generatedAnswers = data.answers || [];

          output.textContent =
            "Generated custom answers:\n\n" +
            JSON.stringify(generatedAnswers, null, 2);
        } catch (error) {
          output.textContent =
            "Could not call backend. Make sure FastAPI is running.";
        }
      }
    );
  });
});

fillBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

 chrome.tabs.sendMessage(
  tab.id,
  {
    action: "fillCustomFields",
    answers: generatedAnswers,
  },
  (response) => {
    if (chrome.runtime.lastError) {
      output.textContent =
        "Could not connect to this page. Refresh the page and try again.";
      return;
    }
    }
  );
});