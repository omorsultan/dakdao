const API_BASE = "http://localhost:5000";

// Fetch and display customer profile data
async function loadCustomerProfile() {
    try {
        const token = localStorage.getItem("token");
        
        if (!token) {
            console.error("No token found. User not authenticated.");
            return;
        }

        const response = await fetch(`${API_BASE}/api/profile/customer`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.profile) {
            displayCustomerProfile(data.profile);
        } else {
            console.log("No profile data available:", data);
        }
    } catch (err) {
        console.error("Error loading customer profile:", err);
    }
}

// Display customer profile data in console and make available globally
function displayCustomerProfile(profile) {
    console.log("Customer Profile Data:", profile);
    
    // Make profile data globally accessible
    window.customerProfile = profile;
    
    // Log individual fields
    console.log({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        mobile: profile.mobile,
        nid_number: profile.nid_number,
        permanent_location: profile.permanent_location,
        latitude: profile.latitude,
        longitude: profile.longitude,
        profile_image: profile.profile_image,
        created_at: profile.created_at,
        updated_at: profile.updated_at
    });
}

// Load profile on page load
document.addEventListener("DOMContentLoaded", function() {
    loadCustomerProfile();
});