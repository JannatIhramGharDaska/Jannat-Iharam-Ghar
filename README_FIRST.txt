JANNAT IHRAM GHAR WEBSITE - FIRST RUN (WINDOWS)

EASY METHOD:
1) Install Node.js LTS (Node 20 or newer) from https://nodejs.org/.
2) Extract this ZIP to a normal folder, e.g. Desktop\Jannat_Ihram_Ghar_Website.
3) Double-click INSTALL_AND_RUN.bat.
4) Wait for setup. On the first run npm install needs an internet connection.
5) When the terminal says Ready, open http://localhost:3000 in your browser.

MANUAL METHOD (if you prefer commands):
Open the project folder, click the File Explorer address bar, type cmd and press Enter. Run:
  npm install
  npx prisma generate
  npx prisma db push
  npm run db:seed
  npm run dev

ADMIN PANEL:
http://localhost:3000/admin/login
Username: admin
Password: ChangeThisAdminPassword123!
These are local starter credentials. Change ADMIN_PASSWORD and JWT_SECRET in .env before any public deployment. Keep .env private and never upload it to GitHub.

IMPORTANT BEFORE TAKING REAL ORDERS:
- Starter products and prices are sample data. Replace them with your real stock, accurate prices, photos and descriptions in the Admin panel.
- Confirm the WhatsApp number and all contact details shown in Navbar/Footer. Some footer phone/email/address values in the supplied design are placeholders.
- Confirm delivery charges with your courier. The current website uses PKR 200 flat delivery.
- The database is local SQLite, stored at prisma/dev.db. Back it up regularly. This local database is not automatically shared between PCs.
- This package is prepared for local development. Public deployment still needs production database setup, HTTPS, backup plan, and changed credentials/secrets.

If setup fails, take a screenshot or copy the full terminal error and send it to ChatGPT. Do not delete the project or database.
