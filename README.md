# 📞 RootTech Telephony & Call Support Portal

[![PHP Version](https://img.shields.io/badge/PHP-8.2%2B-777BB4?style=flat&logo=php&logoColor=white)](https://php.net)
[![Laravel Framework](https://img.shields.io/badge/Laravel-12.0-FF2D20?style=flat&logo=laravel&logoColor=white)](https://laravel.com)
[![Status](https://img.shields.io/badge/Status-Active%20Production-success)](#)
[![Theme](https://img.shields.io/badge/Theme-Dark%20%26%20Light%20Mode-6366f1)](#)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A high-performance, real-time **Telephony Call Support Management System**, **Agent Softphone Console**, and **PBX Administration Portal** tailored for customer support teams, call centers, and marketplace platforms.

The system integrates directly with the **RootTech PBX & Telephony Gateway API** (`http://117.217.126.149:880/roottech/index.php`) to deliver live agent presence tracking, click-to-call dialing, real-time incoming call popup notifications, dynamic BSNL DID number masking (for customer-provider privacy), and call recording audio playback.

---

## 🌟 Key System Capabilities

### 🎧 1. Agent Softphone & Support Console
- **Agent Session Management**: Authenticates support agents against the PBX (`r=agent/login`) with session tokens and automatic logout triggers (`r=agent/logout`).
- **Live Presence Control**: Instant toggle between `🟢 Available` (Queue Active), `🟡 Break` (Paused), and `🟣 Offline`.
- **Real-Time Call Polling & Screen-Pops**: 
  - Background polling every 1.5s (`r=agent/poll`) for incoming support queue calls.
  - Floating screen-pop notification with Caller ID, dialed DID number, CRM lookup URL, and one-click acknowledgement (`r=agent/ack`).
- **Click-to-Call Dialer**:
  - One-click customer call origination (`r=call/customer`).
  - One-click service provider / helper call origination (`r=call/maid`).
  - Direct outbound dialpad with live polling status (`r=call/status/{req_id}`).
- **Call Recordings & Audio Stream**: Audit, search, and stream authenticated WAV call recordings directly in the browser.

---

### 🛠️ 2. Telephony Admin Console
- **Unified Theme & Layout**: Sidebar navigation matching the Agent Portal with a live module switcher, header diagnostics, and real-time data sync.
- **Admin Overview**:
  - **Live Counters**: Total Support Agents, Available/Ready count, Total Call Records, and active Mask DID (`912612385555`).
  - **Gateway Configuration Strip**: Remote PBX URL, masked Master Bearer Token, and one-click **Test Connection** diagnostic button.
  - **Quick Action Launcher**: Create Agent, Manage Masking, Browse Recordings, Test Outbound Calling, and Refresh All Data.
  - **Live Dual Tables Grid**:
    - **Active Agents & SIP Peers**: Displays agent name, code, extension, presence badge, SIP registration state, and delete action.
    - **Recent Call Activity & Audio**: Displays booking ID, caller, destination, duration, disposition status badge, and inline audio play button.
- **Agent Directory & SIP Management**:
  - Full CRUD operations: Create (`r=agent/create`), Edit (`r=agent/update`), and Delete (`r=agent/delete`) support agents and SIP extension credentials.
- **Universal DID Masking**:
  - Assign masked call routes between customers and service providers per booking (`r=mapping`).
  - Deactivate mapping upon booking completion, cancellation, or expiration (`r=mapping/deactivate`).
- **Call Recordings & CDR Archive**:
  - Filter call recordings by date range (`from` / `to`), keyword query (`q`), and pagination.
  - Stream binary WAV audio securely via authenticated proxy endpoints (`r=recording/play`).
- **Click-to-Call Tester & API Logs**:
  - Dedicated endpoint tester for `call/customer` and `call/maid` with live JSON response viewer.
  - PBX transaction logs with response codes, caller/destination routes, and latency.
- **System Auth Diagnostics**:
  - Direct validation of the Master Bearer Token against `?r=auth/check`.

---

### 🎨 3. Unified Dark & Light Theme System
- **Real-Time Toggle**: Seamless one-click switching via the **Theme (🌙 / ☀️)** button in the header bar.
- **Persistent Preference**: Automatically saves and restores your preferred theme using browser `localStorage`.
- **High-Contrast Design System**:
  - **☀️ Light Theme**: Crisp `#f8fafc` background, pure white `#ffffff` cards, deep slate `#0f172a` typography, soft pastel status badges, and refined glass borders.
  - **🌙 Dark Theme**: Deep slate space navy `#0b0f19` background, `#111827` sidebar, translucent `#111827` cards with backdrop blur, and vivid cyan/emerald accents.
  - **Zero Hardcoded Inversion**: All badges (`.badge-emerald`, `.badge-amber`, `.badge-purple`, `.badge-rose`, `.badge-cyan`), code viewer boxes (`.json-code-viewer`, `.token-code`), and modals adapt dynamically.

---

### ⚡ 4. Dual Architecture (Laravel + Standalone PHP)
- **Laravel 12 MVC**: Full service-oriented architecture with `RootTechApiService`, `EnsureAgentAuthenticated` middleware, CSRF security, and Blade layouts.
- **Standalone PHP / XAMPP**: Native Apache-ready scripts (`dashboard.php`, `admin.php`, `login.php`, `api.php`, `assets/`) for instant deployment without Composer dependencies.

---

## 📂 Project Structure

```text
cf/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AdminController.php         # Admin console controller
│   │   │   ├── ApiController.php           # AJAX telephony proxy & WAV audio streaming
│   │   │   ├── AuthController.php          # Agent authentication & presence status
│   │   │   └── DashboardController.php     # Agent dashboard views & statistics
│   │   └── Middleware/
│   │       └── EnsureAgentAuthenticated.php # Session validation middleware
│   └── Services/
│       └── RootTechApiService.php          # Wrapper for RootTech PBX endpoints
├── assets/                                 # Static assets for standalone PHP mode
│   ├── css/
│   │   └── style.css                       # Complete unified Dark/Light theme stylesheet
│   └── js/
│       ├── app.js                          # Dashboard logic & live event polling
│       └── admin.js                        # Admin panel CRUD & recordings player
├── config/
│   └── roottech.php                        # RootTech PBX API configuration
├── public/                                 # Laravel web public directory
│   ├── css/
│   │   └── style.css                       # Laravel stylesheet (Dark/Light theme)
│   └── js/
│       ├── app.js                          # Laravel Agent console logic
│       └── admin.js                        # Laravel Admin console logic
├── resources/
│   └── views/                              # Blade view templates
│       ├── layouts/
│       │   └── app.blade.php               # Master layout with theme & CSRF header
│       ├── admin.blade.php                 # Admin Console Blade template
│       ├── dashboard.blade.php             # Agent Dashboard Blade template
│       └── login.blade.php                 # Agent Login Blade template
├── routes/
│   └── web.php                             # Laravel web routes & proxy endpoints
├── admin.php                               # Standalone Admin Console entry point
├── api.php                                 # Standalone AJAX proxy API handler
├── dashboard.php                           # Standalone Agent Dashboard entry point
├── login.php                               # Standalone Login page
├── logout.php                              # Standalone Logout handler
├── .env.example                            # Environment configuration example
├── composer.json                           # Composer dependencies
└── README.md                               # Project documentation
```

---

## ⚙️ Configuration & Environment

The application communicates with the remote PBX server using a Master Bearer API Token and a Universal BSNL Mask DID number.

### `.env` Configuration
```dotenv
# RootTech PBX Telephony API Configuration
ROOTTECH_BASE_URL=http://117.217.126.149:880/roottech/index.php
ROOTTECH_BEARER_TOKEN=11af5c25470d1306970a9175df8a1213da7435960305169f
ROOTTECH_MASK_DID=912612385555
```

### `config/roottech.php`
```php
return [
    'base_url'     => env('ROOTTECH_BASE_URL', 'http://117.217.126.149:880/roottech/index.php'),
    'bearer_token' => env('ROOTTECH_BEARER_TOKEN', '11af5c25470d1306970a9175df8a1213da7435960305169f'),
    'mask_did'     => env('ROOTTECH_MASK_DID', '912612385555'),
];
```

---

## 🔑 Default Credentials & Access Links

### Seed Agent Credentials:
* **Agent Code**: `1001`
* **Password**: `Agent@123`
* **SIP Peer**: `1001`
* **Universal DID Mask**: `912612385555`

### Local URL Endpoints:

| Portal | Laravel Server (Port 8000) | Standalone Apache (XAMPP) |
| :--- | :--- | :--- |
| **Agent Login** | [http://127.0.0.1:8000/login](http://127.0.0.1:8000/login) | [http://localhost/cf/login.php](http://localhost/cf/login.php) |
| **Agent Console** | [http://127.0.0.1:8000/dashboard](http://127.0.0.1:8000/dashboard) | [http://localhost/cf/dashboard.php](http://localhost/cf/dashboard.php) |
| **Admin Console** | [http://127.0.0.1:8000/admin](http://127.0.0.1:8000/admin) | [http://localhost/cf/admin.php](http://localhost/cf/admin.php) |

---

## 📡 Remote PBX API Endpoints Reference

Matched directly against the official documentation at `http://117.217.126.149:880/roottech/api_docs.php`:

### 1. CRM / Admin Level Endpoints (`Authorization: Bearer <API_TOKEN>`)
| Endpoint | Method | Purpose |
| :--- | :---: | :--- |
| `?r=auth/check` | `GET` | Validates the Master Bearer Token (`11af5c25...`) |
| `?r=agent/list` | `GET` | Returns list of support agents, SIP peers, and registration states |
| `?r=agent/create` | `POST` | Registers a new support agent console login and SIP extension |
| `?r=agent/update` | `POST` | Updates agent full name, console password, or SIP secret |
| `?r=agent/delete` | `POST` | Removes agent, queue membership, and SIP peer from Asterisk |
| `?r=mapping` | `POST` | Creates / updates two-way DID masking for a booking |
| `?r=mapping/deactivate` | `POST` | Deactivates DID masking for a completed / cancelled booking |
| `?r=call` | `POST` | Generic click-to-call originator |
| `?r=call/customer` | `POST` | Rings agent SIP (`1001`), then dials mapped customer number |
| `?r=call/maid` | `POST` | Rings agent SIP (`1001`), then dials mapped helper/maid number |
| `?r=call/status/{req_id}` | `GET` | Polls originate result (`ORIGINATING`, `ANSWERED`, `NO ANSWER`, `FAILED`) |
| `?r=recordings` | `GET` | Queries call records with filters (`from`, `to`, `q`, `limit`, `page`) |
| `?r=recording/play` | `GET` | Streams / downloads binary WAV recording audio |
| `?r=logs` | `GET` | Queries telephony transaction logs and API response latencies |

### 2. Agent Console Session Endpoints (`Authorization: Bearer <session_token>`)
| Endpoint | Method | Purpose |
| :--- | :---: | :--- |
| `?r=agent/login` | `POST` | Authenticates `agent_code` + `password` and returns a `session_token` |
| `?r=agent/status` | `POST` | Updates agent queue presence (`available`, `break`, `offline`) |
| `?r=agent/poll` | `GET` | Polls every 1.5s for incoming support queue screen-pops |
| `?r=agent/ack` | `POST` | Acknowledges received screen-pop alert by ID |
| `?r=agent/logout` | `POST` | Leaves the support queue and destroys the session token |

---

## 🚀 Installation & Setup

### Running via Laravel 12:
```bash
# 1. Navigate to directory
cd D:/Xampp/htdocs/cf

# 2. Install dependencies
composer install

# 3. Setup environment configuration
cp .env.example .env
php artisan key:generate

# 4. Clear and cache views
php artisan view:clear

# 5. Start the local server
php artisan serve --host=0.0.0.0 --port=8000
```

### Running via XAMPP Apache:
1. Place the project in `D:/Xampp/htdocs/cf`.
2. Start **Apache** from XAMPP Control Panel.
3. Open `http://localhost/cf/login.php` in your browser.

---

## 🔒 Security & Privacy Architecture

- **Server-Side Token Isolation**: The Master Bearer API token is stored securely in environment variables and never sent to the client browser.
- **AJAX Proxy Tunneling**: Client requests from the UI communicate with `/api/telephony/{action}` (or `api.php`), which proxies calls securely to the remote PBX.
- **Audio Streaming Guard**: Audio WAV requests are proxied with proper `Content-Type: audio/wav` and `Accept-Ranges: bytes` headers.
- **Number Masking (BSNL DID)**: Telephony routing uses the universal mask DID `912612385555`, protecting the real telephone numbers of both customers and service providers.

---

## 📄 License
This project is licensed under the **MIT License**.
