require("dotenv").config();
async function submitProfile() {

    const role = document.getElementById("role").value;

    const token = localStorage.getItem("token");
    const PORT = process.env.PORT; 
    
if (!token) {
    window.location.href = "login.html";
}
    const formData = new FormData();

    formData.append("full_name", document.getElementById("full_name").value);
    formData.append("mobile", document.getElementById("mobile").value);
    formData.append("nid_number", document.getElementById("nid_number").value);
    formData.append("permanent_location", document.getElementById("permanent_location").value);
    formData.append("latitude", document.getElementById("latitude").value);
    formData.append("longitude", document.getElementById("longitude").value);

    if (role === "worker") {
        formData.append("skills", document.getElementById("skills").value);
    }

    const file = document.getElementById("profile_image").files[0];

    if (file) {
        formData.append("profile_image", file);
    }

    try {

        const url =
            role === "worker"
                ? `http://localhost:${PORT}/api/profile/worker`
                : `http://localhost:${PORT}/api/profile/customer`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token
            },
            body: formData
        });

        const data = await response.json();

        document.getElementById("msg").innerText =
            data.message;

    } catch (err) {

        document.getElementById("msg").innerText =
            err.message;
    }
}