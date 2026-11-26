// ==========================================
// EXPERIMENT 3 - UPDATE / ALTER PANEL
// Load by Customer ID, Save Update (PUT),
// Save Alteration (PATCH), Delete (DELETE)
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // Built-in components, in display order.
    // field = name used in customers.json
    const CORE = [
        { label: "name", field: "customerName", required: true },
        { label: "phone", field: "customerPhone", required: false },
        { label: "email", field: "customerEmail", required: false },
        { label: "shelves", field: "shelves", required: true },
        { label: "racks", field: "cupboards", required: true },
        { label: "length", field: "cupboardLength", required: true },
        { label: "door", field: "door", required: true }
    ];

    const idInput = document.getElementById("m-id");
    const nameInput = document.getElementById("m-name");
    const phoneInput = document.getElementById("m-phone");
    const emailInput = document.getElementById("m-email");
    const racksInput = document.getElementById("m-racks");
    const shelvesInput = document.getElementById("m-shelves");

    const loadBtn = document.getElementById("m-load");
    const saveUpdateBtn = document.getElementById("m-save-update");
    const saveAlterBtn = document.getElementById("m-save-alter");
    const deleteBtn = document.getElementById("m-delete");
    const message = document.getElementById("m-message");

    const rowsBox = document.getElementById("component-rows");
    const newName = document.getElementById("new-comp-name");
    const newValue = document.getElementById("new-comp-value");
    const addBtn = document.getElementById("add-comp");

    const topInputs = [phoneInput, emailInput, racksInput, shelvesInput];

    let loaded = null;   // the customer currently loaded
    let rows = [];       // component rows being edited


    // ---------- helpers ----------

    function el(tag, className, text) {

        const node = document.createElement(tag);

        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;

        return node;
    }

    function say(text, isError) {

        message.textContent = text || "";
        message.classList.toggle("error", !!isError);
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

    function setEnabled(on) {

        topInputs.forEach(function (i) { i.disabled = !on; });

        [saveUpdateBtn, saveAlterBtn, deleteBtn,
            newName, newValue, addBtn].forEach(function (b) {
            b.disabled = !on;
        });
    }

    function refreshEverywhere() {

        if (window.refreshRecords) {
            window.refreshRecords();
        }
    }

    function toast(text, isError) {

        if (window.showToast) {
            window.showToast(text, isError);
        }
    }


    // ---------- fill the panel from a customer ----------

    function fillTop(c) {

        idInput.value = c.customerId;
        nameInput.value = c.customerName || "";
        phoneInput.value = c.customerPhone || "";
        emailInput.value = c.customerEmail || "";
        racksInput.value = c.cupboards;
        shelvesInput.value = c.shelves;
    }

    function buildRows(c) {

        rows = [];

        CORE.forEach(function (def) {

            if (c[def.field] !== undefined && c[def.field] !== null) {

                rows.push({
                    kind: "core",
                    label: def.label,
                    field: def.field,
                    required: def.required,
                    value: String(c[def.field])
                });
            }
        });

        const extra = c.components || {};

        Object.keys(extra).forEach(function (key) {

            rows.push({
                kind: "custom",
                label: key,
                required: false,
                value: String(extra[key])
            });
        });
    }

    function renderRows() {

        rowsBox.textContent = "";

        rows.forEach(function (row, index) {

            const line = el("div", "component-row");

            const label = el("input", "comp-input");
            label.value = row.label;
            label.readOnly = true;

            const value = el("input", "comp-input");
            value.value = row.value;

            value.addEventListener("input", function () {
                row.value = value.value;
            });

            const action = el("button", "comp-btn", row.required ? "Required" : "Remove");
            action.type = "button";

            if (row.required) {

                action.classList.add("required");
                action.tabIndex = -1;

            } else {

                action.addEventListener("click", function () {
                    rows.splice(index, 1);
                    renderRows();
                    say("Component '" + row.label + "' removed. Click Save Alteration to store the change.");
                });
            }

            line.appendChild(label);
            line.appendChild(value);
            line.appendChild(action);

            rowsBox.appendChild(line);
        });
    }

    function showCustomer(c) {

        loaded = c;

        fillTop(c);
        buildRows(c);
        renderRows();
        setEnabled(true);
    }

    function clearPanel() {

        loaded = null;

        [nameInput, phoneInput, emailInput, racksInput, shelvesInput]
            .forEach(function (i) { i.value = ""; });

        rows = [];
        rowsBox.textContent = "";
        newName.value = "";
        newValue.value = "";

        setEnabled(false);
    }


    // ---------- LOAD (GET) ----------

    async function loadCustomer() {

        const id = idInput.value.trim().toUpperCase();

        if (!id) {
            say("Enter a Customer ID first.", true);
            return;
        }

        try {

            const customer = await api("/api/customers/" + encodeURIComponent(id));

            showCustomer(customer);
            say("Loaded " + customer.customerId + ".");

        } catch (error) {

            clearPanel();
            idInput.value = id;
            say(error.message, true);
        }
    }

    loadBtn.addEventListener("click", loadCustomer);

    idInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") loadCustomer();
    });


    // ---------- SAVE UPDATE (PUT) ----------

    saveUpdateBtn.addEventListener("click", async function () {

        if (!loaded) return;

        const body = {
            cupboards: racksInput.value.trim(),
            shelves: shelvesInput.value.trim()
        };

        // phone / email are only sent when something is typed
        if (phoneInput.value.trim()) body.customerPhone = phoneInput.value.trim();
        if (emailInput.value.trim()) body.customerEmail = emailInput.value.trim();

        try {

            const result = await api(
                "/api/customers/" + encodeURIComponent(loaded.customerId),
                jsonOptions("PUT", body)
            );

            showCustomer(result.customer);

            say(result.message);

            if (result.sync && !result.sync.ok) {
                toast("Saved, but Exp2 was NOT updated: " + result.sync.message, true);
            } else {
                toast(result.message);
            }

            refreshEverywhere();

        } catch (error) {
            say(error.message, true);
        }
    });


    // ---------- ADD COMPONENT ----------

    function addComponent() {

        if (!loaded) return;

        const name = newName.value.trim();
        const value = newValue.value.trim();

        if (!name || !value) {
            say("Enter both a component name and a value.", true);
            return;
        }

        const lower = name.toLowerCase();

        // already in the list?
        if (rows.some(function (r) { return r.label.toLowerCase() === lower; })) {
            say("Component '" + name + "' already exists. Change its value in the list.", true);
            return;
        }

        // a removed built-in component (phone / email) can be added back
        const aliases = {
            "phone": "phone", "phone number": "phone",
            "email": "email", "email id": "email"
        };

        const core = aliases[lower]
            ? CORE.find(function (d) { return d.label === aliases[lower]; })
            : null;

        if (core) {

            // keep the built-in components in their normal order
            const order = CORE.map(function (d) { return d.label; });
            let at = 0;

            rows.forEach(function (r, i) {
                if (r.kind === "core" &&
                    order.indexOf(r.label) < order.indexOf(core.label)) {
                    at = i + 1;
                }
            });

            rows.splice(at, 0, {
                kind: "core",
                label: core.label,
                field: core.field,
                required: false,
                value: value
            });

        } else {

            rows.push({
                kind: "custom",
                label: name,
                required: false,
                value: value
            });
        }

        newName.value = "";
        newValue.value = "";

        renderRows();

        say("Component '" + name + "' added. Click Save Alteration to store it.");
    }

    addBtn.addEventListener("click", addComponent);

    newValue.addEventListener("keydown", function (event) {
        if (event.key === "Enter") addComponent();
    });


    // ---------- SAVE ALTERATION (PATCH) ----------

    saveAlterBtn.addEventListener("click", async function () {

        if (!loaded) return;

        const body = { remove: [], components: {} };

        for (const row of rows) {

            const value = String(row.value).trim();

            if (!value) {
                say("'" + row.label + "' has no value. Type a value" +
                    (row.required ? "." : " or click Remove."), true);
                return;
            }

            if (row.kind === "core") {
                body[row.field] = value;
            } else {
                body.components[row.label] = value;
            }
        }

        // optional built-in components that are no longer in the list
        ["customerPhone", "customerEmail"].forEach(function (field) {

            if (!(field in body) && loaded[field] !== undefined) {
                body.remove.push(field);
            }
        });

        try {

            const result = await api(
                "/api/customers/" + encodeURIComponent(loaded.customerId),
                jsonOptions("PATCH", body)
            );

            showCustomer(result.customer);

            say(result.message);

            if (result.sync && !result.sync.ok) {
                toast("Saved, but Exp2 was NOT updated: " + result.sync.message, true);
            } else {
                toast(result.message);
            }

            refreshEverywhere();

        } catch (error) {
            say(error.message, true);
        }
    });


    // ---------- DELETE ----------

    deleteBtn.addEventListener("click", function () {

        if (loaded && window.openDeleteFor) {
            window.openDeleteFor(loaded);
        }
    });

    // fired by records.js after a customer is deleted
    document.addEventListener("customer:deleted", function (event) {

        if (loaded && loaded.customerId === event.detail.id) {
            clearPanel();
            idInput.value = "";
            say("Customer " + event.detail.id + " was deleted.");
        }
    });


    clearPanel();
});
