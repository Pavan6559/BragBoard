
import { db } from "./firebase.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
 

// 🚩 Helper: Create a styled text input
function createInput(placeholder) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.className = "w-full p-2 border rounded mt-2";
    return input;
}

// 🚩 Helper: Create custom file upload with preview (Base64 for Firestore)
function createFileInput(container) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf,image/*";
    fileInput.className = "hidden";

    const customButton = document.createElement("button");
    customButton.type = "button";
    customButton.textContent = "Upload PDF or Image";
    customButton.className = "bg-green-400 hover:bg-green-500 text-white font-medium px-4 py-2 rounded cursor-pointer mt-2 transition";

    const fileNameDisplay = document.createElement("p");
    fileNameDisplay.className = "mt-2 text-sm text-gray-700";

    customButton.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        fileNameDisplay.textContent = `Selected: ${file.name}`;

       if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = () => {
        const base64 = reader.result;

        // Check size (100KB = 100 * 1024 = 102400 bytes)
        const base64Size = Math.round((base64.length * 3) / 4);
        if (base64Size > 150 * 1024) {
            alert("Image too large! Please upload an image under 150KB for stability.");
            fileNameDisplay.textContent = "Upload failed: Image too large";
            return;
        }

        container.setAttribute("data-image", base64);

        const imgPreview = document.createElement("img");
        imgPreview.src = base64;
        imgPreview.className = "mt-2 max-h-40 rounded";
        container.appendChild(imgPreview);
    };
    reader.readAsDataURL(file);
}

    });

    container.appendChild(customButton);
    container.appendChild(fileInput);
    container.appendChild(fileNameDisplay);
    return fileInput;
}

// 🚩 Section Handlers
function addSectionHandler(buttonId, containerId, fields) {
    document.getElementById(buttonId).addEventListener("click", () => {
        const container = document.getElementById(containerId);
        const div = document.createElement("div");
        div.className = "mb-4 p-4 border rounded bg-white shadow";

        fields.forEach(placeholder => div.appendChild(createInput(placeholder)));
        div.appendChild(createFileInput(div));

        container.appendChild(div);
    });
}

// ✅ Register section handlers
addSectionHandler("addProjectBtn", "projectsContainer", ["Project Title", "Project Description", "Project Link (optional)"]);
addSectionHandler("addHackathonBtn", "hackathonsContainer", ["Hackathon Name", "Role/Description", "Link (optional)"]);
addSectionHandler("addAchievementBtn", "achievementsContainer", ["Achievement Title", "Description"]);
addSectionHandler("addCertificationBtn", "certificationsContainer", ["Certification Title", "Description", "Link (optional)"]);

// 🚩 Mobile Menu Toggle
const bars = document.getElementById("menu-btn");
const options = document.getElementById("options");
let menuOpen = false;
bars.addEventListener("click", () => {
    if (!menuOpen) {
        const links = [
            { text: "Home", href: "index.html" },
            { text: "About", href: "#" },
            { text: "Profile", href: "#" },
            { text: "Contact", href: "#" }
        ];
        links.forEach(linkData => {
            const a = document.createElement("a");
            a.textContent = linkData.text;
            a.href = linkData.href;
            a.className = "block text-gray-800 hover:text-green-600 font-medium p-2 link-item";
            options.appendChild(a);
        });
        menuOpen = true;
    } else {
        document.querySelectorAll(".link-item").forEach(link => link.remove());
        menuOpen = false;
    }
});

// 🚩 Save to Firestore
document.addEventListener("DOMContentLoaded", () => {
    console.log("dashboard.js loaded ✅");


    const saveBtn = document.getElementById("saveBtn");
    if (!saveBtn) {
        alert("Save button not found. Check your HTML.");
        return;
    }

    saveBtn.addEventListener("click", async () => {
    console.log("Save button pressed");

    const dashboardData = {
        name: document.getElementById("nameInput").value,
        socials: {
            linkedin: document.getElementById("linkedinInput").value || "",
            github: document.getElementById("githubInput").value || "",
            instagram: document.getElementById("instagramInput").value || ""
        },
        projects: [],
        hackathons: [],
        achievements: [],
        certifications: []
    };

    // Projects
    document.querySelectorAll("#projectsContainer > div").forEach(div => {
        const inputs = div.querySelectorAll("input[type='text']");
        if (inputs.length >= 3) {
            dashboardData.projects.push({
                title: inputs[0].value || "",
                description: inputs[1].value || "",
                link: inputs[2].value || "",
                imageSrc: div.getAttribute("data-image") || ""
            });
        }
    });

    // Hackathons
    document.querySelectorAll("#hackathonsContainer > div").forEach(div => {
        const inputs = div.querySelectorAll("input[type='text']");
        if (inputs.length >= 3) {
            dashboardData.hackathons.push({
                name: inputs[0].value || "",
                role: inputs[1].value || "",
                link: inputs[2].value || ""
            });
        }
    });

    // Achievements
    document.querySelectorAll("#achievementsContainer > div").forEach(div => {
        const inputs = div.querySelectorAll("input[type='text']");
        if (inputs.length >= 2) {
            dashboardData.achievements.push({
                title: inputs[0].value || "",
                description: inputs[1].value || ""
            });
        }
    });

    // Certifications
    document.querySelectorAll("#certificationsContainer > div").forEach(div => {
        const inputs = div.querySelectorAll("input[type='text']");
        if (inputs.length >= 3) {
            dashboardData.certifications.push({
                title: inputs[0].value || "",
                description: inputs[1].value || "",
                link: inputs[2].value || "",
                imageSrc: div.getAttribute("data-image") || ""
            });
        }
    });

    console.log("Saving to Firestore:", dashboardData);

        try {
            await setDoc(doc(db, "dashboards", "user_dashboard"), dashboardData);
            alert("Dashboard saved successfully!");
             window.location.href = "display.html"; 
        } catch (error) {
            console.error("Error saving to Firestore:", error);
            alert("Error saving dashboard. Check console for details.");
        }
        });

});
