#Fronteend/js/login.js

const form = document.getElementById("loginForm");


form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const loginData = {
        mobile: document.getElementById("mobile").value,
        password: document.getElementById("password").value
    };

    try {

        const res = await fetch(`http://localhost:5000/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        });

        const data = await res.json();

        if (data.token) {

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // 👉 redirect to profile page
            window.location.href = "profile.html";

        } else {
            document.getElementById("message").innerText = data.message;
        }

    } catch (err) {
        document.getElementById("message").innerText = err.message;
    }
});