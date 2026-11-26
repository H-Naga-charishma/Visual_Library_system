// ==========================================================
// LIBRARY VISUAL STORAGE SYSTEM - EXPERIMENT 3 (BACKEND)
//
// Data files (all inside the Exp3 folder):
//   customers.json  -> master list of customers
//   alter.json      -> log of every update / alteration
//   count.json      -> how many times each customer has been Updated
//                      (the same number is stored on the customer as
//                      "updateCount")
//
// After EVERY change the same customer list is copied to
// Exp2's single data file (customer.json). The path of that
// file is set in config.json -> "exp2CustomerPath"
// (you can paste the Windows "Copy as path" value there).
//
// Express features used:
//   express.json()   middleware
//   express.static() static files
//   express.Router() + router.param()
//   GET / POST / PUT / PATCH / DELETE
//   error-handling middleware
// ==========================================================

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

// ----------------------------------------------------------
// CONFIG
// ----------------------------------------------------------


const PORT = process.env.PORT || 3001;

const customersFile = path.join(__dirname, "customers.json");
const alterFile = path.join(__dirname, "alter.json");
const countFile = path.join(__dirname, "count.json");

// Resolve the Exp2 file path.
// - Accepts the quotes added by Windows "Copy as path"
// - Accepts a relative path (relative to the Exp3 folder)
// - If a folder is given, "customer.json" is added
function resolveExp2Path() {
       return "C:/Users/Dell/Downloads/Exp2/customer.json";

}

const exp2File = resolveExp2Path();

// ----------------------------------------------------------
// VALIDATION RULES (same limits as the front end)
// ----------------------------------------------------------

const MAX_CUPBOARDS = 4;
const MAX_SHELVES = 6;
const MAX_LENGTH = 300;
const MIN_LENGTH = 10;

const MIN_LENGTH_BY_SHELF = {
    1: 40, 2: 70, 3: 100, 4: 130, 5: 160, 6: 190
};

const DOORS = ["hinged", "sliding", "glass", "lifting"];

// Fields that PUT (Update) may change
const UPDATE_FIELDS = [
    "customerPhone",
    "customerEmail",
    "cupboards",
    "shelves"
];

// Fields that PATCH (Alter) may change
const ALTER_FIELDS = [
    "customerName",
    "customerPhone",
    "customerEmail",
    "cupboards",
    "shelves",
    "cupboardLength",
    "door"
];

// requireContact = true  -> phone and email must be present (new customers)
// requireContact = false -> phone / email are optional components, but
//                           if they are present they must be valid
// Names that custom components may not use (they are built-in)
const RESERVED_COMPONENTS = [
    "name", "customer name", "phone", "phone number", "email", "email id",
    "racks", "shelves", "length", "door", "customer id", "customerid", "id",
    "lock", "requestid", "createdat", "updatedat", "components",
    "__proto__", "constructor", "prototype"
];

// Optional built-in components that Alter is allowed to remove
const REMOVABLE_FIELDS = ["customerPhone", "customerEmail"];

// Clean the custom components sent by the client.
// Returns { value } or { error }
function cleanComponents(input) {

    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return { error: "Components must be an object." };
    }

    const clean = {};
    const keys = Object.keys(input);

    if (keys.length > 20) {
        return { error: "A customer can have at most 20 extra components." };
    }

    for (const rawKey of keys) {

        const key = String(rawKey).trim();
        const value = String(input[rawKey] === null ? "" : input[rawKey]).trim();

        if (!key) {
            return { error: "Component name cannot be empty." };
        }

        if (key.length > 40) {
            return { error: "Component name '" + key.slice(0, 15) + "...' is too long (max 40)." };
        }

        if (RESERVED_COMPONENTS.includes(key.toLowerCase())) {
            return { error: "'" + key + "' is a built-in component and cannot be added as a custom one." };
        }

        if (Object.prototype.hasOwnProperty.call(clean, key)) {
            return { error: "Component '" + key + "' is listed twice." };
        }

        if (!value) {
            return { error: "Component '" + key + "' needs a value (or remove it)." };
        }

        if (value.length > 100) {
            return { error: "Value of '" + key + "' is too long (max 100)." };
        }

        clean[key] = value;
    }

    return { value: clean };
}

function validateCustomer(c, requireContact) {

    if (typeof c.customerName !== "string" || c.customerName.trim() === "") {
        return "Customer name is required.";
    }

    const hasPhone = c.customerPhone !== undefined && c.customerPhone !== "";
    const hasEmail = c.customerEmail !== undefined && c.customerEmail !== "";

    if ((requireContact || hasPhone) &&
        !/^[0-9]{10}$/.test(String(c.customerPhone || ""))) {
        return "Phone number must be exactly 10 digits.";
    }

    if ((requireContact || hasEmail) &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(c.customerEmail || ""))) {
        return "Please enter a valid email address.";
    }

    if (!Number.isInteger(c.cupboards) ||
        c.cupboards < 1 || c.cupboards > MAX_CUPBOARDS) {
        return "Number of racks (cupboards) must be between 1 and " +
            MAX_CUPBOARDS + ".";
    }

    if (!Number.isInteger(c.shelves) ||
        c.shelves < 1 || c.shelves > MAX_SHELVES) {
        return "Number of shelves must be between 1 and " +
            MAX_SHELVES + ".";
    }

    const minLength = MIN_LENGTH_BY_SHELF[c.shelves] || MIN_LENGTH;

    if (!Number.isInteger(c.cupboardLength) ||
        c.cupboardLength < minLength || c.cupboardLength > MAX_LENGTH) {
        return "For " + c.shelves + " shelf(s) the cupboard length must be " +
            minLength + " - " + MAX_LENGTH + " cm (current length: " +
            c.cupboardLength + " cm). Use Alter to change the length too.";
    }

    if (!DOORS.includes(c.door)) {
        return "Door type must be one of: " + DOORS.join(", ") + ".";
    }

    return null;
}

// Convert numeric fields that may arrive as strings
function normalise(body) {

    const out = {};

    for (const key of Object.keys(body)) {

        let value = body[key];

        if (["cupboards", "shelves", "cupboardLength"].includes(key) &&
            value !== "" && value !== null && value !== undefined) {
            value = Number(value);
        }

        if (typeof value === "string") {
            value = value.trim();
        }

        out[key] = value;
    }

    return out;
}

// ----------------------------------------------------------
// FILE HELPERS
// ----------------------------------------------------------

function readJson(file) {

    try {
        const data = JSON.parse(fs.readFileSync(file, "utf8"));
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

function writeJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

if (!fs.existsSync(customersFile)) writeJson(customersFile, []);
if (!fs.existsSync(alterFile)) writeJson(alterFile, []);
if (!fs.existsSync(countFile)) writeJson(countFile, []);

// Load customers. Any customer that was added directly through
// Exp2 (and does not exist here yet) is imported, so nothing
// is lost when Exp3 copies its list back to Exp2.
function loadCustomers() {

    const customers = readJson(customersFile);

    const known = new Set(customers.map(c => c.customerId));
    let imported = false;

    if (fs.existsSync(exp2File)) {

        for (const record of readJson(exp2File)) {

            if (record && record.customerId && !known.has(record.customerId)) {
                customers.push(record);
                known.add(record.customerId);
                imported = true;
            }
        }
    }

    if (imported) writeJson(customersFile, customers);

    return customers;
}

// Copy the customer list into Exp2's single data file
function syncToExp2(customers) {

    try {

        if (!fs.existsSync(path.dirname(exp2File))) {
            return {
                ok: false,
                message: "Exp2 folder not found. Check exp2CustomerPath in config.json."
            };
        }

        writeJson(exp2File, customers);

        return { ok: true, message: "Exp2 customer.json updated." };

    } catch (error) {

        console.error("Exp2 sync failed:", error);

        return {
            ok: false,
            message: "Could not write to Exp2 customer.json: " + error.message
        };
    }
}

function nextCustomerId(customers) {

    let max = 0;

    for (const c of customers) {
        const n = parseInt(String(c.customerId).replace(/\D/g, ""), 10);
        if (!isNaN(n) && n > max) max = n;
    }

    return "CUST-" + String(max + 1).padStart(4, "0");
}

// Build a { field: {from, to} } object of what really changed
function diff(before, after, fields) {

    const changes = {};

    for (const f of fields) {

        if (!(f in after)) {

            // field was removed
            if (f in before) {
                changes[f] = { from: before[f], to: null };
            }

        } else if (before[f] !== after[f]) {
            changes[f] = { from: before[f] === undefined ? null : before[f], to: after[f] };
        }
    }

    return changes;
}

// ---------- update counter (count.json) ----------
//
// count.json is a list like:
//   [ { "customerId": "CUST-0002", "updateCount": 3,
//       "lastUpdatedAt": "2026-10-29T10:15:00.000Z" } ]

function getStoredCount(customerId) {

    const entry = readJson(countFile).find(e => e.customerId === customerId);

    return entry ? entry.updateCount : 0;
}

function saveStoredCount(customerId, updateCount, when) {

    const list = readJson(countFile);
    const entry = list.find(e => e.customerId === customerId);

    if (entry) {
        entry.updateCount = updateCount;
        entry.lastUpdatedAt = when;
    } else {
        list.push({
            customerId: customerId,
            updateCount: updateCount,
            lastUpdatedAt: when
        });
    }

    writeJson(countFile, list);
}

function removeStoredCount(customerId) {

    writeJson(
        countFile,
        readJson(countFile).filter(e => e.customerId !== customerId)
    );
}

function logAlteration(customer, type, changes) {

    const log = readJson(alterFile);

    log.push({
        alterId: "ALT-" + Date.now(),
        customerId: customer.customerId,
        customerName: customer.customerName,
        type: type,
        changes: changes,
        alteredAt: new Date().toISOString()
    });

    writeJson(alterFile, log);
}

// ----------------------------------------------------------
// MIDDLEWARE
// ----------------------------------------------------------

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ----------------------------------------------------------
// ROUTER  (mounted at /api)
// ----------------------------------------------------------

const api = express.Router();

// Look up :id once for every route that has it
api.param("id", (req, res, next, id) => {

    const customers = loadCustomers();
    const index = customers.findIndex(c => c.customerId === id);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: "Customer " + id + " was not found."
        });
    }

    req.customers = customers;
    req.index = index;

    next();
});

// ---------- GET all customers ----------
api.get("/customers", (req, res) => {

    let customers = loadCustomers();

    const search = String(req.query.search || "").toLowerCase().trim();

    if (search) {
        customers = customers.filter(c =>
            [c.customerId, c.customerName, c.customerPhone, c.customerEmail]
                .join(" ").toLowerCase().includes(search)
        );
    }

    res.json(customers);
});

// ---------- GET one customer ----------
api.get("/customers/:id", (req, res) => {
    res.json(req.customers[req.index]);
});

// ---------- POST  (add a new customer) ----------
api.post("/customers", (req, res) => {

    const body = normalise(req.body || {});
    const customers = loadCustomers();

    const customer = {
        customerId: nextCustomerId(customers),
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail,
        cupboards: body.cupboards,
        shelves: body.shelves,
        cupboardLength: body.cupboardLength,
        door: body.door,
        lock: "Traditional Key Lock",
        requestId: "REQ-" + Date.now(),
        createdAt: new Date().toISOString()
    };

    const error = validateCustomer(customer, true);

    if (error) {
        return res.status(400).json({ success: false, message: error });
    }

    customers.push(customer);
    writeJson(customersFile, customers);

    const sync = syncToExp2(customers);

    res.status(201).json({
        success: true,
        customerId: customer.customerId,
        requestId: customer.requestId,
        message: "Order saved successfully",
        customer,
        sync
    });
});

// ---------- PUT  (UPDATE phone, email, racks, shelves) ----------
api.put("/customers/:id", (req, res) => {

    const body = normalise(req.body || {});

    const unknown = Object.keys(body).filter(k => !UPDATE_FIELDS.includes(k));

    if (unknown.length) {
        return res.status(400).json({
            success: false,
            message: "Update can only change phone, email, racks and shelves. " +
                "Use Alter for: " + unknown.join(", ") + "."
        });
    }

    for (const f of ["customerPhone", "customerEmail"]) {
        if (f in body && body[f] === "") {
            return res.status(400).json({
                success: false,
                message: (f === "customerPhone" ? "Phone number" : "Email ID") +
                    " cannot be empty in an Update. Use Alter to remove it."
            });
        }
    }

    const provided = UPDATE_FIELDS.filter(f => f in body);

    if (!provided.length) {
        return res.status(400).json({
            success: false,
            message: "Nothing to update."
        });
    }

    const before = req.customers[req.index];
    const after = Object.assign({}, before, body, {
        updatedAt: new Date().toISOString()
    });

    const error = validateCustomer(after, false);

    if (error) {
        return res.status(400).json({ success: false, message: error });
    }

    const changes = diff(before, after, UPDATE_FIELDS);

    if (!Object.keys(changes).length) {
        return res.json({
            success: true,
            changed: false,
            customerId: before.customerId,
            updateCount: Number.isInteger(before.updateCount)
                ? before.updateCount
                : getStoredCount(before.customerId),
            message: "No changes detected - nothing was saved.",
            customer: before
        });
    }

    // A real Update happened: count it.
    // updateCount is saved on the customer (customers.json) and
    // in count.json.
    const previousCount = Number.isInteger(before.updateCount)
        ? before.updateCount
        : getStoredCount(before.customerId);

    after.updateCount = previousCount + 1;

    req.customers[req.index] = after;
    writeJson(customersFile, req.customers);

    saveStoredCount(after.customerId, after.updateCount, after.updatedAt);

    // Updates are NOT logged in alter.json - only Alter (PATCH) is

    const sync = syncToExp2(req.customers);

    res.json({
        success: true,
        changed: true,
        customerId: after.customerId,
        updateCount: after.updateCount,
        message: "Customer updated successfully.",
        changes,
        customer: after,
        sync
    });
});

// ---------- PATCH  (ALTER customer / rack details) ----------
api.patch("/customers/:id", (req, res) => {

    const body = normalise(req.body || {});

    // only the allowed fields are taken, everything else is ignored
    const picked = {};

    for (const f of ALTER_FIELDS) {
        if (f in body) picked[f] = body[f];
    }

    // components the client wants to remove (optional ones only)
    const remove = Array.isArray(body.remove) ? body.remove.slice() : [];

    // an empty phone / email value also means "remove it"
    for (const f of REMOVABLE_FIELDS) {
        if (f in picked && picked[f] === "") {
            delete picked[f];
            if (!remove.includes(f)) remove.push(f);
        }
    }

    const badRemove = remove.filter(f => !REMOVABLE_FIELDS.includes(f));

    if (badRemove.length) {
        return res.status(400).json({
            success: false,
            message: "These components are required and cannot be removed: " +
                badRemove.join(", ") + "."
        });
    }

    const before = req.customers[req.index];

    const after = Object.assign({}, before, picked, {
        updatedAt: new Date().toISOString()
    });

    for (const f of remove) {
        delete after[f];
    }

    // custom components: the list sent replaces the stored list
    if ("components" in body) {

        const cleaned = cleanComponents(body.components);

        if (cleaned.error) {
            return res.status(400).json({ success: false, message: cleaned.error });
        }

        if (Object.keys(cleaned.value).length) {
            after.components = cleaned.value;
        } else {
            delete after.components;
        }
    }

    const error = validateCustomer(after, false);

    if (error) {
        return res.status(400).json({ success: false, message: error });
    }

    const changes = diff(before, after, ALTER_FIELDS);

    // changes in custom components are logged as "component: <name>"
    const oldComp = before.components || {};
    const newComp = after.components || {};

    for (const key of new Set(Object.keys(oldComp).concat(Object.keys(newComp)))) {

        const from = key in oldComp ? oldComp[key] : null;
        const to = key in newComp ? newComp[key] : null;

        if (from !== to) {
            changes["component: " + key] = { from: from, to: to };
        }
    }

    if (!Object.keys(changes).length) {
        return res.json({
            success: true,
            changed: false,
            customerId: before.customerId,
            message: "No changes detected - nothing was saved.",
            customer: before
        });
    }

    req.customers[req.index] = after;
    writeJson(customersFile, req.customers);

    logAlteration(after, "alter", changes);

    const sync = syncToExp2(req.customers);

    res.json({
        success: true,
        changed: true,
        customerId: after.customerId,
        message: "Alteration saved to alter.json.",
        changes,
        customer: after,
        sync
    });
});

// ---------- DELETE ----------
// Removes EVERY trace of the customer:
//   customers.json, alter.json, count.json and Exp2 customer.json
api.delete("/customers/:id", (req, res) => {

    const id = req.params.id;
    const removed = req.customers[req.index];

    // customers.json (filter removes every record with this id)
    const remaining = req.customers.filter(c => c.customerId !== id);
    writeJson(customersFile, remaining);

    // alter.json
    const log = readJson(alterFile).filter(e => e.customerId !== id);
    writeJson(alterFile, log);

    // count.json (otherwise a new customer that gets this same ID
    // later would inherit the old update count)
    removeStoredCount(id);

    // Exp2 customer.json
    const sync = syncToExp2(remaining);

    res.json({
        success: true,
        customerId: id,
        message: "Customer " + id + " (" + removed.customerName +
            ") was deleted from all files.",
        sync
    });
});

// ---------- GET alteration log ----------
api.get("/alter", (req, res) => {

    let log = readJson(alterFile);

    if (req.query.customerId) {
        log = log.filter(e => e.customerId === req.query.customerId);
    }

    res.json(log);
});

// ---------- GET status (where is the Exp2 copy?) ----------
api.get("/status", (req, res) => {

    res.json({
        exp2File,
        exp2Found: fs.existsSync(exp2File),
        exp2FolderFound: fs.existsSync(path.dirname(exp2File))
    });
});

app.use("/api", api);

// Unknown /api route
app.use("/api", (req, res) => {
    res.status(404).json({ success: false, message: "API route not found." });
});

// ----------------------------------------------------------
// ERROR HANDLER (also catches bad JSON bodies)
// ----------------------------------------------------------

app.use((err, req, res, next) => {

    console.error(err);

    const status = err.status || err.statusCode || 500;

    res.status(status).json({
        success: false,
        message: status === 400 ? "Invalid request data." : "Server error."
    });
});

// ----------------------------------------------------------
// START
// ----------------------------------------------------------

const server = app.listen(PORT, function (error) {

    // Express 5 passes a start-up error (such as "port in use") to this
    // callback. Without this check a false "running" message is printed.
    if (error) {
        return reportStartError(error);
    }

    console.log("Library Configurator (Exp3) running at http://localhost:" + PORT);
    console.log("Exp2 data file: " + exp2File +
        (fs.existsSync(exp2File) ? "" : "  (NOT FOUND - check config.json)"));
});

// Errors that happen later (or on older Express versions)
server.on("error", reportStartError);

function reportStartError(error) {

    if (error.code === "EADDRINUSE") {

        console.error("");
        console.error("ERROR: Port " + PORT + " is already in use.");
        console.error("Most likely another copy of server.js (or another program) is");
        console.error("already running on this port. Fix it with ONE of these:");
        console.error("  1. Close the other terminal running server.js (press Ctrl+C there).");
        console.error("  2. Start on a different port:");
        console.error("       Windows PowerShell :  $env:PORT=3002; node server.js");
        console.error("       Windows cmd        :  set PORT=3002 && node server.js");
        console.error("       Mac / Linux        :  PORT=3002 node server.js");
        console.error("     (or change \"port\" in config.json)");
        console.error("  3. Find what is using the port (Windows):  netstat -ano | findstr :" + PORT);
        console.error("");

    } else if (error.code === "EACCES") {

        console.error("");
        console.error("ERROR: Permission denied for port " + PORT + ".");
        console.error("Use a port above 1024, e.g. 3001, in config.json or with PORT=3001.");
        console.error("");

    } else {

        console.error("ERROR: The server could not start: " + error.message);
    }

    process.exit(1);
}
