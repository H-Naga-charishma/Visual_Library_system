// ==========================================
// LIBRARY VISUAL STORAGE SYSTEM
// EXPERIMENT 3
// ==========================================


// ==========================================
// LIMITS
// ==========================================

const MAX_CUPBOARDS = 4;
const MAX_SHELVES = 6;
const MAX_LENGTH = 300;
const MIN_LENGTH = 10;

// Minimum cupboard length based on shelf count
//
// 1 shelf  = 40 cm
// 2 shelves = 70 cm
// 3 shelves = 100 cm
// 4 shelves = 130 cm
// 5 shelves = 160 cm
// 6 shelves = 190 cm

const MIN_LENGTH_BY_SHELF = {
    1: 40,
    2: 70,
    3: 100,
    4: 130,
    5: 160,
    6: 190
};


// ==========================================
// WAIT FOR HTML
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // INPUTS
    // ==========================================

    const customerNameInput =
        document.getElementById("customer-name");

    const customerPhoneInput =
        document.getElementById("customer-phone");

    const customerEmailInput =
        document.getElementById("customer-email");

    const cupboardInput =
        document.getElementById("cupboard-count");

    const shelfInput =
        document.getElementById("shelf-count");

    const cupboardLengthInput =
        document.getElementById("cupboard-length");


    // ==========================================
    // OUTPUTS
    // ==========================================

    const customerOutput =
        document.querySelector(".out-customer");

    const phoneOutput =
        document.querySelector(".out-phone");

    const emailOutput =
        document.querySelector(".out-email");

    const customerIdOutput =
        document.querySelector(".out-customer-id");

    const cupboardOutput =
        document.querySelector(".out-cupboards");

    const shelfOutput =
        document.querySelector(".out-shelves");

    const lengthOutput =
        document.querySelector(".out-length");

    const doorOutput =
        document.querySelector(".out-door");


    // ==========================================
    // VISUAL AREA
    // ==========================================

    const visualStage =
        document.querySelector(".visual-stage");


    // ==========================================
    // BUTTONS
    // ==========================================

    const acceptButton =
        document.getElementById("accept-btn");

    const redesignButton =
        document.getElementById("redesign-btn");


    // ==========================================
    // POPUP ELEMENTS
    // ==========================================

    const popupOverlay =
        document.getElementById("custom-popup-overlay");

    const popupTitle =
        document.getElementById("popup-title");

    const popupMessage =
        document.getElementById("popup-message");

    const popupOk =
        document.getElementById("popup-ok");


    // ==========================================
    // VARIABLES
    // ==========================================

    let cupboardCount = null;
    let shelfCount = null;
    let cupboardLength = null;

    let selectedDoor = "hinged";

    let currentCustomerId = null;

    // Set when an existing customer is being altered
    let alterCustomerId = null;

    let popupInput = null;
    let popupCallback = null;


    // ==========================================
    // SHOW POPUP
    // ==========================================

    function showPopup(
        title,
        message,
        inputElement = null,
        callback = null
    ) {

        popupInput = inputElement;
        popupCallback = callback;

        popupTitle.textContent = title;
        popupMessage.textContent = message;

        popupOverlay.classList.add("show");
    }


    // ==========================================
    // CLOSE POPUP
    // ==========================================

    popupOk.addEventListener("click", function () {

        popupOverlay.classList.remove("show");

        if (popupInput) {

            popupInput.value = "";

            if (popupInput === cupboardInput) {
                cupboardCount = null;
            }

            if (popupInput === shelfInput) {
                shelfCount = null;
            }

            if (popupInput === cupboardLengthInput) {
                cupboardLength = null;
            }

            popupInput.focus();

            popupInput = null;
        }

        if (popupCallback) {

            const callback = popupCallback;

            popupCallback = null;

            callback();
        }
    });


    // ==========================================
    // CUSTOMER NAME
    // ==========================================

    customerNameInput.addEventListener(
        "input",
        function () {

            updateSummary();
        }
    );


    // ==========================================
    // CUSTOMER PHONE
    // ==========================================

    customerPhoneInput.addEventListener(
        "input",
        function () {

            updateSummary();
        }
    );


    // ==========================================
    // CUSTOMER EMAIL
    // ==========================================

    customerEmailInput.addEventListener(
        "input",
        function () {

            updateSummary();
        }
    );


    // ==========================================
    // CUPBOARD COUNT
    // ==========================================

    cupboardInput.addEventListener(
        "input",
        function () {

            const value =
                cupboardInput.value.trim();

            // Empty input is allowed while typing

            if (value === "") {

                cupboardCount = null;

                visualStage.innerHTML = "";

                updateSummary();

                return;
            }

            const number =
                Number(value);


            // Cupboards must be whole numbers
            // from 1 to 4

            if (
                !Number.isInteger(number) ||
                number < 1 ||
                number > MAX_CUPBOARDS
            ) {

                showPopup(
                    "⚠️ Caution: Invalid Input",
                    "Please enter the number of cupboards between 1 and 4.",
                    cupboardInput
                );

                return;
            }


            cupboardCount = number;

            generateCupboards();

            updateSummary();
        }
    );


    // ==========================================
    // SHELF COUNT
    // ==========================================

    shelfInput.addEventListener(
        "input",
        function () {

            const value =
                shelfInput.value.trim();

            // Empty input is allowed while typing

            if (value === "") {

                shelfCount = null;

                visualStage.innerHTML = "";

                updateSummary();

                return;
            }

            const number =
                Number(value);


            // Shelves must be whole numbers
            // from 1 to 6

            if (
                !Number.isInteger(number) ||
                number < 1 ||
                number > MAX_SHELVES
            ) {

                showPopup(
                    "⚠️ Caution: Invalid Input",
                    "Please enter the number of shelves between 1 and 6.",
                    shelfInput
                );

                return;
            }


            shelfCount = number;

            generateCupboards();

            updateSummary();
        }
    );


    // ==========================================
    // CUPBOARD LENGTH
    // ==========================================

    cupboardLengthInput.addEventListener(
        "input",
        function () {

            const value =
                cupboardLengthInput.value.trim();


            // Empty input

            if (value === "") {

                cupboardLength = null;

                updateSummary();

                return;
            }


            const number =
                Number(value);


            // Only check the MAXIMUM while typing.
            //
            // This allows the user to type:
            //
            // 4
            // 40
            // 100
            // 150
            // 300
            //
            // without showing a minimum-length popup.

            if (
                !Number.isInteger(number) ||
                number > MAX_LENGTH
            ) {

                showPopup(
                    "⚠️ Caution: Invalid Input",
                    "Please enter a cupboard length up to 300 cm.",
                    cupboardLengthInput
                );

                return;
            }


            cupboardLength = number;

            updateCupboardVisualSize();

            updateSummary();
        }
    );


    // ==========================================
    // CUPBOARD LENGTH - FINAL VALIDATION
    // ==========================================

    cupboardLengthInput.addEventListener(
        "blur",
        function () {

            const value =
                cupboardLengthInput.value.trim();


            // Empty is handled when
            // Accept Design is clicked.

            if (value === "") {

                cupboardLength = null;

                updateSummary();

                return;
            }


            const number =
                Number(value);

            const minimumRequiredLength =
                getMinimumLength();


            if (
                !Number.isInteger(number) ||
                number < minimumRequiredLength ||
                number > MAX_LENGTH
            ) {

                showPopup(
                    "⚠️ Caution: Invalid Input",
                    "For " +
                    (shelfCount || "the selected") +
                    " shelf(s), the minimum cupboard length is " +
                    minimumRequiredLength +
                    " cm. Maximum allowed is 300 cm.",
                    cupboardLengthInput
                );

                return;
            }


            cupboardLength = number;

            updateCupboardVisualSize();

            updateSummary();
        }
    );


    // ==========================================
    // DOOR SELECTION
    // ==========================================

    const doorRadios =
        document.querySelectorAll(
            'input[name="door_select"]'
        );


    doorRadios.forEach(function (radio) {

        radio.addEventListener(
            "change",
            function () {

                selectedDoor =
                    radio.id.replace(
                        "door-",
                        ""
                    );

                generateCupboards();

                updateSummary();
            }
        );

    });


    // ==========================================
    // MINIMUM LENGTH BASED ON SHELF COUNT
    // ==========================================

    function getMinimumLength() {

        if (
            shelfCount !== null &&
            MIN_LENGTH_BY_SHELF[shelfCount]
        ) {

            return MIN_LENGTH_BY_SHELF[shelfCount];
        }

        return MIN_LENGTH;
    }


    // ==========================================
    // UPDATE CUPBOARD VISUAL SIZE
    // ==========================================

    function updateCupboardVisualSize() {

        if (
            cupboardLength === null ||
            cupboardLength === undefined
        ) {
            return;
        }

        if (
            cupboardCount === null ||
            shelfCount === null
        ) {
            return;
        }


        const minimumLength =
            getMinimumLength();


        const minimumVisualHeight = 220;
        const maximumVisualHeight = 560;


        const ratio =
            (
                cupboardLength -
                minimumLength
            ) /
            (
                MAX_LENGTH -
                minimumLength
            );


        const safeRatio =
            Math.max(
                0,
                Math.min(1, ratio)
            );


        const visualHeight =
            minimumVisualHeight +
            safeRatio *
            (
                maximumVisualHeight -
                minimumVisualHeight
            );


        const cupboards =
            visualStage.querySelectorAll(
                ".cupboard-unit"
            );


        cupboards.forEach(
            function (cupboard) {

                cupboard.style.height =
                    visualHeight + "px";
            }
        );
    }


    // ==========================================
    // CREATE CUPBOARDS
    // ==========================================

    function generateCupboards() {

        visualStage.innerHTML = "";


        // Do not create cupboards until both
        // cupboard and shelf values are valid.

        if (
            cupboardCount === null ||
            shelfCount === null
        ) {

            return;
        }


        for (
            let i = 1;
            i <= cupboardCount;
            i++
        ) {

            const cupboard =
                createCupboard(i);

            visualStage.appendChild(
                cupboard
            );
        }


        // Apply the entered length to
        // the visual cupboard height.

        updateCupboardVisualSize();
    }


    // ==========================================
    // CREATE ONE CUPBOARD
    // ==========================================

    function createCupboard(
        cupboardNumber
    ) {

        const cupboard =
            document.createElement("div");

        cupboard.className =
            "cupboard-unit";

        cupboard.dataset.cupboard =
            cupboardNumber;


        // ==========================================
        // CREATE SHELVES
        // ==========================================

        for (
            let i = 1;
            i <= shelfCount;
            i++
        ) {

            const shelf =
                document.createElement("div");

            shelf.className =
                "shelf";

            shelf.dataset.shelf =
                i;


            // ==========================================
            // BOOKS
            // ==========================================

            const books =
                document.createElement("div");

            books.className =
                "books";


            const bookClasses = [
                "b-leather",
                "b-navy",
                "b-gold",
                "b-emerald",
                "b-plum",
                "b-teal"
            ];


            const booksToCreate =
                3 + (i % 3);


            for (
                let j = 0;
                j < booksToCreate;
                j++
            ) {

                const book =
                    document.createElement("div");

                book.className =
                    "book " +
                    bookClasses[
                        (j + i) %
                        bookClasses.length
                    ];

                books.appendChild(book);
            }


            shelf.appendChild(books);


            // ==========================================
            // LIFTING DOOR
            // ==========================================

            if (
                selectedDoor === "lifting"
            ) {

                const shelfDoor =
                    document.createElement("div");

                shelfDoor.className =
                    "shelf-door";

                shelfDoor.textContent =
                    "Shelf " + i;

                shelf.appendChild(
                    shelfDoor
                );
            }


            cupboard.appendChild(
                shelf
            );
        }


        // ==========================================
        // NORMAL TWO DOORS
        // ==========================================

        if (
            selectedDoor !== "lifting"
        ) {

            // LEFT DOOR

            const leftDoor =
                document.createElement("div");

            leftDoor.className =
                "door-panel left";


            // RIGHT DOOR

            const rightDoor =
                document.createElement("div");

            rightDoor.className =
                "door-panel right";


            // ==========================================
            // FIXED KEY LOCK
            // ==========================================

            const lockHardware =
                document.createElement("div");

            lockHardware.className =
                "lock-hardware";

            lockHardware.textContent =
                "🔑 Key";

            rightDoor.appendChild(
                lockHardware
            );


            // Add doors to cupboard

            cupboard.appendChild(
                leftDoor
            );

            cupboard.appendChild(
                rightDoor
            );


            // ==========================================
            // SLIDING DOOR CLICK / TOUCH
            // ==========================================

            if (
                selectedDoor === "sliding"
            ) {

                leftDoor.addEventListener(
                    "click",
                    function () {

                        leftDoor.classList.toggle(
                            "touch-open"
                        );
                    }
                );


                rightDoor.addEventListener(
                    "click",
                    function () {

                        rightDoor.classList.toggle(
                            "touch-open"
                        );
                    }
                );
            }
        }


        return cupboard;
    }

        // ==========================================
    // UPDATE ORDER SUMMARY
    // ==========================================

    function updateSummary() {

        const name =
            customerNameInput.value.trim();


        // ==========================================
        // CUSTOMER
        // ==========================================

        customerOutput.textContent =
            "Customer: " +
            (
                name ||
                "Not entered"
            );


        // ==========================================
        // PHONE NUMBER
        // ==========================================

        const phone =
            customerPhoneInput.value.trim();

        phoneOutput.textContent =
            "Phone Number: " +
            (
                phone ||
                "Not entered"
            );


        // ==========================================
        // EMAIL ID
        // ==========================================

        const email =
            customerEmailInput.value.trim();

        emailOutput.textContent =
            "Email ID: " +
            (
                email ||
                "Not entered"
            );


        // ==========================================
        // CUSTOMER ID
        // ==========================================

        customerIdOutput.textContent =
            "Customer ID: " +
            (
                currentCustomerId ||
                "Not assigned"
            );


        // ==========================================
        // CUPBOARDS
        // ==========================================

        cupboardOutput.textContent =
            "Cupboards: " +
            (
                cupboardCount !== null
                    ? cupboardCount + " Units"
                    : "Not entered"
            );


        // ==========================================
        // SHELVES
        // ==========================================

        shelfOutput.textContent =
            "Shelves: " +
            (
                shelfCount !== null
                    ? shelfCount +
                      " Shelves per unit"
                    : "Not entered"
            );


        // ==========================================
        // LENGTH
        // ==========================================

        lengthOutput.textContent =
            "Cupboard Length: " +
            (
                cupboardLength !== null
                    ? cupboardLength + " cm"
                    : "Not entered"
            );


        // ==========================================
        // DOOR SUMMARY
        // ==========================================

        let doorText = "";


        if (
            selectedDoor === "hinged"
        ) {

            doorText =
                "Hinged Wooden Doors";
        }

        else if (
            selectedDoor === "sliding"
        ) {

            doorText =
                "Sliding Doors";
        }

        else if (
            selectedDoor === "glass"
        ) {

            doorText =
                "Glass Frame Doors";
        }

        else if (
            selectedDoor === "lifting"
        ) {

            doorText =
                "Lifting Doors (Shelf-by-Shelf)";
        }


        doorOutput.textContent =
            "Door State: " +
            doorText;
    }


    // ==========================================
    // ACCEPT DESIGN
    // ==========================================

    acceptButton.addEventListener(
        "click",
        async function () {

            // ==========================================
            // GET CUSTOMER DETAILS
            // ==========================================

            const customerName =
                customerNameInput.value.trim();

            // IMPORTANT:
            // These two variables MUST be declared here.
            // This fixes the Accept Design error.

            const customerPhone =
                customerPhoneInput.value.trim();

            const customerEmail =
                customerEmailInput.value.trim();


            // ==========================================
            // VALIDATE CUSTOMER NAME
            // ==========================================

            if (
                customerName === ""
            ) {

                showPopup(
                    "⚠️ Caution",
                    "Please enter the customer name."
                );

                customerNameInput.focus();

                return;
            }


            // ==========================================
            // VALIDATE PHONE NUMBER
            // ==========================================

            if (
                !/^[0-9]{10}$/.test(customerPhone)
            ) {

                showPopup(
                    "⚠️ Caution",
                    "Please enter a valid 10-digit phone number."
                );

                customerPhoneInput.focus();

                return;
            }


            // ==========================================
            // VALIDATE EMAIL ID
            // ==========================================

            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    customerEmail
                )
            ) {

                showPopup(
                    "⚠️ Caution",
                    "Please enter a valid email address."
                );

                customerEmailInput.focus();

                return;
            }


            // ==========================================
            // VALIDATE CUPBOARDS
            // ==========================================

            const cupboardValue =
                Number(
                    cupboardInput.value
                );


            if (
                cupboardInput.value.trim() === "" ||
                !Number.isInteger(
                    cupboardValue
                ) ||
                cupboardValue < 1 ||
                cupboardValue > MAX_CUPBOARDS
            ) {

                showPopup(
                    "⚠️ Caution",
                    "Please enter a valid number of cupboards between 1 and 4."
                );

                cupboardInput.focus();

                return;
            }


            cupboardCount =
                cupboardValue;


            // ==========================================
            // VALIDATE SHELVES
            // ==========================================

            const shelfValue =
                Number(
                    shelfInput.value
                );


            if (
                shelfInput.value.trim() === "" ||
                !Number.isInteger(
                    shelfValue
                ) ||
                shelfValue < 1 ||
                shelfValue > MAX_SHELVES
            ) {

                showPopup(
                    "⚠️ Caution",
                    "Please enter a valid number of shelves between 1 and 6."
                );

                shelfInput.focus();

                return;
            }


            shelfCount =
                shelfValue;


            // ==========================================
            // VALIDATE CUPBOARD LENGTH
            // ==========================================

            const lengthValue =
                Number(
                    cupboardLengthInput.value
                );


            const minimumRequiredLength =
                getMinimumLength();


            if (
                cupboardLengthInput.value.trim() === "" ||
                !Number.isInteger(
                    lengthValue
                ) ||
                lengthValue <
                    minimumRequiredLength ||
                lengthValue >
                    MAX_LENGTH
            ) {

                showPopup(
                    "⚠️ Caution",
                    "For " +
                    shelfCount +
                    " shelf(s), the minimum cupboard length is " +
                    minimumRequiredLength +
                    " cm. Maximum allowed is 300 cm."
                );

                cupboardLengthInput.focus();

                return;
            }


            cupboardLength =
                lengthValue;


            // ==========================================
            // UPDATE VISUAL SIZE
            // ==========================================

            updateCupboardVisualSize();


            // ==========================================
            // MAKE SURE LATEST VALUES ARE DISPLAYED
            // ==========================================

            generateCupboards();

            updateSummary();


            // ==========================================
            // SEND ORDER TO SERVER
            // ==========================================

            try {

                const response =
                    await fetch(
                        alterCustomerId
                            ? "/api/customers/" + encodeURIComponent(alterCustomerId)
                            : "/api/customers",
                        {

                            method: alterCustomerId ? "PATCH" : "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                // Existing customer ID
                                customerId:
                                    currentCustomerId,

                                // Customer details
                                customerName:
                                    customerName,

                                customerPhone:
                                    customerPhone,

                                customerEmail:
                                    customerEmail,

                                // Storage details
                                cupboards:
                                    cupboardCount,

                                shelves:
                                    shelfCount,

                                cupboardLength:
                                    cupboardLength,

                                // Door
                                door:
                                    selectedDoor,

                                // Lock
                                lock:
                                    "Traditional Key Lock"
                            })
                        }
                    );


                // ==========================================
                // READ SERVER RESPONSE SAFELY
                // ==========================================

                const contentType =
                    response.headers.get(
                        "content-type"
                    ) || "";


                let result;


                if (
                    contentType.includes(
                        "application/json"
                    )
                ) {

                    result =
                        await response.json();

                }

                else {

                    const text =
                        await response.text();

                    throw new Error(
                        "Server returned an unexpected response. Make sure Node.js is running with: node server.js"
                    );
                }


                // ==========================================
                // SERVER ERROR
                // ==========================================

                if (
                    !response.ok
                ) {

                    throw new Error(
                        result.message ||
                        "Unable to save order."
                    );
                }


                // ==========================================
                // KEEP CUSTOMER ID
                // ==========================================

                currentCustomerId =
                    result.customerId;


                updateSummary();


                // ==========================================
                // CONFIRMATION
                // ==========================================

                const isAlterSave = alterCustomerId !== null;

                const syncNote =
                    (result.sync && !result.sync.ok)
                        ? " Warning: " + result.sync.message
                        : "";

                if (isAlterSave) {

                    showPopup(
                        result.changed === false
                            ? "ℹ️ No Changes"
                            : "✅ Alteration Saved",
                        result.message +
                        " Customer ID: " +
                        currentCustomerId +
                        syncNote
                    );

                } else {

                    showConfirmationPopup(
                        customerName,
                        currentCustomerId
                    );

                    if (syncNote) {
                        popupMessage.textContent += syncNote;
                    }
                }

                // From now on this design belongs to a saved
                // customer, so Accept saves an alteration
                // instead of creating a duplicate.
                enterAlterMode(currentCustomerId);

                if (window.refreshRecords) {
                    window.refreshRecords();
                }

            }


            catch (error) {

                showPopup(
                    "❌ Error",
                    error.message
                );
            }
        }
    );


    // ==========================================
    // CONFIRMATION POPUP
    // ==========================================

    function showConfirmationPopup(
        customerName,
        customerId
    ) {

        popupInput = null;
        popupCallback = null;

        popupTitle.textContent =
            "🎉 Order Confirmed!";

        popupMessage.textContent =
            "Thank you, " +
            customerName +
            "! Your library storage request has been successfully recorded. Customer ID: " +
            customerId;

        popupOverlay.classList.add(
            "show"
        );
    }


    // ==========================================
    // REDESIGN
    // ==========================================

    redesignButton.addEventListener(
        "click",
        function () {

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
    );


    // ==========================================
    // CLEAR DESIGN
    // ==========================================

    function clearDesign() {

        // Clear input fields

        customerNameInput.value = "";

        customerPhoneInput.value = "";

        customerEmailInput.value = "";

        cupboardInput.value = "";

        shelfInput.value = "";

        cupboardLengthInput.value = "";


        // Clear internal values

        cupboardCount = null;

        shelfCount = null;

        cupboardLength = null;


        // Default door = Hinged

        selectedDoor =
            "hinged";


        const hingedRadio =
            document.getElementById(
                "door-hinged"
            );


        if (
            hingedRadio
        ) {

            hingedRadio.checked =
                true;
        }


        // Clear visual design

        visualStage.innerHTML = "";


        // Update summary

        updateSummary();


        // Focus customer name

        customerNameInput.focus();
    }


    // ==========================================
    // ALTER MODE (Experiment 3)
    // ==========================================

    const alterBanner =
        document.getElementById("alter-banner");

    const alterBannerText =
        document.getElementById("alter-banner-text");

    const alterCancelButton =
        document.getElementById("alter-cancel-btn");


    function refreshAlterUI() {

        if (alterCustomerId) {

            acceptButton.textContent =
                "Save Altered Design";

            alterBannerText.textContent =
                "Altering saved customer " +
                alterCustomerId +
                ". Changes are saved to the same record and logged in alter.json.";

            alterBanner.classList.add("show");

        } else {

            acceptButton.textContent =
                "Accept Design";

            alterBanner.classList.remove("show");
        }
    }


    function enterAlterMode(customerId) {

        alterCustomerId = customerId;
        currentCustomerId = customerId;

        refreshAlterUI();
        updateSummary();
    }


    function leaveAlterMode() {

        alterCustomerId = null;
        currentCustomerId = null;

        clearDesign();

        refreshAlterUI();
    }


    // Fill the whole form from a saved customer
    function loadForAlter(record) {

        customerNameInput.value =
            record.customerName || "";

        customerPhoneInput.value =
            record.customerPhone || "";

        customerEmailInput.value =
            record.customerEmail || "";

        cupboardInput.value =
            record.cupboards;

        shelfInput.value =
            record.shelves;

        cupboardLengthInput.value =
            record.cupboardLength;

        cupboardCount =
            Number(record.cupboards);

        shelfCount =
            Number(record.shelves);

        cupboardLength =
            Number(record.cupboardLength);

        selectedDoor =
            record.door || "hinged";

        const doorRadio =
            document.getElementById(
                "door-" + selectedDoor
            );

        if (doorRadio) {
            doorRadio.checked = true;
        }

        enterAlterMode(record.customerId);

        generateCupboards();

        updateSummary();

        window.scrollTo({ top: 0, behavior: "smooth" });
    }


    alterCancelButton.addEventListener(
        "click",
        leaveAlterMode
    );


    // Used by records.js
    window.designer = {

        loadForAlter: loadForAlter,

        currentId: function () {
            return alterCustomerId;
        },

        reset: leaveAlterMode
    };


    // ==========================================
    // INITIAL DISPLAY
    // ==========================================

    // Keep all input boxes empty
    // when the page loads.

    cupboardInput.value = "";

    shelfInput.value = "";

    cupboardLengthInput.value = "";


    // No cupboards are generated initially.

    visualStage.innerHTML = "";


    // Show initial summary.

    updateSummary();

});