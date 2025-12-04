.
├── README.md
├── MilestoneSubmissions/
├── ProjectSourceCode/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── docker-compose.yaml
│   ├── Dockerfile
│   ├── init_db.sh                         Used to initialize the Render database
│   ├── package.json
│   ├── docs/
│   │   ├── API.md
│   │   ├── DIR_STRUCTURE.md
│   │   └── SETUP.md
│   ├── src/
│   │   ├── index.js
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── init_data/
│   │   │   ├── 00_create.sql
│   │   │   ├── 01_insert_parking_lots.sql
│   │   │   ├── 02_insert_users.sql
│   │   │   ├── 03_insert_reports.sql
│   │   │   └── 04_start_sessions.sql
│   │   ├── middleware/
│   │   │   └── auth.js                     Used to protect routes
│   │   ├── public/
│   │   │   ├── css/
│   │   │   │   └── styles.css
│   │   │   ├── images/
│   │   │   │   └── CU_Campus.jpg           Used for login & register backgrounds
│   │   │   └── js/
│   │   │       └── map.js
│   │   ├── routes/
│   │   │   ├── auth.js                     Implements auth endpoints
│   │   │   ├── pages.js
│   │   │   ├── parking_lots.js
│   │   │   ├── parking_sessions.js
│   │   │   └── users.js
│   │   └── views/
│   │       ├── layouts/
│   │       │   └── main.hbs
│   │       ├── partials/
│   │       │   ├── head.hbs
│   │       │   ├── title.hbs
│   │       │   ├── nav.hbs
│   │       │   ├── modal.hbs               Used in the "submit report" button
│   │       │   ├── message.hbs
│   │       │   ├── map.hbs
│   │       │   └── footer.hbs
│   │       └── pages/
│   │           ├── home.hbs
│   │           ├── account.hbs
│   │           ├── login.hbs
│   │           ├── logout.hbs
│   │           ├── register.hbs
│   │           ├── update.hbs
│   │           └── update_account_form.hbs
│   └── test/
│       └── server.spec.js
└── TeamMeetingLogs/
    ├── 10.23.25.md
    ├── 10.29.25.md
    ├── 11.12.25.md
    ├── 11.19.25.md
    └── 11.5.25.md