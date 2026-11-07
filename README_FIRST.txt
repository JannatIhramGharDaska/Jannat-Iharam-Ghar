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
Admin username/password are created from ADMIN_USERNAME and ADMIN_PASSWORD environment variables when the database is seeded. Set a strong password (12+ characters) and a random JWT_SECRET (32+ characters). Never upload .env or share secrets.

IMPORTANT BEFORE TAKING REAL ORDERS:
- Starter products and prices are sample data. Replace them with your real stock, accurate prices, photos and descriptions in the Admin panel.
- Confirm the WhatsApp number and all contact details shown in Navbar/Footer. Some footer phone/email/address values in the supplied design are placeholders.
- Confirm delivery charges with your courier. The current website uses PKR 200 flat delivery.
- The production database is PostgreSQL (Neon). The Netlify build runs the checked-in Prisma migration and seeds the admin from environment variables. Add DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to Netlify. Keep all secrets private. The first migration creates the tables in a fresh Neon database. If you already created tables manually with `prisma db push`, do not run migrations until the database migration history has been checked.
- Product, category, logo, and homepage banner images uploaded in Admin > Image Management are stored in Cloudinary. Back up the Neon database regularly.

If setup fails, take a screenshot or copy the full terminal error and send it to ChatGPT. Do not delete the project or database.


NETLIFY ENVIRONMENT VARIABLES (REQUIRED)
- DATABASE_URL: Neon PostgreSQL connection string (use the pooled connection string).
- ADMIN_USERNAME: your chosen private admin username.
- ADMIN_PASSWORD: a strong password with at least 12 characters.
- JWT_SECRET: a random secret with at least 32 characters.
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET: Cloudinary credentials.
Set these in Netlify Project configuration > Environment variables. Never put real credentials in this ZIP or in GitHub.
The first successful build syncs the PostgreSQL schema and creates/updates the admin login from ADMIN_USERNAME and ADMIN_PASSWORD. Every later build also updates that admin password from those environment variables.


IMAGE MANAGEMENT
- Open /admin/login, then Admin Dashboard > Image Management.
- Select Website Logo or Homepage Main Banner, or a product/category slot, choose an image and upload.
- Accepted formats: JPG, PNG, WEBP, GIF, AVIF. Maximum size: 5 MB.
- Uploads are signed server-side; the Cloudinary API secret is never sent to the browser.
- The storefront reads the saved logo/banner from the public media listing API.

DATABASE NOTE
- This project uses a fresh PostgreSQL schema. The old SQLite file was not present in the supplied ZIPs and the owner confirmed there is no existing shop data to migrate.
- Do not run destructive database commands against a live database.
- Production build could not be verified in the review environment because npm package installation timed out; run the build on Netlify after reviewing the environment variables.
