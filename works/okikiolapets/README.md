# Church Website Template (Premium & Reusable)

A clean, scalable, and backend-ready church website template built with **HTML, CSS, and JavaScript**.  
Designed to be reusable across multiple organizations with minimal modification.

This version is currently deployed for **Methodist Church Ijoku, Sagamu Circuit** and structured for future CMS or backend integration (Firebase / Django / API-based).

---

## 🚀 Features

- Clean & premium UI (traditional + modern blend)
- Fully responsive layout (mobile-ready)
- Modular CSS architecture
- Backend-ready HTML structure
- Admin dashboard UI (HTML & CSS)
- Sermons (audio & video ready)
- Gallery & Contact pages
- Easy to customize for other clients

---

## 📁 Project Structure

church-website/
│
├── Home/
│ └── index.html
│
├── about/
│ └── index.html
│
├── services/
│ └── index.html
│
├── sermons/
│ └── index.html
│
├── gallery/
│ └── index.html
│
├── contact/
│ └── index.html
│
├── admin/
│ ├── login.html
│ ├── index.html
│ └── css/
│ └── admin.css
│
├── css/
│ ├── main.css # Global styles
│ ├── home.css # Home-specific layout fixes
│ ├── about.css
│ ├── services.css
│ ├── sermons.css
│ ├── gallery.css
│ └── contact.css
│
├── js/
│ └── main.js
│
└── README.md

---

## 🎨 Styling Philosophy

- `main.css` → global styles (colors, typography, header, footer)
- Page-specific CSS files → layout & spacing only
- Admin styles are fully isolated in `admin/css/admin.css`

This ensures:

- No style conflicts
- Easy reuse across projects
- Safe future scaling

---

## 🔐 Admin Dashboard (UI Only)

The admin section currently includes:

- Login page (UI only)
- Dashboard layout (UI only)

Planned upgrades:

- CRUD functionality
- Authentication
- Role-based permissions
- Media uploads (images, audio, video)

---

## 🛠️ Local Development

### Run Local Server (Recommended)

Using Python:

```bash
python -m http.server 5500
```
