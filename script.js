// pressing create button takes you to dashboard
const createbtn=document.getElementById("createbtn");
createbtn.addEventListener("click",function(){
    window.location.href="dashboard.html";
});

// pressing bars give you options
const bars = document.getElementById("menu-btn");
const options = document.getElementById("options");
let menuOpen = false; 
bars.addEventListener("click", function() {
    if (!menuOpen) {
        const links = [
            { text: "Home", href: "#" , id:"home" },
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

