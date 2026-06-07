const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const loginData = {
        mobile: document.getElementById("mobile").value,
        password: document.getElementById("password").value
    };

    try {

        const response = await fetch(
            "http://localhost:5000/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginData)
            }
        );

        const data = await response.json();

        if (data.token) {

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            document.getElementById("message").innerText =
                "Login Successful";

            window.location.href =
                "dashboard.html";
        }
        else {

            document.getElementById("message").innerText =
                data.message;
        }

    } catch (error) {

        document.getElementById("message").innerText =
            error.message;
    }
});