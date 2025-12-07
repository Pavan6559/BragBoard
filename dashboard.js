const N8N_WEBHOOK_URL = "http://localhost:5678/webhook-test/e8756615-e05e-45fb-b0b3-e6a834413916"; 
// Firebase imports (expects firebase.js to export `db`)
import { db } from "./firebase.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ======= Helpers & UI builders =======

// Simple text input (kept similar to your version)
function createInput(placeholder) {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholder;
  input.className = "w-full p-2 border rounded mt-2";
  return input;
}

// Your updated description builder (textarea + AI button bottom-right)
// I kept your exact UI classes and placement adjustments.
function createDescriptionInput(placeholder) {
  // Wrapper so button can be placed inside using absolute positioning
  const wrapper = document.createElement("div");
  wrapper.className = "relative mt-2";

  // Create textarea
  const textarea = document.createElement("textarea");
  textarea.placeholder = placeholder;
  textarea.rows = 4;
  textarea.className = "w-full p-2 pr-28 border rounded resize-y";
  textarea.style.boxSizing = "border-box";

  // AI button inside bottom-right
  const aiBtn = document.createElement("button");
  aiBtn.type = "button";
  aiBtn.innerHTML = 'Enhance with AI ✨';
  aiBtn.className = "absolute bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-1 rounded shadow";
  aiBtn.style.right = "15px";
  aiBtn.style.bottom = "15px";
  aiBtn.style.cursor = "pointer";

  // Feedback area
  const feedback = document.createElement("div");
  feedback.className = "mt-1 text-sm text-gray-600 hidden";

  aiBtn.addEventListener("click", async function () {
    // Consent before sending
    const agree = confirm("Send this text to an AI agent for enhancement? Text will be redacted for emails/phones automatically.");
    if (!agree) return;

    const originalLabel = aiBtn.innerHTML;
    aiBtn.disabled = true;
    aiBtn.textContent = "Thinking...";

    feedback.classList.add("hidden");
    feedback.textContent = "";

    console.log("aibtn event listener is working");

    try {
      // Call the webhook without token (dev mode). Replace null with idToken if you add auth.
      const enhanced = await callN8nEnhance(textarea.value, null);

      if (enhanced && typeof enhanced === "string") {
        textarea.value = enhanced;
        feedback.textContent = "AI suggestion applied.";
      } else {
        feedback.textContent = "No suggestion returned.";
      }
    } catch (err) {
      console.error("AI error:", err);
      feedback.textContent = "AI enhancement failed. Check console.";
    } finally {
      feedback.classList.remove("hidden");
      setTimeout(() => feedback.classList.add("hidden"), 2500);
      aiBtn.disabled = false;
      aiBtn.innerHTML = originalLabel;
    }
  });

  wrapper.appendChild(textarea);
  wrapper.appendChild(aiBtn);
  wrapper.appendChild(feedback);
  wrapper._innerInput = textarea;
  return wrapper;
}

// Simple file input with small preview. Keeps Base64 in DOM for this prototype.
function createFileInput(container) {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".pdf,image/*";
  fileInput.className = "hidden";

  const customButton = document.createElement("button");
  customButton.type = "button";
  customButton.textContent = "Upload PDF or Image";
  customButton.className = "bg-green-400 hover:bg-green-500 text-white font-medium px-4 py-2 rounded cursor-pointer mt-2";

  const fileNameDisplay = document.createElement("p");
  fileNameDisplay.className = "mt-2 text-sm text-gray-700";

  customButton.addEventListener("click", function () {
    fileInput.click();
  });

  fileInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    fileNameDisplay.textContent = `Selected: ${file.name}`;

    // check size (use file.size)
    if (file.size > 300 * 1024) {
      alert("File too large. Max 300KB for this demo.");
      fileNameDisplay.textContent = "Upload failed: file too large";
      return;
    }

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function () {
        const base64 = reader.result;
        container.setAttribute("data-image", base64);

        const existing = container.querySelector("img");
        if (existing) existing.remove();

        const imgPreview = document.createElement("img");
        imgPreview.src = base64;
        imgPreview.className = "mt-2 max-h-40 rounded";
        container.appendChild(imgPreview);
      };
      reader.readAsDataURL(file);
    } else {
      // for non-image (pdf) we only save the name here
      container.setAttribute("data-file-name", file.name);
    }
  });

  container.appendChild(customButton);
  container.appendChild(fileInput);
  container.appendChild(fileNameDisplay);

  return fileInput;
}

// ======= Section creation logic =======

function addSectionHandler(buttonId, containerId, fields) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  btn.addEventListener("click", function () {
    const container = document.getElementById(containerId);
    const card = document.createElement("div");
    card.className = "mb-4 p-4 border rounded bg-white shadow";

    // create fields
    fields.forEach(function (placeholder) {
      // treat any field with "description" as the special textarea with AI button
      if (/description/i.test(placeholder)) {
        card.appendChild(createDescriptionInput(placeholder));
      } else {
        card.appendChild(createInput(placeholder));
      }
    });

    // file input
    card.appendChild(createFileInput(card));

    container.appendChild(card);
  });
}

// register handlers (same as your UI)
addSectionHandler("addProjectBtn", "projectsContainer", ["Project Title", "Project Description", "Project Link (optional)"]);
addSectionHandler("addHackathonBtn", "hackathonsContainer", ["Hackathon Name", "Role/Description", "Link (optional)"]);
addSectionHandler("addAchievementBtn", "achievementsContainer", ["Achievement Title", "Description"]);
addSectionHandler("addCertificationBtn", "certificationsContainer", ["Certification Title", "Description", "Link (optional)"]);

// ======= Save logic =======

document.addEventListener("DOMContentLoaded", function () {
  console.log("dashboard.js loaded ✅");

  const saveBtn = document.getElementById("saveBtn");
  if (!saveBtn) {
    alert("Save button not found. Check your HTML.");
    return;
  }

  saveBtn.addEventListener("click", async function () {
    console.log("Save button pressed");

    // Build dashboardData by reading DOM
    const dashboardData = {
      name: document.getElementById("nameInput") ? document.getElementById("nameInput").value : "",
      socials: {
        linkedin: document.getElementById("linkedinInput") ? document.getElementById("linkedinInput").value : "",
        github: document.getElementById("githubInput") ? document.getElementById("githubInput").value : "",
        instagram: document.getElementById("instagramInput") ? document.getElementById("instagramInput").value : ""
      },
      projects: [],
      hackathons: [],
      achievements: [],
      certifications: [],
      updatedAt: serverTimestamp()
    };

    // Helper: read items from a container
    function readContainer(containerSelector, mapper) {
      const arr = [];
      const container = document.querySelector(containerSelector);
      if (!container) return arr;
      container.querySelectorAll(":scope > div").forEach(function (div) {
        const inputs = div.querySelectorAll("input[type='text'], textarea");
        arr.push(mapper(inputs, div));
      });
      return arr;
    }

    // Projects
    dashboardData.projects = readContainer("#projectsContainer", function (inputs, div) {
      return {
        title: inputs[0] ? inputs[0].value : "",
        description: inputs[1] ? inputs[1].value : "",
        link: inputs[2] ? inputs[2].value : "",
        imageSrc: div.getAttribute("data-image") || ""
      };
    });

    // Hackathons
    dashboardData.hackathons = readContainer("#hackathonsContainer", function (inputs, div) {
      return {
        name: inputs[0] ? inputs[0].value : "",
        role: inputs[1] ? inputs[1].value : "",
        link: inputs[2] ? inputs[2].value : ""
      };
    });

    // Achievements
    dashboardData.achievements = readContainer("#achievementsContainer", function (inputs, div) {
      return {
        title: inputs[0] ? inputs[0].value : "",
        description: inputs[1] ? inputs[1].value : ""
      };
    });

    // Certifications
    dashboardData.certifications = readContainer("#certificationsContainer", function (inputs, div) {
      return {
        title: inputs[0] ? inputs[0].value : "",
        description: inputs[1] ? inputs[1].value : "",
        link: inputs[2] ? inputs[2].value : "",
        imageSrc: div.getAttribute("data-image") || ""
      };
    });

    console.log("Saving to Firestore:", dashboardData);

    // disable save while working
    saveBtn.disabled = true;
    const oldText = saveBtn.textContent;
    saveBtn.textContent = "Saving...";

    try {
      // Dev-mode save to a single document. Change to per-user doc later.
      await setDoc(doc(db, "dashboards", "user_dashboard"), dashboardData);
      alert("Dashboard saved successfully!");
      // Optional: redirect to display page
      // window.location.href = "display.html";
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      alert("Error saving dashboard. Check console for details.");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = oldText;
    }
  });
});

// ======= callN8nEnhance - robust parser for your n8n output =======
// This handles cases where n8n returns an array and an 'output' field
// containing a JSON string with `enhanced_description`.
async function callN8nEnhance(text, idToken) {
  // redact simple PII
  const payloadText = (text || "")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi, "[email]")
    .replace(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g, "[phone]");

  const body = { input_text: payloadText, source: "bragboard.dashboard" };
  console.log("Calling n8n with:", body);

  const controller = new AbortController();
  const timeoutMs = 25000;
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = { "Content-Type": "application/json" };
    // idToken may be null for dev mode; only include header if provided
    if (idToken) headers["Authorization"] = "Bearer " + idToken;

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(t);

    const raw = await res.text();
    console.log("n8n raw response:", raw);

    if (!res.ok) {
      throw new Error("n8n returned error " + res.status + ": " + raw.slice(0, 1000));
    }

    // Try parse top-level JSON
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }

    // Deep extraction helper to find a useful string result
    function findStringDeep(o) {
      if (!o) return null;
      if (typeof o === "string") return o;
      if (Array.isArray(o)) {
        for (const item of o) {
          const s = findStringDeep(item);
          if (s) return s;
        }
        return null;
      }
      if (typeof o === "object") {
        // direct fields we care about
        if (o.enhanced_description && typeof o.enhanced_description === "string") return o.enhanced_description;
        if (o.suggestion && typeof o.suggestion === "string") return o.suggestion;
        if (o.output && typeof o.output === "string") {
          // `output` may be a JSON string: try parsing it
          try {
            const inner = JSON.parse(o.output);
            if (inner.enhanced_description) return inner.enhanced_description;
            if (inner.suggestion) return inner.suggestion;
            // otherwise deep search inner
            const s = findStringDeep(inner);
            if (s) return s;
          } catch (e) {
            // not JSON, return raw output if it's a non-empty string
            if (o.output.trim().length > 0) return o.output.trim();
          }
        }
        // iterate keys
        for (const k in o) {
          const s = findStringDeep(o[k]);
          if (s) return s;
        }
      }
      return null;
    }

    const resultString = findStringDeep(parsed);

    if (resultString && resultString.length > 0) {
      return resultString;
    }

    // Fallback: if raw is short and meaningful, return it
    const trimmed = raw.trim();
    if (!parsed && trimmed.length > 0 && trimmed.length < 20000) return trimmed;

    throw new Error("No suggestion-like field found in n8n response.");
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("AI request timed out");
    }
    console.error("callN8nEnhance error:", err);
    throw err;
  } finally {
    clearTimeout(t);
  }
}
