// ==========================================================
// LIBRARY VISUAL STORAGE SYSTEM - EXPERIMENT 3 (REACT FRONT END)
//
// This single file replaces script.js, records.js and manage.js.
//
// From the Module 4 slides:
//   - Slide 13 (React State):  const [value, setValue] = useState(initial)
//                              state is never changed directly - only
//                              through its setter (setValue)
//   - Slide 15 (Events in JSX): onClick={handleClick} / onChange={...}
//                              a function is PASSED, never called while
//                              rendering (not onClick={handleClick()})
//
// In a bundler project you would write:
//     import { useState, useEffect, useRef } from 'react';
// Here React is loaded by index.html as a global, so the same Hooks
// are taken from it like this:
// ==========================================================

const { useState, useEffect, useRef } = React;


// ==========================================================
// LIMITS (same as server.js)
// ==========================================================

const MAX_CUPBOARDS = 4;
const MAX_SHELVES = 6;
const MAX_LENGTH = 300;
const MIN_LENGTH = 10;

// Minimum cupboard length (cm) for each shelf count
const MIN_LENGTH_BY_SHELF = { 1: 40, 2: 70, 3: 100, 4: 130, 5: 160, 6: 190 };

const DOORS = ["hinged", "sliding", "glass", "lifting"];

const DOOR_LABELS = {
    hinged: "Hinged Door",
    sliding: "Sliding Door",
    glass: "Glass Door",
    lifting: "Lifting Door (Shelf-by-Shelf)"
};

const DOOR_NAMES = {
    hinged: "Hinged",
    sliding: "Sliding",
    glass: "Glass",
    lifting: "Lifting"
};

const DOOR_SUMMARY = {
    hinged: "Hinged Wooden Doors",
    sliding: "Sliding Doors",
    glass: "Glass Frame Doors",
    lifting: "Lifting Doors (Shelf-by-Shelf)"
};

const BOOK_CLASSES = [
    "b-leather", "b-navy", "b-gold", "b-emerald", "b-plum", "b-teal"
];

// Built-in components of a customer, in display order
const CORE = [
    { label: "name", field: "customerName", required: true },
    { label: "phone", field: "customerPhone", required: false },
    { label: "email", field: "customerEmail", required: false },
    { label: "shelves", field: "shelves", required: true },
    { label: "racks", field: "cupboards", required: true },
    { label: "length", field: "cupboardLength", required: true },
    { label: "door", field: "door", required: true }
];


// ==========================================================
// SMALL HELPERS (plain functions, no state)
// ==========================================================

// "12" -> 12,  "" -> null,  "2.5" -> null,  "abc" -> null
function toInteger(text) {

    const trimmed = String(text).trim();

    if (trimmed === "") {
        return null;
    }

    const number = Number(trimmed);

    return Number.isInteger(number) ? number : null;
}

function minimumLengthFor(shelfCount) {

    if (shelfCount !== null && MIN_LENGTH_BY_SHELF[shelfCount]) {
        return MIN_LENGTH_BY_SHELF[shelfCount];
    }

    return MIN_LENGTH;
}

// Height of one drawn cupboard in px, from its length in cm.
// Returns null when there is no length yet (CSS default height is used).
function visualHeightFor(cupboardLength, shelfCount) {

    if (cupboardLength === null) {
        return null;
    }

    const minimumLength = minimumLengthFor(shelfCount);
    const minimumVisualHeight = 220;
    const maximumVisualHeight = 560;

    const ratio = (cupboardLength - minimumLength) / (MAX_LENGTH - minimumLength);
    const safeRatio = Math.max(0, Math.min(1, ratio));

    return minimumVisualHeight +
        safeRatio * (maximumVisualHeight - minimumVisualHeight);
}

async function api(url, options) {

    const response = await fetch(url, options);

    let data;

    try {
        data = await response.json();
    } catch (error) {
        throw new Error(
            "Server returned an unexpected response. " +
            "Make sure Node.js is running with: node server.js"
        );
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


// ==========================================================
// SMALL DISPLAY COMPONENTS
// ==========================================================

// Popup used for warnings, confirmations and the Update thank-you.
// "popup" is null (hidden) or { title, message }.
// message can be a string or an array of lines.
function Popup(props) {

    if (!props.popup) {
        return null;
    }

    const lines = Array.isArray(props.popup.message)
        ? props.popup.message
        : [props.popup.message];

    return (
        <div id="custom-popup-overlay" className="custom-popup-overlay show">
            <div className="custom-popup">

                <h3 id="popup-title">{props.popup.title}</h3>

                <p id="popup-message">
                    {lines.map(function (line, index) {
                        return (
                            <span key={index}>
                                {index > 0 ? <br /> : null}
                                {line}
                            </span>
                        );
                    })}
                </p>

                <button id="popup-ok" onClick={props.onOk}>OK</button>

            </div>
        </div>
    );
}

function Toast(props) {

    const classes = "toast" +
        (props.toast.show ? " show" : "") +
        (props.toast.isError ? " error" : "");

    return <div id="toast" className={classes}>{props.toast.text}</div>;
}


// One drawn cupboard. Each sliding door remembers if it was clicked open.
function Cupboard(props) {

    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);

    const isSliding = props.door === "sliding";
    const isLifting = props.door === "lifting";

    function handleLeftClick() {
        if (isSliding) {
            setLeftOpen(!leftOpen);
        }
    }

    function handleRightClick() {
        if (isSliding) {
            setRightOpen(!rightOpen);
        }
    }

    const shelves = [];

    for (let i = 1; i <= props.shelfCount; i++) {

        const books = [];
        const booksToCreate = 3 + (i % 3);

        for (let j = 0; j < booksToCreate; j++) {
            books.push(
                <div
                    key={j}
                    className={"book " + BOOK_CLASSES[(j + i) % BOOK_CLASSES.length]}
                ></div>
            );
        }

        shelves.push(
            <div key={i} className="shelf" data-shelf={i}>
                <div className="books">{books}</div>
                {isLifting ? <div className="shelf-door">{"Shelf " + i}</div> : null}
            </div>
        );
    }

    const style = props.heightPx === null ? undefined : { height: props.heightPx + "px" };

    return (
        <div className="cupboard-unit" data-cupboard={props.number} style={style}>

            {shelves}

            {isLifting ? null : (
                <div
                    className={"door-panel left" + (isSliding && leftOpen ? " touch-open" : "")}
                    onClick={handleLeftClick}
                ></div>
            )}

            {isLifting ? null : (
                <div
                    className={"door-panel right" + (isSliding && rightOpen ? " touch-open" : "")}
                    onClick={handleRightClick}
                >
                    <div className="lock-hardware">🔑 Key</div>
                </div>
            )}

        </div>
    );
}


// ==========================================================
// THE APP - all page state lives here (useState)
// ==========================================================

function App() {

    // ------------------------------------------------------
    // STATE: design form (left panel)
    // The boxes keep exactly what was typed (text). The numbers
    // used by the drawing and summary are worked out from that
    // text on every render, so they can never go out of date.
    // ------------------------------------------------------

    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [cupboardText, setCupboardText] = useState("");
    const [shelfText, setShelfText] = useState("");
    const [lengthText, setLengthText] = useState("");
    const [door, setDoor] = useState("hinged");

    // customer shown in the Order Summary / customer being altered
    const [currentCustomerId, setCurrentCustomerId] = useState(null);
    const [alterCustomerId, setAlterCustomerId] = useState(null);


    // ------------------------------------------------------
    // STATE: popup + toast
    // ------------------------------------------------------

    const [popup, setPopup] = useState(null);
    const [toast, setToast] = useState({ text: "", isError: false, show: false });


    // ------------------------------------------------------
    // STATE: customer records table
    // ------------------------------------------------------

    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [syncStatus, setSyncStatus] = useState({ text: "", warn: false });

    const [updateTarget, setUpdateTarget] = useState(null);   // customer being updated
    const [updPhone, setUpdPhone] = useState("");
    const [updEmail, setUpdEmail] = useState("");
    const [updRacks, setUpdRacks] = useState("");
    const [updShelves, setUpdShelves] = useState("");
    const [updateError, setUpdateError] = useState("");

    const [deleteTarget, setDeleteTarget] = useState(null);   // customer being deleted


    // ------------------------------------------------------
    // STATE: Update / Alter panel
    // ------------------------------------------------------

    const [mId, setMId] = useState("");
    const [loaded, setLoaded] = useState(null);                // loaded customer
    const [mName, setMName] = useState("");
    const [mPhone, setMPhone] = useState("");
    const [mEmail, setMEmail] = useState("");
    const [mRacks, setMRacks] = useState("");
    const [mShelves, setMShelves] = useState("");
    const [rows, setRows] = useState([]);                      // component rows
    const [newCompName, setNewCompName] = useState("");
    const [newCompValue, setNewCompValue] = useState("");
    const [mMessage, setMMessage] = useState({ text: "", isError: false });


    // ------------------------------------------------------
    // REFS (not state): input boxes to focus, timers, request counter
    // ------------------------------------------------------

    const fieldRefs = useRef({});
    const searchRef = useRef("");
    const searchTimer = useRef(null);
    const toastTimer = useRef(null);
    const loadTicket = useRef(0);

    function keepRef(name) {
        return function (element) {
            fieldRefs.current[name] = element;
        };
    }


    // ------------------------------------------------------
    // VALUES WORKED OUT FROM THE STATE
    // ------------------------------------------------------

    let cupboardCount = toInteger(cupboardText);
    if (cupboardCount !== null && (cupboardCount < 1 || cupboardCount > MAX_CUPBOARDS)) {
        cupboardCount = null;
    }

    let shelfCount = toInteger(shelfText);
    if (shelfCount !== null && (shelfCount < 1 || shelfCount > MAX_SHELVES)) {
        shelfCount = null;
    }

    // While typing, only the maximum is enforced here;
    // the minimum is checked when the box loses focus.
    let cupboardLength = toInteger(lengthText);
    if (cupboardLength !== null && cupboardLength > MAX_LENGTH) {
        cupboardLength = null;
    }

    const heightPx = visualHeightFor(cupboardLength, shelfCount);


    // ------------------------------------------------------
    // POPUP + TOAST
    // ------------------------------------------------------

    // options.clear : box to empty (and focus) when OK is pressed
    // options.focus : box to focus when OK is pressed
    function showPopup(title, message, options) {

        const extra = options || {};

        setPopup({
            title: title,
            message: message,
            clear: extra.clear || null,
            focus: extra.focus || null
        });
    }

    function handlePopupOk() {

        const closing = popup;

        setPopup(null);

        if (!closing) {
            return;
        }

        if (closing.clear === "cupboards") setCupboardText("");
        if (closing.clear === "shelves") setShelfText("");
        if (closing.clear === "length") setLengthText("");

        const target = closing.clear || closing.focus;

        if (target && fieldRefs.current[target]) {
            fieldRefs.current[target].focus();
        }
    }

    function showToast(text, isError) {

        setToast({ text: text, isError: !!isError, show: true });

        clearTimeout(toastTimer.current);

        toastTimer.current = setTimeout(function () {
            setToast(function (old) {
                return { text: old.text, isError: old.isError, show: false };
            });
        }, 3500);
    }


    // ------------------------------------------------------
    // LOAD THE RECORDS TABLE
    // ------------------------------------------------------

    async function loadAll() {

        const ticket = loadTicket.current + 1;
        loadTicket.current = ticket;

        const query = searchRef.current.trim();

        try {

            const list = await api(
                "/api/customers" + (query ? "?search=" + encodeURIComponent(query) : "")
            );

            const status = await api("/api/status");

            // a newer request was started meanwhile - ignore this old answer
            if (ticket !== loadTicket.current) {
                return;
            }

            setCustomers(list);

            setSyncStatus({
                warn: !status.exp2FolderFound,
                text: status.exp2FolderFound
                    ? "Every change is copied to Exp2 file: " + status.exp2File
                    : "Exp2 folder not found: " + status.exp2File +
                      " - fix exp2CustomerPath in config.json"
            });

        } catch (error) {
            showToast(error.message, true);
        }
    }

    // runs once, when the page first appears
    useEffect(function () {
        loadAll();
    }, []);

    // Escape closes the Update and Delete windows
    useEffect(function () {

        function handleKey(event) {
            if (event.key === "Escape") {
                setUpdateTarget(null);
                setDeleteTarget(null);
            }
        }

        document.addEventListener("keydown", handleKey);

        return function () {
            document.removeEventListener("keydown", handleKey);
        };
    }, []);


    // ------------------------------------------------------
    // DESIGN FORM: onChange handlers
    // ------------------------------------------------------

    function handleNameChange(event) {
        setCustomerName(event.target.value);
    }

    function handlePhoneChange(event) {
        setCustomerPhone(event.target.value);
    }

    function handleEmailChange(event) {
        setCustomerEmail(event.target.value);
    }

    function handleCupboardChange(event) {

        const value = event.target.value;

        setCupboardText(value);

        if (value.trim() === "") {
            return;
        }

        const number = toInteger(value);

        if (number === null || number < 1 || number > MAX_CUPBOARDS) {
            showPopup(
                "⚠️ Caution: Invalid Input",
                "Please enter the number of cupboards between 1 and 4.",
                { clear: "cupboards" }
            );
        }
    }

    function handleShelfChange(event) {

        const value = event.target.value;

        setShelfText(value);

        if (value.trim() === "") {
            return;
        }

        const number = toInteger(value);

        if (number === null || number < 1 || number > MAX_SHELVES) {
            showPopup(
                "⚠️ Caution: Invalid Input",
                "Please enter the number of shelves between 1 and 6.",
                { clear: "shelves" }
            );
        }
    }

    function handleLengthChange(event) {

        const value = event.target.value;

        setLengthText(value);

        if (value.trim() === "") {
            return;
        }

        // Only the MAXIMUM is checked while typing, so 4 -> 40 -> 100
        // can be typed without a minimum-length popup.
        const number = toInteger(value);

        if (number === null || number > MAX_LENGTH) {
            showPopup(
                "⚠️ Caution: Invalid Input",
                "Please enter a cupboard length up to 300 cm.",
                { clear: "length" }
            );
        }
    }

    // minimum length is checked when the length box loses focus
    function handleLengthBlur() {

        if (lengthText.trim() === "") {
            return;
        }

        const number = toInteger(lengthText);
        const minimumRequiredLength = minimumLengthFor(shelfCount);

        if (number === null || number < minimumRequiredLength || number > MAX_LENGTH) {
            showPopup(
                "⚠️ Caution: Invalid Input",
                "For " + (shelfCount || "the selected") +
                " shelf(s), the minimum cupboard length is " +
                minimumRequiredLength + " cm. Maximum allowed is 300 cm.",
                { clear: "length" }
            );
        }
    }


    // ------------------------------------------------------
    // ALTER MODE (a saved customer is shown in the form)
    // ------------------------------------------------------

    function clearDesign() {

        setCustomerName("");
        setCustomerPhone("");
        setCustomerEmail("");
        setCupboardText("");
        setShelfText("");
        setLengthText("");
        setDoor("hinged");

        if (fieldRefs.current.name) {
            fieldRefs.current.name.focus();
        }
    }

    function leaveAlterMode() {

        setAlterCustomerId(null);
        setCurrentCustomerId(null);

        clearDesign();
    }

    function loadForAlter(record) {

        setCustomerName(record.customerName || "");
        setCustomerPhone(record.customerPhone || "");
        setCustomerEmail(record.customerEmail || "");
        setCupboardText(String(record.cupboards));
        setShelfText(String(record.shelves));
        setLengthText(String(record.cupboardLength));
        setDoor(record.door || "hinged");

        setAlterCustomerId(record.customerId);
        setCurrentCustomerId(record.customerId);

        window.scrollTo({ top: 0, behavior: "smooth" });
    }


    // ------------------------------------------------------
    // ACCEPT DESIGN / SAVE ALTERED DESIGN
    // ------------------------------------------------------

    async function handleAccept() {

        const name = customerName.trim();
        const phone = customerPhone.trim();
        const email = customerEmail.trim();

        if (name === "") {
            showPopup("⚠️ Caution", "Please enter the customer name.", { focus: "name" });
            return;
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            showPopup("⚠️ Caution", "Please enter a valid 10-digit phone number.", { focus: "phone" });
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showPopup("⚠️ Caution", "Please enter a valid email address.", { focus: "email" });
            return;
        }

        const cupboards = toInteger(cupboardText);

        if (cupboards === null || cupboards < 1 || cupboards > MAX_CUPBOARDS) {
            showPopup(
                "⚠️ Caution",
                "Please enter a valid number of cupboards between 1 and 4.",
                { focus: "cupboards" }
            );
            return;
        }

        const shelves = toInteger(shelfText);

        if (shelves === null || shelves < 1 || shelves > MAX_SHELVES) {
            showPopup(
                "⚠️ Caution",
                "Please enter a valid number of shelves between 1 and 6.",
                { focus: "shelves" }
            );
            return;
        }

        const length = toInteger(lengthText);
        const minimumRequiredLength = minimumLengthFor(shelves);

        if (length === null || length < minimumRequiredLength || length > MAX_LENGTH) {
            showPopup(
                "⚠️ Caution",
                "For " + shelves + " shelf(s), the minimum cupboard length is " +
                minimumRequiredLength + " cm. Maximum allowed is 300 cm.",
                { focus: "length" }
            );
            return;
        }

        const isAlterSave = alterCustomerId !== null;

        try {

            const result = await api(
                isAlterSave
                    ? "/api/customers/" + encodeURIComponent(alterCustomerId)
                    : "/api/customers",
                jsonOptions(isAlterSave ? "PATCH" : "POST", {
                    customerName: name,
                    customerPhone: phone,
                    customerEmail: email,
                    cupboards: cupboards,
                    shelves: shelves,
                    cupboardLength: length,
                    door: door
                })
            );

            const id = result.customerId;

            const syncNote = (result.sync && !result.sync.ok)
                ? " Warning: " + result.sync.message
                : "";

            if (isAlterSave) {

                showPopup(
                    result.changed === false ? "ℹ️ No Changes" : "✅ Alteration Saved",
                    result.message + " Customer ID: " + id + syncNote
                );

            } else {

                showPopup(
                    "🎉 Order Confirmed!",
                    "Thank you, " + name + "! Your library storage request " +
                    "has been successfully recorded. Customer ID: " + id + syncNote
                );
            }

            // From now on this design belongs to a saved customer,
            // so Accept saves an alteration instead of a duplicate.
            setCurrentCustomerId(id);
            setAlterCustomerId(id);

            loadAll();

        } catch (error) {
            showPopup("❌ Error", error.message);
        }
    }

    function handleRedesign() {

        const hadCustomer = currentCustomerId;

        leaveAlterMode();

        if (hadCustomer) {
            showPopup(
                "🔄 Redesign Started",
                "The saved request for " + hadCustomer +
                " is unchanged. You can now create a design for a new customer. " +
                "To modify a saved customer, use Alter in the Customer Records table."
            );
        }
    }


    // ------------------------------------------------------
    // THANK-YOU POPUP AFTER ANY UPDATE
    // ------------------------------------------------------

    function showUpdatePopup(result) {

        const customer = result.customer;

        const lines = [
            "Customer ID: " + customer.customerId,
            "Customer Name: " + customer.customerName,
            "Update Count: " + result.updateCount
        ];

        if (result.sync && !result.sync.ok) {
            lines.push("Warning: Exp2 was NOT updated - " + result.sync.message);
        }

        if (result.changed === false) {

            lines.unshift("No changes were detected, so nothing was saved.");
            showPopup("ℹ️ No Changes", lines);

        } else {

            lines.unshift("Thank you! The customer details were updated successfully.");
            showPopup("🙏 Thank You!", lines);
        }
    }


    // ------------------------------------------------------
    // RECORDS TABLE: search, Update (PUT), Alter, Delete
    // ------------------------------------------------------

    function handleSearchChange(event) {

        const value = event.target.value;

        setSearch(value);
        searchRef.current = value;

        // wait until the user stops typing
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(loadAll, 250);
    }

    function openUpdate(customer) {

        setUpdateTarget(customer);
        setUpdPhone(customer.customerPhone || "");
        setUpdEmail(customer.customerEmail || "");
        setUpdRacks(String(customer.cupboards));
        setUpdShelves(String(customer.shelves));
        setUpdateError("");
    }

    function closeUpdate() {
        setUpdateTarget(null);
    }

    async function handleUpdateSave() {

        setUpdateError("");

        const id = updateTarget.customerId;

        try {

            const result = await api(
                "/api/customers/" + encodeURIComponent(id),
                jsonOptions("PUT", {
                    customerPhone: updPhone.trim(),
                    customerEmail: updEmail.trim(),
                    cupboards: updRacks.trim(),
                    shelves: updShelves.trim()
                })
            );

            closeUpdate();

            if (result.sync && !result.sync.ok) {
                showToast("Saved, but Exp2 was NOT updated: " + result.sync.message, true);
            }

            showUpdatePopup(result);

            // keep the other places that show this customer up to date
            if (alterCustomerId === id && result.customer) {
                loadForAlter(result.customer);
            }

            if (loaded && loaded.customerId === id && result.customer) {
                showCustomer(result.customer);
            }

            loadAll();

        } catch (error) {
            setUpdateError(error.message);
        }
    }

    function openDelete(customer) {
        setDeleteTarget(customer);
    }

    function closeDelete() {
        setDeleteTarget(null);
    }

    async function handleDeleteConfirm() {

        const id = deleteTarget.customerId;

        try {

            const result = await api(
                "/api/customers/" + encodeURIComponent(id),
                { method: "DELETE" }
            );

            closeDelete();

            // clear the designer if it was showing this customer
            if (alterCustomerId === id) {
                leaveAlterMode();
            }

            // clear the Update / Alter panel if it had this customer loaded
            if (loaded && loaded.customerId === id) {
                clearPanel();
                setMId("");
                setMMessage({ text: "Customer " + id + " was deleted.", isError: false });
            }

            if (result.sync && !result.sync.ok) {
                showToast("Saved, but Exp2 was NOT updated: " + result.sync.message, true);
            } else {
                showToast(result.message);
            }

            loadAll();

        } catch (error) {
            closeDelete();
            showToast(error.message, true);
            loadAll();
        }
    }


    // ------------------------------------------------------
    // UPDATE / ALTER PANEL
    // ------------------------------------------------------

    function say(text, isError) {
        setMMessage({ text: text || "", isError: !!isError });
    }

    function buildRows(customer) {

        const list = [];

        CORE.forEach(function (def) {

            if (customer[def.field] !== undefined && customer[def.field] !== null) {
                list.push({
                    kind: "core",
                    label: def.label,
                    field: def.field,
                    required: def.required,
                    value: String(customer[def.field])
                });
            }
        });

        const extra = customer.components || {};

        Object.keys(extra).forEach(function (key) {
            list.push({
                kind: "custom",
                label: key,
                required: false,
                value: String(extra[key])
            });
        });

        return list;
    }

    function showCustomer(customer) {

        setLoaded(customer);

        setMId(customer.customerId);
        setMName(customer.customerName || "");
        setMPhone(customer.customerPhone || "");
        setMEmail(customer.customerEmail || "");
        setMRacks(String(customer.cupboards));
        setMShelves(String(customer.shelves));

        setRows(buildRows(customer));
    }

    function clearPanel() {

        setLoaded(null);

        setMName("");
        setMPhone("");
        setMEmail("");
        setMRacks("");
        setMShelves("");

        setRows([]);
        setNewCompName("");
        setNewCompValue("");
    }

    async function handleLoad() {

        const id = mId.trim().toUpperCase();

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
            setMId(id);
            say(error.message, true);
        }
    }

    function handleIdKeyDown(event) {
        if (event.key === "Enter") {
            handleLoad();
        }
    }

    async function handleSaveUpdate() {

        if (!loaded) {
            return;
        }

        const body = {
            cupboards: mRacks.trim(),
            shelves: mShelves.trim()
        };

        // phone / email are only sent when something is typed
        if (mPhone.trim()) body.customerPhone = mPhone.trim();
        if (mEmail.trim()) body.customerEmail = mEmail.trim();

        try {

            const result = await api(
                "/api/customers/" + encodeURIComponent(loaded.customerId),
                jsonOptions("PUT", body)
            );

            showCustomer(result.customer);

            say(result.message);

            if (result.sync && !result.sync.ok) {
                showToast("Saved, but Exp2 was NOT updated: " + result.sync.message, true);
            }

            showUpdatePopup(result);

            if (alterCustomerId === result.customer.customerId) {
                loadForAlter(result.customer);
            }

            loadAll();

        } catch (error) {
            say(error.message, true);
        }
    }

    // typing in the Value box of one component row
    function handleRowValueChange(index, newValue) {

        setRows(rows.map(function (row, i) {
            return i === index ? Object.assign({}, row, { value: newValue }) : row;
        }));
    }

    function handleRemoveRow(index) {

        const removed = rows[index];

        setRows(rows.filter(function (row, i) {
            return i !== index;
        }));

        say("Component '" + removed.label + "' removed. Click Save Alteration to store the change.");
    }

    function handleAddComponent() {

        if (!loaded) {
            return;
        }

        const name = newCompName.trim();
        const value = newCompValue.trim();

        if (!name || !value) {
            say("Enter both a component name and a value.", true);
            return;
        }

        const lower = name.toLowerCase();

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

        const next = rows.slice();

        if (core) {

            // keep the built-in components in their normal order
            const order = CORE.map(function (d) { return d.label; });
            let at = 0;

            next.forEach(function (r, i) {
                if (r.kind === "core" &&
                    order.indexOf(r.label) < order.indexOf(core.label)) {
                    at = i + 1;
                }
            });

            next.splice(at, 0, {
                kind: "core",
                label: core.label,
                field: core.field,
                required: false,
                value: value
            });

        } else {

            next.push({
                kind: "custom",
                label: name,
                required: false,
                value: value
            });
        }

        setRows(next);
        setNewCompName("");
        setNewCompValue("");

        say("Component '" + name + "' added. Click Save Alteration to store it.");
    }

    function handleNewValueKeyDown(event) {
        if (event.key === "Enter") {
            handleAddComponent();
        }
    }

    async function handleSaveAlteration() {

        if (!loaded) {
            return;
        }

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
                showToast("Saved, but Exp2 was NOT updated: " + result.sync.message, true);
            } else {
                showToast(result.message);
            }

            if (alterCustomerId === result.customer.customerId) {
                loadForAlter(result.customer);
            }

            loadAll();

        } catch (error) {
            say(error.message, true);
        }
    }

    function handleDeleteFromPanel() {
        if (loaded) {
            openDelete(loaded);
        }
    }


    // ------------------------------------------------------
    // WHAT THE ORDER SUMMARY SHOWS
    // ------------------------------------------------------

    const cupboardsToDraw = [];

    if (cupboardCount !== null && shelfCount !== null) {
        for (let i = 1; i <= cupboardCount; i++) {
            cupboardsToDraw.push(
                <Cupboard
                    key={door + "-" + shelfCount + "-" + i}
                    number={i}
                    shelfCount={shelfCount}
                    door={door}
                    heightPx={heightPx}
                />
            );
        }
    }

    const panelOff = !loaded;


    // ------------------------------------------------------
    // THE PAGE
    // ------------------------------------------------------

    return (
        <>

            <h1>Library Visual Storage System</h1>

            {/* DOOR SELECTION (hidden radios - style.css reads the checked one) */}
            {DOORS.map(function (name) {
                return (
                    <input
                        key={name}
                        type="radio"
                        name="door_select"
                        id={"door-" + name}
                        checked={door === name}
                        onChange={function () { setDoor(name); }}
                    />
                );
            })}

            {/* ALTER MODE BANNER */}
            <div id="alter-banner" className={"alter-banner" + (alterCustomerId ? " show" : "")}>
                <span id="alter-banner-text">
                    {alterCustomerId
                        ? "Altering saved customer " + alterCustomerId +
                          ". Changes are saved to the same record and logged in alter.json."
                        : ""}
                </span>
                <button id="alter-cancel-btn" type="button" onClick={leaveAlterMode}>
                    Done / New Customer
                </button>
            </div>

            <div className="container">

                {/* ================= LEFT PANEL ================= */}

                <div className="panel">

                    <h2>Customer &amp; Configuration</h2>

                    <div className="form-group">
                        <label htmlFor="customer-name">Customer Name:</label>
                        <input
                            type="text"
                            id="customer-name"
                            className="text-input"
                            placeholder="Enter customer name"
                            ref={keepRef("name")}
                            value={customerName}
                            onChange={handleNameChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="customer-phone">Phone Number:</label>
                        <input
                            type="tel"
                            id="customer-phone"
                            className="text-input"
                            placeholder="Enter 10-digit phone number"
                            maxLength={10}
                            ref={keepRef("phone")}
                            value={customerPhone}
                            onChange={handlePhoneChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="customer-email">Email ID:</label>
                        <input
                            type="email"
                            id="customer-email"
                            className="text-input"
                            placeholder="Enter email address"
                            ref={keepRef("email")}
                            value={customerEmail}
                            onChange={handleEmailChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="cupboard-count">Select Number of Cupboards:</label>
                        <input
                            type="number"
                            id="cupboard-count"
                            className="text-input"
                            placeholder="Enter number of cupboards"
                            ref={keepRef("cupboards")}
                            value={cupboardText}
                            onChange={handleCupboardChange}
                        />
                        <span className="input-hint">Maximum allowed: 4 cupboards</span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="shelf-count">Shelves Per Unit:</label>
                        <input
                            type="number"
                            id="shelf-count"
                            className="text-input"
                            placeholder="Enter shelves per unit"
                            ref={keepRef("shelves")}
                            value={shelfText}
                            onChange={handleShelfChange}
                        />
                        <span className="input-hint">Maximum allowed: 6 shelves</span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="cupboard-length">Cupboard Length (cm):</label>
                        <input
                            type="number"
                            id="cupboard-length"
                            className="text-input"
                            placeholder="Enter cupboard length"
                            ref={keepRef("length")}
                            value={lengthText}
                            onChange={handleLengthChange}
                            onBlur={handleLengthBlur}
                        />
                        <span className="input-hint">Allowed range: 10 - 300 cm</span>
                    </div>

                    <div className="form-group">
                        <label>Door Type:</label>
                        <div className="radio-group">
                            {DOORS.map(function (name) {
                                return (
                                    <label key={name} className="radio-btn" htmlFor={"door-" + name}>
                                        {DOOR_LABELS[name]}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="fixed-lock">
                        <strong>Lock:</strong> Traditional Key Lock 🔑
                    </div>

                </div>


                {/* ================= MIDDLE PANEL ================= */}

                <div className="panel">
                    <h2>Visual Design</h2>
                    <div className="visual-stage">{cupboardsToDraw}</div>
                </div>


                {/* ================= RIGHT PANEL ================= */}

                <div className="panel">

                    <h2>Order Summary</h2>

                    <div className="output-box">

                        <div className="output-item out-customer">
                            {"Customer: " + (customerName.trim() || "Not entered")}
                        </div>

                        <div className="output-item out-phone">
                            {"Phone Number: " + (customerPhone.trim() || "Not entered")}
                        </div>

                        <div className="output-item out-email">
                            {"Email ID: " + (customerEmail.trim() || "Not entered")}
                        </div>

                        <div className="output-item out-customer-id">
                            {"Customer ID: " + (currentCustomerId || "Not assigned")}
                        </div>

                        <div className="output-item out-cupboards">
                            {"Cupboards: " +
                                (cupboardCount !== null ? cupboardCount + " Units" : "Not entered")}
                        </div>

                        <div className="output-item out-shelves">
                            {"Shelves: " +
                                (shelfCount !== null ? shelfCount + " Shelves per unit" : "Not entered")}
                        </div>

                        <div className="output-item out-length">
                            {"Cupboard Length: " +
                                (cupboardLength !== null ? cupboardLength + " cm" : "Not entered")}
                        </div>

                        <div className="output-item out-door">
                            {"Door State: " + DOOR_SUMMARY[door]}
                        </div>

                        <div className="output-item out-lock">
                            Lock Type: Traditional Key Lock
                        </div>

                    </div>

                    <div className="action-buttons">

                        <button id="accept-btn" className="main-btn" onClick={handleAccept}>
                            {alterCustomerId ? "Save Altered Design" : "Accept Design"}
                        </button>

                        <button id="redesign-btn" className="secondary-btn" onClick={handleRedesign}>
                            Redesign
                        </button>

                    </div>

                </div>

            </div>


            {/* ================= UPDATE / ALTER PANEL ================= */}

            <section className="manage-section">

                <div className="panel manage-panel">

                    <div className="manage-intro">
                        <strong>Update / Alter existing customer details</strong>
                        <span>
                            Enter the Customer ID and load the saved record.
                            Save Update changes phone, email, racks and shelves.
                            Save Alteration saves the component list below and logs it in alter.json.
                        </span>
                    </div>

                    <h3 className="manage-heading">Customer Information</h3>

                    <div className="manage-grid">

                        <div className="form-group">
                            <label htmlFor="m-id">Customer ID</label>
                            <input
                                type="text"
                                id="m-id"
                                className="text-input"
                                placeholder="e.g. CUST-0001"
                                value={mId}
                                onChange={function (e) { setMId(e.target.value); }}
                                onKeyDown={handleIdKeyDown}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="m-name">Customer Name</label>
                            <input
                                type="text"
                                id="m-name"
                                className="text-input"
                                readOnly
                                title="Name is changed with Save Alteration (components list)"
                                value={mName}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="m-phone">Phone Number</label>
                            <input
                                type="tel"
                                id="m-phone"
                                className="text-input"
                                maxLength={10}
                                disabled={panelOff}
                                value={mPhone}
                                onChange={function (e) { setMPhone(e.target.value); }}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="m-email">Email ID</label>
                            <input
                                type="email"
                                id="m-email"
                                className="text-input"
                                disabled={panelOff}
                                value={mEmail}
                                onChange={function (e) { setMEmail(e.target.value); }}
                            />
                        </div>

                    </div>

                    <h3 className="manage-heading">Rack and Shelf Configuration</h3>

                    <div className="manage-grid">

                        <div className="form-group">
                            <label htmlFor="m-racks">Number of Racks</label>
                            <input
                                type="number"
                                id="m-racks"
                                className="text-input"
                                min="1"
                                max="4"
                                disabled={panelOff}
                                value={mRacks}
                                onChange={function (e) { setMRacks(e.target.value); }}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="m-shelves">Shelves per Rack</label>
                            <input
                                type="number"
                                id="m-shelves"
                                className="text-input"
                                min="1"
                                max="6"
                                disabled={panelOff}
                                value={mShelves}
                                onChange={function (e) { setMShelves(e.target.value); }}
                            />
                        </div>

                    </div>

                    <div className="manage-actions">
                        <button type="button" id="m-load" className="manage-link" onClick={handleLoad}>
                            Load Customer
                        </button>
                        <button type="button" id="m-save-update" className="manage-green"
                                disabled={panelOff} onClick={handleSaveUpdate}>
                            Save Update
                        </button>
                        <button type="button" id="m-save-alter" className="manage-green"
                                disabled={panelOff} onClick={handleSaveAlteration}>
                            Save Alteration
                        </button>
                        <button type="button" id="m-delete" className="manage-link"
                                disabled={panelOff} onClick={handleDeleteFromPanel}>
                            Delete Customer
                        </button>
                    </div>

                    <p id="m-message" className={"manage-message" + (mMessage.isError ? " error" : "")}>
                        {mMessage.text}
                    </p>

                    <div className="manage-intro">
                        <strong>Alter Customer Record</strong>
                        <span>
                            Change, remove, or add components that are actually stored in customers.json.
                            Customer ID is protected and cannot be altered.
                        </span>
                    </div>

                    <div className="component-table" id="component-table">

                        <div className="component-row component-head">
                            <span>Component</span><span>Value</span><span>Action</span>
                        </div>

                        <div id="component-rows">
                            {rows.map(function (row, index) {
                                return (
                                    <div className="component-row" key={row.kind + ":" + row.label}>

                                        <input className="comp-input" value={row.label} readOnly />

                                        <input
                                            className="comp-input"
                                            value={row.value}
                                            onChange={function (e) {
                                                handleRowValueChange(index, e.target.value);
                                            }}
                                        />

                                        {row.required ? (
                                            <button type="button" className="comp-btn required" tabIndex={-1}>
                                                Required
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="comp-btn"
                                                onClick={function () { handleRemoveRow(index); }}
                                            >
                                                Remove
                                            </button>
                                        )}

                                    </div>
                                );
                            })}
                        </div>

                        <div className="component-row component-add">
                            <input
                                type="text"
                                id="new-comp-name"
                                className="comp-input"
                                placeholder="New component name (e.g. alternate email)"
                                maxLength={40}
                                disabled={panelOff}
                                value={newCompName}
                                onChange={function (e) { setNewCompName(e.target.value); }}
                            />
                            <input
                                type="text"
                                id="new-comp-value"
                                className="comp-input"
                                placeholder="Component value"
                                maxLength={100}
                                disabled={panelOff}
                                value={newCompValue}
                                onChange={function (e) { setNewCompValue(e.target.value); }}
                                onKeyDown={handleNewValueKeyDown}
                            />
                            <button type="button" id="add-comp" className="comp-btn"
                                    disabled={panelOff} onClick={handleAddComponent}>
                                + Add Component
                            </button>
                        </div>

                    </div>

                    <p className="manage-note">
                        Required components: Customer Name, Number of Racks, Shelves per Rack,
                        Length and Door. Phone, Email and any extra components can be removed or changed.
                    </p>

                </div>

            </section>


            {/* ================= CUSTOMER RECORDS ================= */}

            <section className="records-section">

                <div className="panel">

                    <h2>Customer Records</h2>

                    <div className="records-toolbar">
                        <input
                            type="text"
                            id="search-input"
                            className="text-input"
                            placeholder="Search by ID, name, phone or email"
                            value={search}
                            onChange={handleSearchChange}
                        />
                        <span id="record-count" className="record-count">
                            {customers.length + " customer" + (customers.length === 1 ? "" : "s")}
                        </span>
                    </div>

                    <div className="table-wrap">
                        <table className="records-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Racks</th>
                                    <th>Shelves</th>
                                    <th>Length</th>
                                    <th>Door</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody id="records-body">

                                {customers.length === 0 ? (
                                    <tr>
                                        <td className="empty-cell" colSpan={9}>
                                            No customer records found.
                                        </td>
                                    </tr>
                                ) : null}

                                {customers.map(function (c) {

                                    const values = [
                                        c.customerId,
                                        c.customerName,
                                        c.customerPhone,
                                        c.customerEmail,
                                        c.cupboards,
                                        c.shelves,
                                        c.cupboardLength !== undefined ? c.cupboardLength + " cm" : "",
                                        DOOR_NAMES[c.door] || c.door
                                    ];

                                    return (
                                        <tr key={c.customerId}>

                                            {values.map(function (value, i) {
                                                const missing = value === undefined || value === null || value === "";
                                                return (
                                                    <td key={i}>
                                                        {missing ? <span className="missing">not set</span> : value}
                                                    </td>
                                                );
                                            })}

                                            <td>
                                                <div className="row-actions">
                                                    <button
                                                        type="button"
                                                        className="row-btn update"
                                                        onClick={function () { openUpdate(c); }}
                                                    >
                                                        Update
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="row-btn alter"
                                                        onClick={function () { loadForAlter(c); }}
                                                    >
                                                        Alter
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="row-btn delete"
                                                        onClick={function () { openDelete(c); }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>
                                    );
                                })}

                            </tbody>

                        </table>
                    </div>

                    <p id="sync-status" className={"sync-status" + (syncStatus.warn ? " warn" : "")}>
                        {syncStatus.text}
                    </p>

                </div>

            </section>


            {/* ================= UPDATE WINDOW ================= */}

            {updateTarget ? (
                <div id="update-modal" className="modal-overlay show">
                    <div className="modal">

                        <h3 id="update-title">
                            {"Update " + updateTarget.customerId + " - " + updateTarget.customerName}
                        </h3>

                        <p className="modal-note">
                            Change phone number, email ID, number of racks and number of shelves.
                        </p>

                        <div className="form-group">
                            <label htmlFor="upd-phone">Phone Number:</label>
                            <input
                                type="tel"
                                id="upd-phone"
                                className="text-input"
                                maxLength={10}
                                autoFocus
                                value={updPhone}
                                onChange={function (e) { setUpdPhone(e.target.value); }}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="upd-email">Email ID:</label>
                            <input
                                type="email"
                                id="upd-email"
                                className="text-input"
                                value={updEmail}
                                onChange={function (e) { setUpdEmail(e.target.value); }}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="upd-racks">Number of Racks (Cupboards, 1-4):</label>
                            <input
                                type="number"
                                id="upd-racks"
                                className="text-input"
                                min="1"
                                max="4"
                                value={updRacks}
                                onChange={function (e) { setUpdRacks(e.target.value); }}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="upd-shelves">Number of Shelves (1-6):</label>
                            <input
                                type="number"
                                id="upd-shelves"
                                className="text-input"
                                min="1"
                                max="6"
                                value={updShelves}
                                onChange={function (e) { setUpdShelves(e.target.value); }}
                            />
                        </div>

                        <p id="update-error" className="modal-error">{updateError}</p>

                        <div className="modal-actions">
                            <button id="update-cancel" type="button" className="secondary-btn"
                                    onClick={closeUpdate}>
                                Cancel
                            </button>
                            <button id="update-save" type="button" className="main-btn"
                                    onClick={handleUpdateSave}>
                                Save Update
                            </button>
                        </div>

                    </div>
                </div>
            ) : null}


            {/* ================= DELETE CONFIRM WINDOW ================= */}

            {deleteTarget ? (
                <div id="delete-modal" className="modal-overlay show">
                    <div className="modal">

                        <h3 className="danger">Delete Customer?</h3>

                        <p id="delete-message" className="modal-note">
                            {"Delete " + deleteTarget.customerId + " (" + deleteTarget.customerName + ")? " +
                             "The record will be permanently removed from customers.json, " +
                             "alter.json, count.json and Exp2's customer.json. This cannot be undone."}
                        </p>

                        <div className="modal-actions">
                            <button id="delete-cancel" type="button" className="secondary-btn"
                                    onClick={closeDelete}>
                                Cancel
                            </button>
                            <button id="delete-confirm" type="button" className="danger-btn"
                                    onClick={handleDeleteConfirm}>
                                Yes, Delete
                            </button>
                        </div>

                    </div>
                </div>
            ) : null}


            <Toast toast={toast} />

            <Popup popup={popup} onOk={handlePopupOk} />

        </>
    );
}


// ==========================================================
// START REACT
// ==========================================================

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
