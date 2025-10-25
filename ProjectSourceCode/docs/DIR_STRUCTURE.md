parking-app/
├── docker-compose.yaml
├── .env.example
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
│
├── src/
│   ├── init_data/
│   │   ├── 01-create-tables.sql
│   │   ├── 02-create-parking-lots.sql
│   │   └── 03-create-test-users.sql
│   │   └── ...
│   │
│   ├── config/
│   │   └── database.js
│   │
│   ├── routes/
│   │   └── ...
│   │
│   │
│   ├── views/
│   │   ├── layouts/
│   │   │   └── main.hbs       # Main layout with header/footer
│   │   ├── login.hbs
│   │   ├── register.hbs
│   │   └── home.hbs
│   │
│   ├── public/
│   │   ├── css/
│   │   │   ├── styles.css     # Global styles
│   │   │   ├── login.css
│   │   │   ├── register.css
│   │   │   └── map.css
│   │   │
│   │   ├── js/
│   │   │   └── ...
│   │   │
│   │   └── images/
│   │       └── ...
│   │
│   └── server.js              # Main Express server file
│
└── docs/
    ├── SETUP.md               # How to run the project
    └── API.md                 # API endpoint documentation