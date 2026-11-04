const supabaseUrl = "https://wgujzhicbowsjijbffty.supabase.co";
const supabaseKey = "sb_publishable_g17L0FEUseyVPUKcMsujRg_-u-GNjz_";

 const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
 // ADMIN AUTHENTICATION

const adminUserId = "ec711150-630e-4ae8-8ea3-69b7768fa3ab";

let isAdmin = false;

// Check current login session
async function checkAdminLogin() {

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error("Session error:", error);
        return;
    }

    const user = data.session?.user;

    isAdmin = user?.id === adminUserId;

    updateAdminUI();
}

// Update admin buttons
function updateAdminUI() {

    document.getElementById("loginButton").style.display =
        isAdmin ? "none" : "inline-block";

    document.getElementById("logoutButton").style.display =
        isAdmin ? "inline-block" : "none";

    document.getElementById("clearAllButton").style.display =
        isAdmin ? "inline-block" : "none";

    document.getElementById("adminDashboard").style.display =
        isAdmin ? "block" : "none";

    updateDashboardStats();
}

// UPDATE DASHBOARD STATISTICS

function updateDashboardStats() {

    document.getElementById("totalItems").textContent =
        items.length;

    document.getElementById("lostItems").textContent =
        items.filter(item => item.status === "LOST").length;

    document.getElementById("foundItems").textContent =
        items.filter(item => item.status === "FOUND").length;

    document.getElementById("resolvedItems").textContent =
        items.filter(item => item.status === "RESOLVED").length;
}

// Check login when website opens
checkAdminLogin();

async function testSupabaseConnection() {
    const { data, error } = await supabaseClient
        .from("items")
        .select("*");

    if (error) {
        console.error("Supabase connection error:", error);
    } else {
        console.log("Supabase connected successfully!", data);
    }
}

testSupabaseConnection();

const postButton = document.getElementById("postButton");
const itemForm = document.getElementById("itemForm");

async function uploadItemImage(file) {

    if (!file) return "";

    const fileExt = file.name.split(".").pop();

    const fileName = `${Date.now()}-${Math.random()
        .toString(36).substring(2)}.${fileExt}`;

    const { error } = await supabaseClient
        .storage
        .from("item-images")
        .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false
        });

    if (error) {
        console.error("Image upload error:", error);
        throw error;
    }

    const { data } = supabaseClient
        .storage
        .from("item-images")
        .getPublicUrl(fileName);

    return data.publicUrl;
}
const submitButton = document.getElementById("submitButton");
const itemsContainer = document.getElementById("itemsContainer");
const itemCount = document.getElementById("itemCount");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const cancelButton = document.getElementById("cancelButton");
const darkModeButton = document.getElementById("darkModeButton");
const clearAllButton = document.getElementById("clearAllButton");
const sortItems = document.getElementById("sortItems");
const clearSearchButton = document.getElementById("clearSearchButton");
// ADMIN LOGIN BUTTON

const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const loginSection = document.getElementById("loginSection");
const adminLoginForm = document.getElementById("adminLoginForm");
const loginMessage = document.getElementById("loginMessage");

loginButton.addEventListener("click", function () {
    loginSection.style.display = "block";
});

document.getElementById("cancelLoginButton").addEventListener("click", function () {
    loginSection.style.display = "none";
});

// ADMIN LOGIN
adminLoginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        loginMessage.textContent = "Login failed: " + error.message;
        return;
    }

    if (data.user.id !== adminUserId) {

        await supabaseClient.auth.signOut();

        loginMessage.textContent = "This account is not authorized as admin.";
        return;
    }

    isAdmin = true;

    updateAdminUI();

    loginSection.style.display = "none";

    adminLoginForm.reset();

    showNotification("Admin login successful!");
});

// ADMIN LOGOUT
logoutButton.addEventListener("click", async function () {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("Logout error:", error);
        return;
    }

    isAdmin = false;

    updateAdminUI();

    showNotification("Admin logged out successfully!");

});

// Get saved items, or create an empty list
let items = [];
let editingIndex = -1;

async function loadItems() {
    const { data, error } = await supabaseClient
        .from("items")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading items:", error);
        return;
    }

   items = data;
   displayItems();
   updateDashboardStats(); 
    
}

function showNotification(message) {
    const notification = document.getElementById("notification");

    notification.textContent = message;
    notification.classList.add("show");

    setTimeout(function () {
        notification.classList.remove("show");
    }, 3000);
}

// Show saved items on the webpage
function displayItems() {
    itemsContainer.innerHTML = "";

    itemCount.textContent = items.length;

const searchText = searchInput.value.toLowerCase();
const selectedStatus = filterStatus.value;

const filteredItems = items.filter(function (item) {
    
    const matchesSearch = item.name.toLowerCase().includes(searchText);

    const matchesStatus =
        selectedStatus === "ALL" ||
        item.status === selectedStatus;

    return matchesSearch && matchesStatus;
});

if (sortItems.value === "lost") {
    filteredItems.sort(function (a, b) {
        if (a.status === "LOST" && b.status !== "LOST") {
            return -1;
        }

        if (a.status !== "LOST" && b.status === "LOST") {
            return 1;
        }

        return 0;
    });
}

if (sortItems.value === "found") {
    filteredItems.sort(function (a, b) {
        if (a.status === "FOUND" && b.status !== "FOUND") {
            return -1;
        }

        if (a.status !== "FOUND" && b.status === "FOUND") {
            return 1;
        }

        return 0;
    });
}

if (filteredItems.length === 0) {
    itemsContainer.innerHTML = `
        <div class="no-items">
            <h3>📭 No items found</h3>
            <p>Try changing your search or filter.</p>
        </div>
    `;
    return;
}

filteredItems.forEach(function (item) {
        const newItem = document.createElement("div");
        newItem.className = "item-card";

newItem.innerHTML = `
    ${item.image ? `<img src="${item.image}" alt="${item.name}" class="item-image">` : ""}
    <h3>📦 ${item.name}</h3>
    <p><strong>Description:</strong> ${item.description}</p>
    <p><strong>Status:</strong> <span class="status ${item.status.toLowerCase()}">${item.status}</span></p>
    <p><strong>Location:</strong> ${item.location}</p>
    
  <button class="contactButton">Contact</button>

${isAdmin ? `
    <button class="editButton">Edit</button>
    <button class="deleteButton">Delete</button>
    ${item.status !== "RESOLVED" ? '<button class="resolveButton">✅ Mark as Resolved</button>' : ""}
` : ""}
  `;

const editButton = newItem.querySelector(".editButton");

if (editButton) {
    editButton.addEventListener("click", function () {
    alert("Contact: " + item.contact);
});

const editButton = newItem.querySelector(".editButton");

editButton.addEventListener("click", function () {

    editingIndex = items.indexOf(item);

    document.getElementById("itemName").value = item.name;
    document.getElementById("itemDescription").value = item.description;
    document.getElementById("itemStatus").value = item.status;
    document.getElementById("itemLocation").value = item.location;
    document.getElementById("itemContact").value = item.contact || "";

    // Show existing image
    const preview = document.getElementById("currentImagePreview");

    if (item.image) {
        preview.src = item.image;
        preview.style.display = "block";
    } else {
        preview.style.display = "none";
    }

    itemForm.style.display = "block";

});

}

const deleteButton = newItem.querySelector(".deleteButton");

if (deleteButton) {

    deleteButton.addEventListener("click", async function () {

    const confirmDelete = confirm("Are you sure you want to delete this item?");

    if (!confirmDelete) return;

    const { data, error } = await supabaseClient
        .from("items")
        .delete()
        .eq("id", item.id)
        .select();

    if (error) {
        console.error("Delete error:", error);
        showNotification("Could not delete item!");
        return;
    }

    if (!data || data.length === 0) {
        showNotification("Item not found!");
        return;
    }

    items = items.filter(i => i.id !== item.id);

    displayItems();

    showNotification("Item deleted successfully!");
});

}

const resolveButton = newItem.querySelector(".resolveButton");

if (resolveButton) {

    resolveButton.addEventListener("click", async function () {

        const { error } = await supabaseClient
            .from("items")
            .update({ status: "RESOLVED" })
            .eq("id", item.id);

        if (error) {
            console.error("Resolve error:", error);
            showNotification("Could not update item!");
            return;
        }

        item.status = "RESOLVED";

        displayItems();

        showNotification("Item marked as resolved!");
    });
}

itemsContainer.appendChild(newItem);

    });
}

// Load items from Supabase when the page opens
loadItems();

// Show the form
postButton.addEventListener("click", function () {
    itemForm.style.display = "block";
    
});

cancelButton.addEventListener("click", function () {
    itemForm.style.display = "none";
});

// Add a new item
submitButton.addEventListener("click", async function () {

    const itemName = document.getElementById("itemName").value;
    const itemDescription = document.getElementById("itemDescription").value;
    const itemStatus = document.getElementById("itemStatus").value;
    const itemLocation = document.getElementById("itemLocation").value;
    const itemContact = document.getElementById("itemContact").value;

    const imageFile = document.getElementById("itemImage").files[0];

    if (itemName === "" || itemLocation === "" || itemContact === "") {
        alert("Please enter the item name, location, and contact information.");
        return;
    }

    // Check image size and type
    if (imageFile) {

        if (imageFile.size > 5 * 1024 * 1024) {
            alert("Image must be smaller than 5 MB.");
            return;
        }

        if (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) {
            alert("Only JPG, PNG, and WebP images are allowed.");
            return;
        }
    }

    try {

        let imageUrl = "";

        // Preserve existing image when editing
        if (editingIndex !== -1) {
            imageUrl = items[editingIndex].image || "";
        }

        // Upload new image if selected
        if (imageFile) {
            imageUrl = await uploadItemImage(imageFile);
        }

        const itemData = {
            name: itemName,
            description: itemDescription,
            status: itemStatus,
            location: itemLocation,
            contact: itemContact,
            image: imageUrl
        };

        let error;

        if (editingIndex === -1) {

            // INSERT NEW ITEM
            const result = await supabaseClient
                .from("items")
                .insert([itemData]);

            error = result.error;

        } else {

            // UPDATE EXISTING ITEM
            const existingItem = items[editingIndex];

            const result = await supabaseClient
                .from("items")
                .update(itemData)
                .eq("id", existingItem.id);

            error = result.error;
        }

        if (error) {
            console.error("Error saving item:", error);
            alert("Could not save the item. Please try again.");
            return;
        }

        editingIndex = -1;

        await loadItems();

        // Clear form
        document.getElementById("itemName").value = "";
        document.getElementById("itemDescription").value = "";
        document.getElementById("itemLocation").value = "";
        document.getElementById("itemContact").value = "";
        document.getElementById("itemImage").value = "";

        itemForm.style.display = "none";

        showNotification("Item saved successfully! 🎉");

    } catch (error) {

        console.error("Error:", error);
        alert("Something went wrong while uploading or saving the item.");

    }

});

searchInput.addEventListener("input", function () {
    displayItems();
});

clearSearchButton.addEventListener("click", function () {
    searchInput.value = "";
    displayItems();
});

filterStatus.addEventListener("change", function () {
    displayItems();
});

sortItems.addEventListener("change", function () {
     displayItems()
});


if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
    darkModeButton.textContent = "☀️ Light Mode";
}

darkModeButton.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        darkModeButton.textContent = "☀️ Light Mode";
        localStorage.setItem("darkMode", "enabled");
    } else {
        darkModeButton.textContent = "🌙 Dark Mode";
        localStorage.setItem("darkMode", "disabled");
    }
});

clearAllButton.addEventListener("click", async function () {

    const confirmClear = confirm(
        "Are you sure you want to delete ALL items?"
    );

    if (!confirmClear) return;

    const { data, error } = await supabaseClient
        .from("items")
        .delete()
        .gt("id", 0)
        .select();

    if (error) {
        console.error("Clear all error:", error);
        showNotification("Could not delete items!");
        return;
    }

    console.log("Deleted items:", data);

    await loadItems();

    showNotification("All items deleted successfully!");

});