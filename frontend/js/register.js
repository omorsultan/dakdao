const form = document.getElementById("registerForm");


form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const userData = {
        name: document.getElementById("name").value,
        mobile: document.getElementById("mobile").value,
        password: document.getElementById("password").value,
        role: document.getElementById("role").value
    };

    try {

        const response = await fetch(
            "http://localhost:5000/api/auth/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            }
        );

        const data = await response.json();

        document.getElementById("message").innerText =
            data.message || "Registration Successful";

    } catch (error) {

        document.getElementById("message").innerText =
            error.message;

    }
});