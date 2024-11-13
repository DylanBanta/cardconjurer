# Card Conjurer

Card Conjurer was created by a passionate Magic: The Gathering player and grew to become one of the most popular online card generators known to the game.

In November 2022, Wizards of the Coast served the original creator and web host of the site with Cease and Desist paperwork, forcing the site offline. 

This repository is for the purpose of making the application usable on your local machine and maintaining templates in perpetuity.

---

## Setup

### Traditional Setup
1. Clone this repository somewhere on your system. (Alternatively, you can download the ZIP via CODE > Download ZIP above).
2. Run the appropriate server executable:
   - `server.exe` (Windows)
   - `mac-server` (MacOS)
   - `linux-server` (Linux)
3. That's it! You can also set up Card Conjurer using WAMP, XAMPP, or similar tools.

---

## Running with Docker

### Updated Setup: Docker Compose
This repository now uses a `docker-compose.yml` file to simplify building and deploying Card Conjurer.

1. Ensure Docker is installed and running on your system.
   - For Windows or Mac, start Docker Desktop.
   - For Linux, ensure Docker and Docker Compose are installed.

   **Note:** Use the command `docker --version` to verify your installation.

2. Clone this repository:
   ```bash
   git clone https://github.com/DylanBanta/cardconjurer.git
   cd cardconjurer
   ```

3. Build and start the application using Docker Compose:
   ```bash
   sudo docker compose up --build -d
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:4242/
   ```

---

## Why We Updated the Setup

The previous setup relied on a simple `Dockerfile` that used `nginx` to serve static files. While this approach worked, it stored cards in browser-based local storage, which has a **~5MB limit**. This made it impractical for users with many saved cards.

The new setup uses a `docker-compose.yml` file with two services:
- **`mtg-web`:** A PHP container to handle server-side logic.
- **`mtg-nginx`:** A web server for serving files and processing requests.

This change shifts card storage from the browser to a server-side database, removing the size limit and allowing users to save more cards.

---

## Supporting the Original Creator

[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg?longCache=true&style=popout)](https://www.paypal.me/kyleburtondonate)

If you'd like to support the original creator of Card Conjurer, Kyle Burton, please consider donating to him. We appreciate all the work he put into this amazing tool. Thank you, Kyle!