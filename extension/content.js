let detectedFields = [];
let generatedAnswers = {};

function getLabelForField(field) {
  const id = field.id;
  const name = field.name;
  const placeholder = field.placeholder;

  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.innerText.trim();
  }

  const parentText = field.closest("label")?.innerText;
  if (parentText) return parentText.trim();

  if (placeholder) return placeholder.trim();
  if (name) return name.trim();
  if (id) return id.trim();

  return "Unknown field";
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scanFields") {
    const fields = Array.from(
      document.querySelectorAll("input, textarea")
    ).filter((field) => {
      const type = field.getAttribute("type");
      return (
        !["hidden", "password", "submit", "button", "checkbox", "radio"].includes(type)
      );
    });

    detectedFields = fields.map((field, index) => ({
      index,
      question: getLabelForField(field),
      tag: field.tagName,
      type: field.getAttribute("type") || "text"
    }));

    sendResponse({
      fields: detectedFields
    });
  }

  if (request.action === "fillFields") {
    generatedAnswers = request.answers || {};

    const fields = Array.from(
      document.querySelectorAll("input, textarea")
    ).filter((field) => {
      const type = field.getAttribute("type");
      return (
        !["hidden", "password", "submit", "button", "checkbox", "radio"].includes(type)
      );
    });

    fields.forEach((field) => {
      const question = getLabelForField(field).toLowerCase();

      Object.entries(generatedAnswers).forEach(([key, value]) => {
        const normalizedKey = key.replaceAll("_", " ").toLowerCase();

        if (
          question.includes(normalizedKey) ||
          normalizedKey.includes(question) ||
          question.includes("tell us about yourself") ||
          question.includes("why are you interested") ||
          question.includes("why this role") ||
          question.includes("why should we hire")
        ) {
          field.value = value;
          field.dispatchEvent(new Event("input", { bubbles: true }));
          field.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });

    sendResponse({
      success: true
    });
  }

  return true;
});