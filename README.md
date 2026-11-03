# Avidezuri Storefront

A responsive static perfume storefront for Avidezuri. The site uses plain HTML, CSS and JavaScript; no framework or build step is required.

## Project structure

```text
avidezuri-storefront/
├── public/
│   ├── index.html
│   ├── images/hero-banner.jpg
│   ├── assets/logo.png
│   ├── css/styles.css
│   └── js/app.js
├── package.json
├── wrangler.jsonc
├── .gitignore
└── README.md
```

**Important:** Put these files and folders directly in the GitHub repository root. After opening the repository on GitHub, you should see `wrangler.jsonc`, `package.json`, `README.md`, and `public/` at the first level. Do not leave them inside an extra `avidezuri-cloudflare/` folder unless you set that folder as the Cloudflare Workers Build root directory.

## Deploy using Cloudflare Workers Builds (recommended for this configuration)

1. In GitHub, create or open the repository and upload the contents of this project folder so that `wrangler.jsonc`, `package.json`, and `public/` are at the repository root.
2. In Cloudflare, open **Workers & Pages** and select your Worker named `avidezuri`.
3. Open **Settings → Builds** and connect the GitHub repository.
4. Use these build settings:
   - **Production branch:** `main` (or the branch you use)
   - **Root directory:** leave blank / repository root when the project files are at the repository root
   - **Build command:** leave blank (this is a static HTML/CSS/JS website)
   - **Deploy command:** `npx wrangler deploy`
   - **Preview command:** leave the default unless you have a separate preview workflow
5. Save the settings and trigger a new build. Wrangler reads `wrangler.jsonc` and publishes the `public/` folder as static assets.
6. Test the generated `*.workers.dev` URL before connecting your custom domain.

### If your files are already nested in a subfolder

If the GitHub repository shows only a folder named `avidezuri-cloudflare` at the top level, set **Root directory** under **Workers → Settings → Builds** to:

```text
avidezuri-cloudflare
```

Then save and retry the build. Alternatively, move the contents of that folder to the repository root and leave Root directory blank.

## Alternative: Cloudflare Pages (do not mix Pages and Workers settings)

This is also a static site and can be hosted on Cloudflare Pages instead of Workers. Create a **Pages** project using Git integration and set:

- **Framework preset:** None
- **Build command:** leave blank
- **Build output directory:** `public`
- **Root directory:** `/` when `public/` is at the repository root; otherwise set it to the folder containing `public/`

For a Pages project, do **not** set the deploy command to `npx wrangler deploy`. That command is for the Workers deployment workflow described above.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL Wrangler prints.

## Store settings

Product names, category membership, bottle sizes, prices and WhatsApp ordering are configured in `public/js/app.js`.

- Categories: All Products, Exclusive and Budget Friendly
- Exclusive: 30 ml Rs. 1,750; 50 ml Rs. 2,250; 100 ml Rs. 3,200
- Budget Friendly: 30 ml Rs. 1,450; 50 ml Rs. 1,750; 100 ml Rs. 2,250
- 30 ml is selected by default
- Customer service WhatsApp: 0318-1230098
- Instagram and Facebook links are included in the footer

Hero banner: the top banner is `public/images/hero-banner.jpg` (1600×595). To change it, replace that file and keep the same name.

Delivery charges: Karachi only, Rs 200 to Rs 400 by area. Edit the `zones` list at the top of `public/js/app.js` to move areas between fees or add areas. The same list fills the area dropdown in the order form. The fee for each area is not listed on the page; it appears in the order summary once the customer picks their area, and it is added to the total and the WhatsApp message.

Product photos can be added under `public/images/` using the matching product slug as the filename. If no matching photo exists, the illustrated bottle remains visible.

## Before publishing

- Test category filters, size selection, quantity controls and the WhatsApp order flow.
- Confirm all product data, prices, customer-service details and social links.
- Test on desktop and mobile.
- Keep a backup of the current live site and DNS configuration before connecting `avidezuri.com`.
