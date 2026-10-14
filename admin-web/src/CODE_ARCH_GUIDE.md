admin-web/src/
├── api/           # axios instance + one file per resource
├── components/    # shared UI (tables, modals, forms)
├── pages/         # Dashboard, Customers, Pets, Appointments, Records, CareInfo
├── routes/        # ProtectedRoute by role
├── context/       # AuthContext
├── hooks/
└── App.jsx

Would recommend this for the code architecture of mobile folder/lib

mobile/lib/
├── core/          # api_client.dart (dio), constants, theme, secure storage
├── features/
│   ├── auth/      # data / presentation
│   ├── pets/
│   ├── appointments/
│   └── care_info/
└── main.dart