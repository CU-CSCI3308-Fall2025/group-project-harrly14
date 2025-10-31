# Campus Parking Finder

A real-time, user-reported map displaying available parking spots on campus. Users can navigate an interactive campus map to view parking availability, report parking spots, and log parking enforcement sightings. Authentication is required to post reports and contribute to the community.

## Contributors

- [Dolgormaa Sansarsaikhan](https://github.com/DolgormaaS)
- [Carys Gardner](https://github.com/carysGard) 
- [Xander  DuBois](https://github.com/aldu9080)

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Handlebars
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: OAuth 2.0 (Google, Microsoft), bcrypt (password hashing)
- **Session Management**: express-session
- **Containerization**: Docker, Docker Compose
- **Map Integration**: Google Maps API

## Prerequisites

Before running this application, ensure you have the following installed:

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)

## How to Run the Application Locally

1. **Clone the repository**
```bash
   git clone https://github.com/CU-CSCI3308-Fall2025/group-project-harrly14.git
   cd group-project-harrly14/ProjectSourceCode
```

2. **Set up environment variables**
```bash
   cp .env.example .env
```
   
   Edit the `.env` file and fill in the required values:
   - Database credentials
   - Session secret (generate a random string)

3. **Build the image and start the app (recommended)**

- Dependencies are installed at image build time (fast, consistent startups).
- The container runs non-root by default using the host's UID/GID (no manual chown required).
- `node_modules` is kept inside the container (anonymous volume) so host bind-mounts don't overwrite the image-installed dependencies.

```bash
docker-compose up --build
```

4. **Access the application**
   
   Open your browser and navigate to:
```
   http://localhost:3000
```

5. **Stop the application**
```bash
   docker-compose down
```

   To remove volumes (reset database):
```bash
   docker-compose down -v
```

## How to Run Tests

Tests will be implemented using a testing framework (to be determined).

## Deployed Application

The application is deployed and accessible at:

[Render deployment URL TBD]

---

## Additional Notes

### Troubleshooting

- If port 3000 is already in use, modify the port mapping in `docker-compose.yaml`
- If database connection fails, ensure Docker containers are running: `docker ps`
- For database issues, check logs: `docker-compose logs db`

### Project Structure

See the repository for detailed file organization. An initial directory structure can be found at `/ProjectSourceCode/docs/DIR_STRUCTURE.md`. Key directories:
- `/ProjectSourceCode/src` - Application source code
- `/ProjectSourceCode/src/public` - Static assets (CSS, JS, images)
- `/ProjectSourceCode/src/views` - Handlebars templates
- `/ProjectSourceCode/src/routes` - API and page routes
- `/ProjectSourceCode/src/init_data` - Database initialization scripts