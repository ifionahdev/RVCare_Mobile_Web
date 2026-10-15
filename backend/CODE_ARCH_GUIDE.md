backend/
├── src/
│   ├── config/         # db.js, env, constants
│   ├── routes/         # auth, customers, pets, appointments, records, careInfo
│   ├── controllers/    # parse the request, call a service, send the response
│   ├── services/       # business logic
│   │   └── scheduler.service.js   # greedy heuristic lives here
│   ├── models/         # SQL queries (or Sequelize/Prisma)
│   ├── middleware/     # auth.js (JWT), role.js, validate.js, errorHandler.js
│   ├── utils/
│   └── app.js
├── uploads/            # lab and medical report files (or cloud storage)
├── server.js
└── .env

for test accounts
cd backend 
npm run create:account -- admin01 "AdminPass123!" "System" "Admin" admin
>> 
>> npm run create:account -- vet01 "VetPass123!" "Test" "Veterinarian" vet
>> 
>> npm run create:account -- customer01 "CustomerPass123!" "Test" "Customer" customer