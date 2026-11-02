nconst supabaseUrl = "https://wgujzhicbowsjijbffty.supabase.co";
const supabaseKey = "sb_publishable_g17L0FEUseyVPUKcMsujRg_-u-GNjz_";

 const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

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
    <button class="editButton">Edit</button>
    <button class="deleteButton">Delete</button>
    
   ${item.status !== "RESOLVED" ? '<button class="resolveButton">✅ Mark as Resolved</button>' : ""} 
`;

const contactButton = newItem.querySelector(".contactButton");

contactButton.addEventListener("click", function () {
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
    document.getElementById("itemImage").value = item.image || "";

    itemForm.style.display = "block";
});

const deleteButton = newItem.querySelector(".deleteButton");

   deleteButton.addEventListener("click", function () {
    const confirmDelete = confirm("Are you sure you want to delete this item?");

    if (confirmDelete) {
        items.splice(items.indexOf(item), 1);

        localStorage.setItem("lostFoundItems", JSON.stringify(items));

        displayItems();

        showNotification("Item deleted successfully!");
    }
});     

const resolveButton = newItem.querySelector(".resolveButton");

if (resolveButton) {
    resolveButton.addEventListener("click", function () {
        item.status = "RESOLVED";

        localStorage.setItem("lostFoundItems", JSON.stringify(items));

        displayItems();
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
    const itemImage = document.getElementById("itemImage").value;

    if (itemName === "" || itemLocation === "" || itemContact === "") {
        alert("Please enter the item name, location, and contact information.");
        return;
    }

    // Create an item object
    const newItem = {
        name: itemName,
        description: itemDescription,
        status: itemStatus,
        location: itemLocation,
        contact: itemContact,
        image: itemImage

    };

    // Add the item to our list
    if (editingIndex === -1) {
    // Add a completely new item
    items.unshift(newItem);
} else {
    // Update the item being edited
    items[editingIndex] = newItem;

    // Stop editing mode
    editingIndex = -1;
}

    const { data, error } = await supabaseClient
    .from("items")
    .insert([
        {
            name: itemName,
            description: itemDescription,
            status: itemStatus,
            location: itemLocation,
            contact: itemContact
        }
    ])

if (error) {
    console.error("Error saving item:", error);
    alert("Could not save the item. Please try again.");
    return;
}

await loadItems();

alert("Item posted successfully!");

    // Clear the form
    document.getElementById("itemName").value = "";
    document.getElementById("itemDescription").value = "";
    document.getElementById("itemLocation").value = "";
    document.getElementById("itemContact").value = "";
    document.getElementById("itemImage").value = "";

    // Hide the form
    itemForm.style.display = "none";
showNotification("Item posted successfully! 🎉");
    
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

clearAllButton.addEventListener("click", function () {
    const confirmClear = confirm(
        "Are you sure you want to delete all items?"
    );

    if (confirmClear) {
        items = [];

        localStorage.setItem(
            "lostFoundItems",
            JSON.stringify(items)
        );

        displayItems();

        alert("All items have been deleted.");
    }
});