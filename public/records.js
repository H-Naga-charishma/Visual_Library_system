// ==========================================
// EXPERIMENT 3 - CUSTOMER RECORDS
// Update (PUT), Alter (PATCH), Delete (DELETE)
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const DOOR_NAMES = {
        hinged: "Hinged",
        sliding: "Sliding",
        glass: "Glass",
        lifting: "Lifting"
    };

    const recordsBody = document.getElementById("records-body");
    const recordCount = document.getElementById("record-count");
    const searchInput = document.getElementById("search-input");
    const syncStatus = document.getElementById("sync-status");

    const updateModal = document.getElementById("update-modal");
    const updateTitle = document.getElementById("update-title");
    const updPhone = document.getElementById("upd-phone");
    const updEmail = document.getElementById("upd-email");
    const updRacks = document.getElementById("upd-racks");
    const updShelves = document.getElementById("upd-shelves");
    const updateError = document.getElementById("update-error");

    const deleteModal = document.getElementById("delete-modal");
    const deleteMessage = document.getElementById("delete-message");

    const toast = document.getElementById("toast");

    let customers = [];
    let updatingId = null;
    let deletingId = null;
    let toastTimer = null;


    // ---------- small helpers ----------

    // Build elements with textContent only (safe against HTML injection)
    function el(tag, className, text) {

        const node = document.createElement(tag);

        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;

        return node;
    }

    function showToast(message, isError) {

        toast.textContent = message;
        toast.classList.toggle("error", !!isError);
        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(function () {
            toast.classList.remove("show");
        }, 3500);
    }

    async function api(url, options) {

        const response = await fetch(url, options);

        let data = {};

        try {
            data = await response.json();
        } catch (e) {
            throw new Error("Server returned an unexpected response. Is it running?");
        }

        if (!response.ok) {
            throw new Error(data.message || "Request failed.");
        }

        return data;
    }

    function jsonOptions(method, body) {

        return {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        };
    }

    function syncWarning(result) {

        if (result && result.sync && !result.sync.ok) {
            showToast("Saved, but Exp2 was NOT updated: " + result.sync.message, true);
            return true;
        }

        return false;
    }


    // ---------- load + render ----------

    async function loadCustomers() {

        const query = searchInput.value.trim();

        customers = await api(
            "/api/customers" +
            (query ? "?search=" + encodeURIComponent(query) : "")
        );

        renderTable();
    }

    function renderTable() {

        recordsBody.textContent = "";

        recordCount.textContent =
            customers.length + " customer" + (customers.length === 1 ? "" : "s");

        if (!customers.length) {

            const row = el("tr");
            const cell = el("td", "empty-cell", "No customer records found.");
            cell.colSpan = 9;
            row.appendChild(cell);
            recordsBody.appendChild(row);

            return;
        }

        customers.forEach(function (c) {

            const row = el("tr");

            function cell(value) {

                const td = el("td");

                if (value === undefined || value === null || value === "") {
                    td.appendChild(el("span", "missing", "not set"));
                } else {
                    td.textContent = value;
                }

                row.appendChild(td);
            }

            cell(c.customerId);
            cell(c.customerName);
            cell(c.customerPhone);
            cell(c.customerEmail);
            cell(c.cupboards);
            cell(c.shelves);
            cell(c.cupboardLength !== undefined ? c.cupboardLength + " cm" : "");
            cell(DOOR_NAMES[c.door] || c.door);

            const actions = el("td");
            const group = el("div", "row-actions");

            const updateBtn = el("button", "row-btn update", "Update");
            const alterBtn = el("button", "row-btn alter", "Alter");
            const deleteBtn = el("button", "row-btn delete", "Delete");

            updateBtn.type = alterBtn.type = deleteBtn.type = "button";

            updateBtn.addEventListener("click", function () { openUpdate(c); });
            alterBtn.addEventListener("click", function () { window.designer.loadForAlter(c); });
            deleteBtn.addEventListener("click", function () { openDelete(c); });

            group.appendChild(updateBtn);
            group.appendChild(alterBtn);
            group.appendChild(deleteBtn);
            actions.appendChild(group);
            row.appendChild(actions);

            recordsBody.appendChild(row);
        });
    }

    async function loadStatus() {

        const status = await api("/api/status");

        syncStatus.classList.toggle("warn", !status.exp2FolderFound);

        syncStatus.textContent = status.exp2FolderFound
            ? "Every change is copied to Exp2 file: " + status.exp2File
            : "Exp2 folder not found: " + status.exp2File +
              " - fix exp2CustomerPath in config.json";
    }

    async function loadAll() {

        try {
            await loadCustomers();
            await loadStatus();
        } catch (error) {
            showToast(error.message, true);
        }
    }

    window.refreshRecords = loadAll;
    window.showToast = showToast;
    window.openDeleteFor = openDelete;


    // ---------- search ----------

    let searchTimer = null;

    searchInput.addEventListener("input", function () {

        clearTimeout(searchTimer);

        searchTimer = setTimeout(function () {
            loadCustomers().catch(function (e) { showToast(e.message, true); });
        }, 250);
    });


    // ---------- UPDATE (PUT) ----------

    function openUpdate(c) {

        updatingId = c.customerId;

        updateTitle.textContent = "Update " + c.customerId + " - " + c.customerName;

        updPhone.value = c.customerPhone || "";
        updEmail.value = c.customerEmail || "";
        updRacks.value = c.cupboards;
        updShelves.value = c.shelves;

        updateError.textContent = "";

        updateModal.classList.add("show");

        updPhone.focus();
    }

    function closeUpdate() {
        updateModal.classList.remove("show");
        updatingId = null;
    }

    document.getElementById("update-cancel").addEventListener("click", closeUpdate);

    document.getElementById("update-save").addEventListener("click", async function () {

        updateError.textContent = "";

        try {

            const result = await api(
                "/api/customers/" + encodeURIComponent(updatingId),
                jsonOptions("PUT", {
                    customerPhone: updPhone.value.trim(),
                    customerEmail: updEmail.value.trim(),
                    cupboards: updRacks.value.trim(),
                    shelves: updShelves.value.trim()
                })
            );

            const id = updatingId;

            closeUpdate();

            if (!syncWarning(result)) {
                showToast(result.message);
            }

            // if this customer is open in the designer, reload it
            if (window.designer.currentId() === id && result.customer) {
                window.designer.loadForAlter(result.customer);
            }

            loadAll();

        } catch (error) {
            updateError.textContent = error.message;
        }
    });


    // ---------- DELETE (DELETE) ----------

    function openDelete(c) {

        deletingId = c.customerId;

        deleteMessage.textContent =
            "Delete " + c.customerId + " (" + c.customerName + ")? " +
            "The record will be permanently removed from customers.json, " +
            "alter.json and Exp2's customer.json. This cannot be undone.";

        deleteModal.classList.add("show");
    }

    function closeDelete() {
        deleteModal.classList.remove("show");
        deletingId = null;
    }

    document.getElementById("delete-cancel").addEventListener("click", closeDelete);

    document.getElementById("delete-confirm").addEventListener("click", async function () {

        const id = deletingId;

        try {

            const result = await api(
                "/api/customers/" + encodeURIComponent(id),
                { method: "DELETE" }
            );

            closeDelete();

            // clear the designer if it was showing this customer
            if (window.designer.currentId() === id) {
                window.designer.reset();
            }

            // tell the Update / Alter panel
            document.dispatchEvent(
                new CustomEvent("customer:deleted", { detail: { id: id } })
            );

            if (!syncWarning(result)) {
                showToast(result.message);
            }

            loadAll();

        } catch (error) {

            closeDelete();
            showToast(error.message, true);
            loadAll();
        }
    });


    // close modals with the Escape key
    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {
            closeUpdate();
            closeDelete();
        }
    });


    loadAll();
});
