// Variables
let _thisMonth = new Date().toLocaleString('default', { month: 'long' });
let _thisYear = new Date().getFullYear();
let _pricePerPayment, _startDate = new Date(), _endDate = new Date();
let _pricingModel = "Flat rate", _billingTerm = "N/A", _paymentOption = "N/A", _exceptionScenario;
let _autoRenew = false;

let _payment = {
    id: 0,
    amount: 0,
    dueDate: new Date()
};

let _payments = [];
let _privateOffer = {
    id: 0,
    numberOfPayments: 0,
    startDate: new Date(),
    endDate: new Date(),
    amount: 0
};

let _privateOffers = [];

let _contractTotal, _numberOfPayments, _paymentFrequency, _variableAmounts, _singlePayment, _delayBilling;

// Add event listener for Configure Offer button
document.getElementById('cmdConfigure').addEventListener('click', SelectScenario);

// Ensure only one checkbox can be checked at a time
// let checkboxes = document.querySelectorAll('input[type="checkbox"]');
let checkboxes = document.querySelectorAll('#privateOfferBuilderContainer input[type="checkbox"]');
console.debug(checkboxes);
checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', function () {
        checkboxes.forEach((box) => {
            if (box !== checkbox) box.checked = false;
        });
    });
});

// JavaScript to toggle the visibility of advanced options
document.getElementById('showAdvancedOptions').addEventListener('change', function () {
    const advancedOptions = document.getElementById('advancedOptions');
    if (this.checked) {
        advancedOptions.classList.remove('d-none');
    } else {
        advancedOptions.classList.add('d-none');
    }
});

// Select Scenario function
function SelectScenario() {
    _contractTotal = parseFloat(document.getElementById('contractTotal').value);
    _numberOfPayments = parseInt(document.getElementById('numberOfPayments').value);
    _paymentFrequency = document.getElementById('paymentFrequency').value;
    _variableAmounts = document.getElementById('variableAmounts').checked;
    _singlePayment = document.getElementById('singlePayment').checked;
    _delayBilling = document.getElementById('delayBilling').checked;

    _billingTerm = document.getElementById('paymentFrequency').value;
    _paymentOption = "One-time"

    _pricePerPayment = _contractTotal / _numberOfPayments;

    if (_variableAmounts) {
        VariableAmounts();
    } else if (_singlePayment) {
        SinglePayment();
    } else if (_delayBilling) {
        DelayedBilling();
    } else {
        SinglePrivateOffer();
    }
}

// Scenario functions
function SinglePayment() {
    // Set the number of payments to 1 and payment frequency to 'Month'
    document.getElementById('numberOfPayments').value = 1;
    document.getElementById('paymentFrequency').value = 'Month';

    // Update global variables
    _numberOfPayments = parseInt(document.getElementById('numberOfPayments').value);
    _paymentFrequency = document.getElementById('paymentFrequency').value;
    _contractTotal = parseFloat(document.getElementById('contractTotal').value);

    // Get the current date in MM/YYYY format
    const today = new Date();
    const currentMonthYear = `${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    // Clear existing content
    let output = document.getElementById('output');
    output.innerHTML = '';

    // Create form for single payment details
    let formContent = `
        <form id="singlePaymentForm">
            <div class="mb-3">
                <label for="paymentAmount" class="form-label">Payment Amount (USD)</label>
                <input type="number" class="form-control" id="paymentAmount" value="${_contractTotal}" readonly style="background-color: #e9ecef;">
                <small id="paymentHelp" class="form-text text-muted">The total deal amount to be invoiced as a single payment.</small>
            </div>
            <div class="mb-3">
                <label for="paymentDate" class="form-label">Invoice Date</label>
                <input type="text" class="form-control" id="paymentDate" value="${currentMonthYear}" readonly style="background-color: #e9ecef;">
                <small id="dateHelp" class="form-text text-muted">The expected invoice date for the single payment (MM/YYYY).</small>
            </div>
            <div class="mb-3">
                <label for="subscriptionEndDate" class="form-label">Subscription End Date</label>
                <input type="text" class="form-control" id="subscriptionEndDate" aria-describedby="endDateHelp" placeholder="MM/YYYY" pattern="^(0[1-9]|1[0-2])\\/(\\d{4})$" required>
                <small id="endDateHelp" class="form-text text-muted">The private offer subscription end date (MM/YYYY).</small>
            </div>
            <button type="button" class="btn btn-primary" id="submitSinglePayment">Configure Offer</button>
        </form>
    `;

    // Insert form content into the output element
    output.innerHTML = formContent;

    // Add event listener for the submit button to validate and generate the private offer
    document.getElementById('submitSinglePayment').addEventListener('click', () => {
        const subscriptionEndDate = document.getElementById('subscriptionEndDate').value;

        // Validate MM/YYYY format and year
        const datePattern = /^(0[1-9]|1[0-2])\/(\d{4})$/;
        const match = subscriptionEndDate.match(datePattern);
        if (!match) {
            alert('Please enter a valid date in MM/YYYY format.');
            return;
        }

        const month = parseInt(match[1]);
        const year = parseInt(match[2]);
        const currentYear = today.getFullYear();

        // Check if the year is valid
        if (year < currentYear) {
            alert('The year must be equal to or greater than the current year.');
            return;
        }

        // Proceed with saving if validations pass
        SaveSinglePayment();
    });
}

function SaveSinglePayment() {
    // Validate form data
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
    const paymentDate = document.getElementById('paymentDate').value;
    const subscriptionEndDate = document.getElementById('subscriptionEndDate').value;

    if (!paymentAmount || !paymentDate || !subscriptionEndDate) {
        alert('Please fill out all fields correctly.');
        return;
    }

    // Add logic to handle saving or processing the single payment details
    console.log('Payment Amount:', paymentAmount);
    console.log('Payment Date:', paymentDate);
    console.log('Subscription End Date:', subscriptionEndDate);

    // Split the string into month and year
    let [month, year] = subscriptionEndDate.split("/");

    //Clear the private offers object
    _privateOffers.length = 0;

    // Initialize the first private offer based on the first payment
    _privateOffers.push({
        id: 1,
        numberOfPayments: 1,
        startDate: new Date(),
        endDate: new Date(),
        amount: paymentAmount,
    });

    _privateOffers.push({
        id: 2,
        numberOfPayments: 1,
        startDate: new Date(),
        endDate: new Date(year, month - 1, 1),
        amount: 0,
    });

    DisplayPrivateOffers();
}

function VariableAmounts() {
    let output = document.getElementById('output');
    output.innerHTML = '';

    let tmpInvoiceDate = new Date();
    let i = 1;

    output.innerHTML += `
        <div class="container">    
            <div class="row">
                <div class="col">
                    Payment Amount
                </div>
                <div class="col">
                    Invoice Date
                </div>
            </div>
    `;

    _payments.length = 0; //clear the array

    for (i = 1; i <= _numberOfPayments; i++) {

        if (i !== 1) {
            tmpInvoiceDate.setMonth(tmpInvoiceDate.getMonth() + (_paymentFrequency === 'Month' ? 1 : 12));
        }

        output.innerHTML += `
            <div class="row">
                <div class="col">
                    <input type="text" id="payment-${i}" value="$${_pricePerPayment.toFixed(2)}" class="form-control">
                </div>
                <div class="col">
                    <input type="text" id="date-${i}" value="${FormatDateToMMYYYY(tmpInvoiceDate)}" class="form-control" readonly>
                </div>
            </div>
        `;

        _payments.push({
            id: i,
            amount: _pricePerPayment,
            dueDate: tmpInvoiceDate.toLocaleDateString()
        });
    }

    output.innerHTML += `</div`;

    // Show Save Payment Plan button
    let saveButton = document.createElement('button');
    saveButton.textContent = 'Save Payment Plan';
    saveButton.className = 'btn btn-success mt-3';
    saveButton.addEventListener('click', SavePayment);
    output.appendChild(saveButton);
}

function SavePayment() {
    let tmpTotal = 0;


    // Update payment amounts based on input values and calculate the total
    _payments.forEach((payment, index) => {
        const amountInput = parseFloat(document.getElementById(`payment-${index + 1}`).value.replace('$', ''));
        payment.amount = amountInput;
        tmpTotal += amountInput;
    });

    if (tmpTotal !== _contractTotal) {
        alert("The deal total does not match the sum of all payments: $" + tmpTotal.toFixed(2) + " vs $" + _contractTotal.toFixed(2) + ", please review the payment amounts and update as appropriate.");
    } else {
        // Debug output to display the privateOffers object
        console.log("Debug: _payments", _payments);

        //Calculate Private offers
        CalculatePrivateOffers();

        // Display the private offers
        DisplayPrivateOffers();

    }

}

function CalculatePrivateOffers() {
    let numberOfOffers = 1;
    let i = 0;

    // Clear the array to start fresh
    _privateOffers.length = 0;

    // Initialize the first private offer based on the first payment
    _privateOffers.push({
        id: numberOfOffers,
        numberOfPayments: 1,
        startDate: _payments[i].dueDate,
        endDate: AdjustEndDate(_payments[i].dueDate, 1),
        amount: _payments[i].amount,
    });

    // Iterate over the payments to calculate private offers
    for (i = 1; i < _payments.length; i++) {
        // Check if the current payment does not belong to an existing offer
        if (_payments[i].amount !== _payments[i - 1].amount) {
            // Create a new private offer when payment amounts differ
            numberOfOffers++;

            _privateOffers.push({
                id: numberOfOffers,
                numberOfPayments: 1,
                startDate: _payments[i].dueDate,
                endDate: AdjustEndDate(_payments[i].dueDate, 1),
                amount: _payments[i].amount,
            });
        } else {
            // Update the current private offer if amounts are the same
            _privateOffers[numberOfOffers - 1].numberOfPayments++;
            _privateOffers[numberOfOffers - 1].endDate = AdjustEndDate(
                _privateOffers[numberOfOffers - 1].startDate,
                _privateOffers[numberOfOffers - 1].numberOfPayments
            );
        }
    }

    // Debug output to display the privateOffers object
    console.log("Debug Output: _privateOffers", _privateOffers);
}

function AdjustEndDate(endDate, numberOfPayments) {
    // Create a new date object to avoid mutating the original endDate
    let tmpEndDate = new Date(endDate);

    if (_paymentFrequency === 'Month') {
        // If there's only one payment, return the current end date
        if (numberOfPayments === 1) {
            return tmpEndDate;
        } else {
            // Adjust the month based on the number of payments
            tmpEndDate.setMonth(tmpEndDate.getMonth() + (numberOfPayments - 1));
        }
    } else if (_paymentFrequency === 'Year') {
        // If there's only one payment, return the current end date
        if (numberOfPayments === 1) {
            return tmpEndDate;
        } else {
            // Adjust the year based on the number of payments
            tmpEndDate.setFullYear(tmpEndDate.getFullYear() + (numberOfPayments - 1));
        }
    }

    return tmpEndDate;
}

function DisplayPrivateOffers() {
    let output = document.getElementById('output');
    output.innerHTML = ''; // Clear existing content

    let content = $("<div></div>")
        .append(
            $("<div></div>")
                .append(
                    $("<div></div>")
                        .append(
                            $("<h2></h2>").text("Step One - Offer Prerequisites")
                        )
                        .append(
                            $("<div></div>")
                                .append(
                                    $("<p></p>").text("A published offer with a public plan configured as follows:")
                                )
                                .append(
                                    $("<ul></ul>")
                                        .append($("<li></li>").text(`Pricing model: ${_pricingModel}`))
                                        .append($("<li></li>").text(`Billing Term: ${_billingTerm}`))
                                        .append($("<li></li>").text(`Payment option: ${_paymentOption}`))
                                )
                                .append(
                                    $("<p></p>").text(`Note: This example assumes the customer will subscribe in ${_thisMonth} ${_thisYear}.`)
                                )
                                .append(
                                    $("<div></div>")
                                        .append($("<h3></h3>").text("Related Documentation"))
                                        .append(
                                            $("<ul></ul>")
                                                .append($("<li></li>").text("Prerequisites"))
                                                .append($("<li></li>").text("Plans"))
                                                .append($("<li></li>").text("Pricing models"))
                                                .append($("<li></li>").text("Billing terms and payment options"))
                                        )
                                )
                                .append(
                                    $("<div></div>")
                                        .append($("<h3></h3>").text("Related Mastering the Marketplace Videos"))
                                        .append(
                                            $("<ul></ul>")
                                                .append($("<li></li>").text("Private offer overviews"))
                                                .append($("<li></li>").text("Handling multiple currencies"))
                                        )
                                )
                        )
                )
        )
        .append(
            $("<div></div>")
                .append(
                    $("<div></div>")
                        .append(
                            $("<h2></h2>").text("Step two - Private Offer(s) Configuration")
                        )
                        .append(
                            $("<div></div>")
                                .append(
                                    $("<p></p>").text("To support the provided deal configuration, please create the following private offer(s) as outlined below:")
                                )
                        )
                )
        );

    // Initialize the main accordion container
    content = content.html();

    // Iterate over private offers and add details
    _privateOffers.forEach((offer) => {
        content += `
                        <p><strong>Private Offer ${offer.id}</strong></p>
                        <ul>
                            <li><strong>Start date:</strong> ${FormatDateToMMYYYY(offer.startDate)}</li>
                            <li><strong>End date:</strong> ${FormatDateToMMYYYY(offer.endDate)}</li>
                            <li><strong>Set the price per payment to:</strong> $${offer.amount.toFixed(2)}</li>
                            <li><strong>Billing term:</strong> ${_billingTerm}</li>
                            <li><strong>Payment option:</strong> ${_paymentOption}</li>
                        </ul>
                        <p></p>
                    `;
    });

    content += `<div>
                    <div>
                        <h3>Related Documentation</h3>
                        <ul>
                            <li>Create a private offer</li>
                            <li>Private offers FAQ</li>
                        </ul>
                    </div>
                    <div>
                        <h3>Related Mastering the Marketplace Videos</h3>
                        <ul>
                            <li>Creating a private offer</li>
                            <li>Handling multiple currencies</li>
                        </ul>
                    </div>
                </div>
                <div>
                    <h2>Step three - Customer Action</h2>
                    <div>
                        <h3>ISV Action:</h3>
                        <p>Prepare and send an email to your customer, including the link(s) to the newly created private offer(s). At the end of the ${_numberOfPayments} ${_paymentFrequency}, you will need to set up a new private offer on the same public plan or customer will fall back to the list price.</p>
                        <h3>Customer Action:</h3>
                        <p>You can use the following action list as supplemental information to include in your email when sharing the private offer link with your customer.</p>
                        <ul>
                            <li>Accept the private offer(s) to lock the price for the ${_numberOfPayments} ${_paymentFrequency}(s).</li>
                            <li>Subscribe (purchase) the product and ensure that the ${_billingTerm} term is selected.</li>
                            ${_autoRenew}
                            <li>Ensure to have the auto-renew set to true (selected).</li>
                            <li>Alternatively, Customer should switch off auto-renew if they no longer want the product after the ${_numberOfPayments} ${_paymentFrequency}(s).</li>
                        </ul>
                    </div>
                    <div>
                        <h3>Related Documentation</h3>
                        <ul>
                            <li>Customer private offers overview</li>
                            <li>Customer: Prepare your account</li>
                            <li>Customer: Accept the offer</li>
                            <li>Customer: Purchase or subscribe</li>
                        </ul>
                    </div>
                    <div>
                        <h3>Related Mastering the Marketplace Videos</h3>
                        <ul>
                            <li>Private offers overview for customer</li>
                        </ul>
                    </div>
                </div>
            `;

    // Set the constructed content to the output container
    output.innerHTML = content;
}

function FormatDateToMMYYYY(date) {

    date = new Date(date);

    // Extract the month and add leading zero if needed
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    // Extract the full year
    let year = date.getFullYear();

    // Format the date as MM-YYYY
    return `${month}-${year}`;
}


function DelayedBilling() {
    // Clear existing content
    let output = document.getElementById('output');
    output.innerHTML = '';

    // Create form for Delayed Billing details
    let formContent = `
        <div class="card">
            <div class="card-header">
                Delayed Billing
            </div>
            <div class="card-body">
                <h5 class="card-title">How to configure delayed billing</h5>
                <p class="card-text">Select the <strong>Variable amounts</strong> options and change the price to zero to one or more of the payments.</p>
            </div>
        </div>
    `;

    // Insert form content into the output element
    output.innerHTML = formContent;

}

function SinglePrivateOffer() {
    let output = document.getElementById('output');
    output.innerHTML = '';

    // Check payment frequency and set billing terms accordingly
    if (_paymentFrequency === 'Month') {
        if (_numberOfPayments === 1) {
            _billingTerm = "1-Month";
            _paymentOption = "One-time";
        } else if (_numberOfPayments < 12) {
            _billingTerm = "1-Month";
            _paymentOption = "One-time";
            _autoRenew = true;
        } else if (_numberOfPayments === 12) {
            _billingTerm = "1-Year";
            _paymentOption = "Per month";
        } else if (_numberOfPayments < 24) {
            _billingTerm = "1-Month";
            _paymentOption = "One-time";
            _autoRenew = true;
        }
    } else if (_paymentFrequency === 'Year' && _numberOfPayments === 1) {
        _billingTerm = "1-Year";
        _paymentOption = "One-time";
    }


    //_endDate = AdjustEndDate(new Date(_startDate));
    if (_paymentFrequency === 'Month') {
        _endDate.setMonth(_startDate.getMonth() + _numberOfPayments);
    } else if (_paymentFrequency === 'Year') {
        _endDate.setFullYear(_startDate.getFullYear() + _numberOfPayments);
    }

    // Clear the array to start fresh
    _privateOffers.length = 0;

    // Initialize the first private offer based on the first payment
    _privateOffers.push({
        id: 1,
        numberOfPayments: 1,
        startDate: new Date(),
        endDate: _endDate,
        amount: _pricePerPayment,
    });

    DisplayPrivateOffers();

}