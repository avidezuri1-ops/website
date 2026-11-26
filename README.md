# Avi De Zuri storefront (Next.js)

Catalog + cash-on-delivery order form that sends orders to WhatsApp.

## Run locally
    npm install
    npm run dev        # http://localhost:3000

## Edit your shop
- `lib/config.js`: WhatsApp number, prices, product names, new arrivals
- `public/images/logo.png`, `public/images/hero-banner.jpg`
- `public/images/products/<name>.jpg`: see `public/images/README.txt` for exact file names

## Deploy free on Vercel
1. Push this folder to a GitHub repository.
2. Go to vercel.com, choose Add New > Project, import the repository, and click Deploy.
3. In the project's Domains settings, add avidezuri.com (and www.avidezuri.com) and follow the DNS steps shown.

Netlify also works: connect the repository, and it detects Next.js automatically.
