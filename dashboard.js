const N8N_WEBHOOK_URL = "http://localhost:5678/webhook-test/e8756615-e05e-45fb-b0b3-e6a834413916";
import { db } from "./firebase.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ========== UI helpers ==========

// Simple single-line text input creator
function createInput(placeholder) {
  const wrapper = document.createElement("div");
  wrapper.className = "mb-2";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholder;
  input.className = "w-full p-2 border rounded";
  input.setAttribute("aria-label", placeholder);

  wrapper.appendChild(input);
  // Return wrapper so addSectionHandler can append consistent blocks
  return wrapper;
}

// Description textarea with AI button placed inside bottom-right
function createDescriptionInput(placeholder) {
  const wrapper = document.createElement("div");
  wrapper.className = "relative mb-2";

  // Label for accessibility (optional but good)
  const label = document.createElement("label");
  label.className = "sr-only";
  label.textContent = placeholder;

  const textarea = document.createElement("textarea");
  textarea.placeholder = placeholder;
  textarea.rows = 4;
  textarea.className = "w-full p-2 pr-28 border rounded resize-y";
  textarea.style.boxSizing = "border-box";
  textarea.setAttribute("aria-label", placeholder);

  // AI button inside bottom-right corner
  const aiBtn = document.createElement("button");
  aiBtn.type = "button";
  aiBtn.innerHTML = 'Enhance with AI ✨';
  aiBtn.className = "absolute bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-1 rounded shadow";
  aiBtn.style.right = "15px";
  aiBtn.style.bottom = "15px";
  aiBtn.style.cursor = "pointer";

  // Small feedback area
  const feedback = document.createElement("div");
  feedback.className = "mt-2 text-sm text-gray-600 hidden";

  // AI click handler (dev-mode: no auth required)
  aiBtn.addEventListener("click", async function () {
    const agree = confirm("Send this text to an AI agent for enhancement? (Emails and phone numbers will be redacted)");
    if (!agree) return;

    const originalLabel = aiBtn.innerHTML;
    aiBtn.disabled = true;
    aiBtn.textContent = "Thinking...";

    feedback.classList.add("hidden");
    feedback.textContent = "";

    console.log("AI button clicked, calling n8n...");

    try {
      // callN8nEnhance handles parsing and returns a string (or throws)
      const enhanced = await callN8nEnhance(textarea.value, null); // pass null token in dev mode
      if (enhanced && typeof enhanced === "string") {
        textarea.value = enhanced;
        feedback.textContent = "AI suggestion applied.";
      } else {
        feedback.textContent = "No suggestion returned.";
      }
    } catch (err) {
      console.error("AI error:", err);
      feedback.textContent = "AI enhancement failed. See console.";
    } finally {
      feedback.classList.remove("hidden");
      setTimeout(() => feedback.classList.add("hidden"), 2500);
      aiBtn.disabled = false;
      aiBtn.innerHTML = originalLabel;
    }
  });

  wrapper.appendChild(label);
  wrapper.appendChild(textarea);
  wrapper.appendChild(aiBtn);
  wrapper.appendChild(feedback);

  // Expose inner input for data collection convenience
  wrapper._innerInput = textarea;
  return wrapper;
}

// File upload with preview (keeps Base64 in DOM for prototype)
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

    // Use file.size to enforce size limit
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
      // For PDFs we only keep the filename in this prototype
      container.setAttribute("data-file-name", file.name);
    }
  });

  container.appendChild(customButton);
  container.appendChild(fileInput);
  container.appendChild(fileNameDisplay);

  return fileInput;
}

// ========== Section creation ==========

function addSectionHandler(buttonId, containerId, fields) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  btn.addEventListener("click", function () {
    const container = document.getElementById(containerId);
    const div = document.createElement("div");
    div.className = "mb-4 p-4 border rounded bg-white shadow";

    fields.forEach(function (placeholder) {
      if (/description/i.test(placeholder)) {
        // create description textarea with AI button for "Description" fields
        div.appendChild(createDescriptionInput(placeholder));
      } else {
        div.appendChild(createInput(placeholder));
      }
    });

    div.appendChild(createFileInput(div));
    container.appendChild(div);
  });
}

// Register sections (keeps your UI)
addSectionHandler("addProjectBtn", "projectsContainer", ["Project Title", "Project Description", "Project Link (optional)"]);
addSectionHandler("addHackathonBtn", "hackathonsContainer", ["Hackathon Name", "Role/Description", "Link (optional)"]);
addSectionHandler("addAchievementBtn", "achievementsContainer", ["Achievement Title", "Description"]);
addSectionHandler("addCertificationBtn", "certificationsContainer", ["Certification Title", "Description", "Link (optional)"]);

// ========== Mobile menu toggle (same as before) ==========
const bars = document.getElementById("menu-btn");
const options = document.getElementById("options");
let menuOpen = false;
if (bars) {
  bars.addEventListener("click", function () {
    if (!menuOpen) {
      const links = [
        { text: "Home", href: "index.html" },
        { text: "About", href: "#" },
        { text: "Profile", href: "#" },
        { text: "Contact", href: "#" }
      ];
      links.forEach(function (linkData) {
        const a = document.createElement("a");
        a.textContent = linkData.text;
        a.href = linkData.href;
        a.className = "block text-gray-800 hover:text-green-600 font-medium p-2 link-item";
        options.appendChild(a);
      });
      menuOpen = true;
    } else {
      document.querySelectorAll(".link-item").forEach(function (link) { link.remove(); });
      menuOpen = false;
    }
  });
}

// ========== Save logic ==========

document.addEventListener("DOMContentLoaded", function () {
  console.log("dashboard.js loaded ✅");

  const saveBtn = document.getElementById("saveBtn");
  if (!saveBtn) {
    alert("Save button not found. Add element with id='saveBtn'");
    return;
  }

  saveBtn.addEventListener("click", async function () {
    console.log("Save button pressed");

    const dashboardData = {
      name: (document.getElementById("nameInput") && document.getElementById("nameInput").value) || "",
      socials: {
        linkedin: (document.getElementById("linkedinInput") && document.getElementById("linkedinInput").value) || "",
        github: (document.getElementById("githubInput") && document.getElementById("githubInput").value) || "",
        instagram: (document.getElementById("instagramInput") && document.getElementById("instagramInput").value) || ""
      },
      projects: [],
      hackathons: [],
      achievements: [],
      certifications: [],
      updatedAt: serverTimestamp()
    };

    // helper to read container items (collects <input> and <textarea>)
    function collectFrom(containerSelector, mapper) {
      const out = [];
      const container = document.querySelector(containerSelector);
      if (!container) return out;
      container.querySelectorAll(":scope > div").forEach(function (div) {
        const inputs = div.querySelectorAll("input[type='text'], textarea");
        // convert NodeList to array for safety
        const arr = Array.prototype.slice.call(inputs);
        out.push(mapper(arr, div));
      });
      return out;
    }

    // Projects
    dashboardData.projects = collectFrom("#projectsContainer", function (inputs, div) {
      return {
        title: inputs[0] ? inputs[0].value : "",
        description: inputs[1] ? inputs[1].value : "",
        link: inputs[2] ? inputs[2].value : "",
        imageSrc: div.getAttribute("data-image") || ""
      };
    });

    // Hackathons
    dashboardData.hackathons = collectFrom("#hackathonsContainer", function (inputs) {
      return {
        name: inputs[0] ? inputs[0].value : "",
        role: inputs[1] ? inputs[1].value : "",
        link: inputs[2] ? inputs[2].value : ""
      };
    });

    // Achievements
    dashboardData.achievements = collectFrom("#achievementsContainer", function (inputs) {
      return {
        title: inputs[0] ? inputs[0].value : "",
        description: inputs[1] ? inputs[1].value : ""
      };
    });

    // Certifications
    dashboardData.certifications = collectFrom("#certificationsContainer", function (inputs, div) {
      return {
        title: inputs[0] ? inputs[0].value : "",
        description: inputs[1] ? inputs[1].value : "",
        link: inputs[2] ? inputs[2].value : "",
        imageSrc: div.getAttribute("data-image") || ""
      };
    });

    console.log("Saving to Firestore:", dashboardData);

    // disable while saving
    saveBtn.disabled = true;
    const oldText = saveBtn.textContent;
    saveBtn.textContent = "Saving...";

    try {
      // Dev-mode: write to a single doc. Change to per-user doc when adding Auth.
      await setDoc(doc(db, "dashboards", "user_dashboard"), dashboardData);
      alert("Dashboard saved successfully!");
      // go to display page
      window.location.href = "display.html";
    } catch (err) {
      console.error("Error saving dashboard:", err);
      alert("Error saving dashboard. Check console for details.");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = oldText;
    }
  });
});

// ========== callN8nEnhance - robust parsing ==========
async function callN8nEnhance(text, idToken) {
  // redact emails and phone numbers (simple conservative approach)
  const payloadText = (text || "")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi, "[email]")
    .replace(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g, "[phone]");

  const body = { input_text: payloadText, source: "bragboard.dashboard" };
  console.log("Calling n8n webhook:", N8N_WEBHOOK_URL, "payload:", body);

  const controller = new AbortController();
  const timeoutMs = 25000; // 25s
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = "Bearer " + idToken;

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timer);

    const raw = await res.text();
    console.log("n8n raw response:", raw);

    if (!res.ok) {
      throw new Error("n8n returned error " + res.status + ": " + raw.slice(0, 1000));
    }

    // try parse top-level JSON
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }

    // deep search helper to extract a usable string
    function findStringDeep(obj) {
      if (!obj && obj !== "") return null;
      if (typeof obj === "string") {
        const s = obj.trim();
        return s.length ? s : null;
      }
      if (Array.isArray(obj)) {
        for (const it of obj) {
          const s = findStringDeep(it);
          if (s) return s;
        }
        return null;
      }
      if (typeof obj === "object") {
        // direct fields we expect
        if (typeof obj.enhanced_description === "string" && obj.enhanced_description.trim()) return obj.enhanced_description;
        if (typeof obj.suggestion === "string" && obj.suggestion.trim()) return obj.suggestion;
        if (typeof obj.output === "string" && obj.output.trim()) {
          // output can be a JSON string; try parsing it
          try {
            const inner = JSON.parse(obj.output);
            const innerFound = findStringDeep(inner);
            if (innerFound) return innerFound;
          } catch (e) {
            // not JSON — return raw output
            return obj.output.trim();
          }
        }
        // otherwise iterate keys
        for (const k in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, k)) {
            const s = findStringDeep(obj[k]);
            if (s) return s;
          }
        }
      }
      return null;
    }

    const result = findStringDeep(parsed);

    if (result && result.length) return result;

    // fallback: if raw is short and non-empty, return it
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
    clearTimeout(timer);
  }
}
