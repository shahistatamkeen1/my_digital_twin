const API_URL = "http://localhost:8000";
const API_PREFIX = "/api/v1";

const output = document.getElementById("output");
const scanBtn = document.getElementById("scanBtn");
const fillBtn = document.getElementById("fillBtn");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authStatus = document.getElementById("authStatus");

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const roleInput = document.getElementById("roleInput");
const careerGoalInput = document.getElementById("careerGoalInput");
const resumeInput = document.getElementById("resumeInput");

let generatedAnswers = [];
let accessToken = "";

function updateAuthStatus() {
  authStatus.textContent = accessToken
    ? "Signed in. The extension can call protected Digital Twin APIs."
    : "Not signed in.";
}

chrome.storage.local.get(
  ["resumeText", "careerGoal", "targetRole"],
  (data) => {
    roleInput.value = data.targetRole || "";
    careerGoalInput.value = data.careerGoal || "";
    resumeInput.value = data.resumeText || "";
  }
);

chrome.storage.session.get(["mdtAccessToken"], (data) => {
  accessToken = data.mdtAccessToken || "";
  updateAuthStatus();
});

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    output.textContent = "Enter your Digital Twin email and password.";
    return;
  }

  loginBtn.disabled = true;
  output.textContent = "Signing in...";

  try {
    const response = await fetch(`${API_URL}${API_PREFIX}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.access_token) {
      throw new Error(data.detail || "The extension could not sign in.");
    }

    accessToken = data.access_token;
    await chrome.storage.session.set({ mdtAccessToken: accessToken });
    passwordInput.value = "";
    updateAuthStatus();
    output.textContent = "Extension authentication completed.";
  } catch (error) {
    accessToken = "";
    await chrome.storage.session.remove("mdtAccessToken");
    updateAuthStatus();
    output.textContent = error.message || "The extension could not sign in.";
  } finally {
    loginBtn.disabled = false;
  }
});

logoutBtn.addEventListener("click", async () => {
  accessToken = "";
  await chrome.storage.session.remove("mdtAccessToken");
  updateAuthStatus();
  output.textContent = "Extension session cleared.";
});

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
  if (!accessToken) {
    output.textContent = "Sign in to the extension before generating answers.";
    return;
  }

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
            `${API_URL}${API_PREFIX}/autofill/custom`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
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

          if (backendResponse.status === 401) {
            accessToken = "";
            await chrome.storage.session.remove("mdtAccessToken");
            updateAuthStatus();
            throw new Error(
              "Your extension session expired. Sign in again and retry."
            );
          }

          if (!backendResponse.ok) {
            throw new Error(data.detail || "The backend request failed.");
          }

          generatedAnswers = data.answers || [];

          output.textContent =
            "Generated custom answers:\n\n" +
            JSON.stringify(generatedAnswers, null, 2);
        } catch (error) {
          output.textContent =
            error.message ||
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
    () => {
      if (chrome.runtime.lastError) {
        output.textContent =
          "Could not connect to this page. Refresh the page and try again.";
      }
    }
  );
});
