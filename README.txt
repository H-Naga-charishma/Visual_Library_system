EXPERIMENT 3 - Library Visual Storage System
=============================================

Run:
    cd Exp3
    npm install
    node server.js        -> http://localhost:3001

Files:
    server.js       Express backend (GET / POST / PUT / PATCH / DELETE)
    config.json     port + exp2CustomerPath  (paste the "Copy as path" value of Exp2\customer.json)
    customers.json  master customer data
    alter.json      log of every update / alteration
    public/         index.html, script.js, records.js, style.css

API:
    GET    /api/customers[?search=]   list customers
    GET    /api/customers/:id         one customer
    POST   /api/customers             add customer
    PUT    /api/customers/:id         UPDATE phone, email, racks, shelves
    PATCH  /api/customers/:id         ALTER customer / rack details (name, length, door ...)
    DELETE /api/customers/:id         delete from customers.json, alter.json and Exp2 customer.json
    GET    /api/alter[?customerId=]   alteration log
