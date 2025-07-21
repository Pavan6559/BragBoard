import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    let data = null;

    try {
        const docSnap = await getDoc(doc(db, "dashboards", "user_dashboard"));
        if (docSnap.exists()) {
            data = docSnap.data();
        } else {
            alert("No dashboard found. Please create your dashboard first.");
            window.location.href = "dashboard.html";
            return;
        }
    } 
    catch (error) {
        console.error("Error fetching data:", error);
        alert("Error fetching dashboard. Check console.");
        return;
    }

    // ===== Navbar Name =====
  
    const fullName = data.name || "Your Name";
    const nameParts = fullName.trim().split(" ");
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  
    const firstName = nameParts.slice(0, -1).join(" ") || fullName;

 
    document.getElementById("userNameDisplay").innerHTML = `
        ${firstName} <span class="text-green-50">${lastName}</span>
    `;

    // ===== Projects =====
    const projectsGrid = document.getElementById("projectsGrid");
    data.projects.forEach(project => {
    const card = document.createElement("div");
    card.className = "bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden hover:scale-105 flex flex-col";

    card.innerHTML = `
        ${project.imageSrc ? `<img src="${project.imageSrc}" class="object-cover w-full h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 rounded-t-lg" alt="Project Image">` : ""}
        <div class="p-4 flex flex-col flex-grow">
            <h3 class="font-bold text-lg mb-2 text-gray-800">${project.title || "Untitled Project"}</h3>
            <p class="text-gray-600 text-sm mb-2 whitespace-pre-wrap">${project.description || ""}</p>
            ${project.link ? `<a href="${project.link}" target="_blank" class="text-green-600 underline text-sm mt-auto hover:text-green-800 transition">View Project</a>` : ""}
        </div>
    `;
    projectsGrid.appendChild(card);
});

    // ===== Hackathons =====
    const hackathonsGrid = document.getElementById("hackathonsGrid");
    data.hackathons.forEach(hack => {
        const card = document.createElement("div");
        card.className = "bg-white rounded-lg shadow p-4 hover:scale-105 transition-all";

        card.innerHTML = `
            <h3 class="font-bold">${hack.name || "Untitled Hackathon"}</h3>
            <p class="text-gray-600">${hack.role || ""}</p>
            ${hack.link ? `<a href="${hack.link}" target="_blank" class="text-green-600 underline text-sm">View Details</a>` : ""}
        `;
        hackathonsGrid.appendChild(card);
    });

    // ===== Achievements  =====
    const achievementsTimeline = document.getElementById("achievementsTimeline");
    data.achievements.forEach(ach => {
        const item = document.createElement("div");
        item.className = "relative pl-6 hover:scale-105 transition-all";

        item.innerHTML = `
            <div class="absolute -left-3 top-2 w-3 h-3 bg-green-400 rounded-full"></div>
            <div class="bg-white shadow p-4 rounded">
                <h3 class="font-bold">${ach.title || "Untitled Achievement"}</h3>
                <p class="text-gray-600">${ach.description || ""}</p>
            </div>
        `;
        achievementsTimeline.appendChild(item);
    });

    // ===== Certifications  =====
    const certSection = document.getElementById("certificationsSection");
    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

    data.certifications.forEach(cert => {
        const card = document.createElement("div");
        card.className = "bg-white rounded-lg shadow hover:shadow-lg transition-all overflow-hidden hover:scale-105 flex flex-col";

        card.innerHTML = `
            ${cert.imageSrc ? `<img src="${cert.imageSrc}" class="object-cover w-full h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 rounded-t-lg" alt="Certification Image">` : ""}
            <div class="p-4 flex flex-col flex-grow">
                <h3 class="font-bold text-lg mb-2 text-gray-800">${cert.title || "Untitled Certification"}</h3>
                <p class="text-gray-600 text-sm mb-2 whitespace-pre-wrap">${cert.description || ""}</p>
                ${cert.link ? `<a href="${cert.link}" target="_blank" class="text-green-600 underline text-sm mt-auto hover:text-green-800 transition">View Certificate</a>` : ""}
            </div>
        `;
        grid.appendChild(card);
    });

    certSection.appendChild(grid);


       
    const shareBtn = document.getElementById("shareBtn");

    if (shareBtn) {
        shareBtn.addEventListener("click", async () => {
            const shareUrl = window.location.href;

            try {
                if (navigator.share) {
                    await navigator.share({
                        title: document.title,
                        text: "Check out my dashboard here:",
                        url: shareUrl
                    });
                    console.log("Shared successfully");
                } else {
                    
                    await navigator.clipboard.writeText(shareUrl);
                    alert(`Link copied! Paste it in any app to share:\n\n${shareUrl}`);
                }
            } catch (error) {
                console.error("Error sharing:", error);
                alert("Error sharing. Check console for details.");
            }
        });
    }



    // ===== Social Links =====
    const socialLinksContainer = document.getElementById("socialLinks");
    const socials = data.socials || {};

    if (socialLinksContainer) {
        if (socials.linkedin) {
            const a = document.createElement("a");
            a.href = socials.linkedin;
            a.textContent = "LinkedIn";
            a.target = "_blank";
            a.className = "hover:underline hover:text-green-800 transition block";
            socialLinksContainer.appendChild(a);
        }
        if (socials.github) {
            const a = document.createElement("a");
            a.href = socials.github;
            a.textContent = "GitHub";
            a.target = "_blank";
            a.className = "hover:underline hover:text-green-800 transition block";
            socialLinksContainer.appendChild(a);
        }
        if (socials.instagram) {
            const a = document.createElement("a");
            a.href = socials.instagram;
            a.textContent = "Instagram";
            a.target = "_blank";
            a.className = "hover:underline hover:text-green-800 transition block";
            socialLinksContainer.appendChild(a);
        }
    }


    // so how was my code since it was my last page

});


 

