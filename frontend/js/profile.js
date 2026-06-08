// frontend/js/profile.js

const API_BASE = "http://localhost:5000";

async function submitProfile() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const role = currentRole; // set by role toggle in profile.html

    const formData = new FormData();
    formData.append("full_name",          document.getElementById("full_name").value);
    formData.append("mobile",             document.getElementById("mobile").value);
    formData.append("nid_number",         document.getElementById("nid_number").value);
    formData.append("permanent_location", document.getElementById("permanent_location").value);
    formData.append("latitude",           document.getElementById("latitude").value);
    formData.append("longitude",          document.getElementById("longitude").value);

    if (role === "worker") {
        formData.append("skills", document.getElementById("skills").value);
    }

    const file = document.getElementById("profile_image").files[0];
    if (file) {
        formData.append("profile_image", file);
    }

    const btn     = document.getElementById("saveBtn");
    const btnText = document.getElementById("btnText");
    const spinner = document.getElementById("spinner");

    btn.disabled = true;
    btnText.style.display = "none";
    spinner.style.display = "block";

    try {
        const url = role === "worker"
            ? `${API_BASE}/api/profile/worker`
            : `${API_BASE}/api/profile/customer`;

        const response = await fetch(url, {
            method: "POST",
            headers: { Authorization: "Bearer " + token },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem("profileComplete", "true");
            showMsg("Profile saved successfully!", "success");
            setTimeout(() => { window.location.href = "customer-home.html"; }, 1000);
        } else {
            showMsg(data.message || "Something went wrong.", "error");
        }

    } catch (err) {
        showMsg("Could not connect to server.", "error");
    } finally {
        btn.disabled = false;
        btnText.style.display = "block";
        spinner.style.display = "none";
    }
}