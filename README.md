# Roadside Rescue - Frontend

## Contributors
 Gitau William
 ---

## Emergency Roadside Assistance Platform

Roadside Rescue is a comprehensive frontend application for connecting stranded drivers with verified garages. The platform features real-time tracking, instant job alerts, and role-based dashboards.

---

## Problem Statement

Drivers stranded on the road face:
- No visibility on rescue vehicle location
- Uncertainty about response times
- Difficulty finding verified service providers
- No way to rate service quality
- Frustrating wait times with no updates

---

## Solution Overview

Roadside Rescue provides three role-specific interfaces:

| Role | Features |
|------|----------|
| **Client** | Request rescue, live tracking, job history, reviews, saved vehicles |
| **Garage** | Accept jobs, update status, share location, manage services |
| **Admin** | User management, garage verification, platform analytics |

---

## Design System

**Primary Color:** Red (#dc2626) - Emergency/Urgency theme
- Red: Primary actions, emergency alerts
- Gray: Neutral backgrounds
- White: Cards and containers

**Typography:**
- Headers: Bold, tracking-tight
- Body: Regular, gray-600

**Layout:** Responsive grid, card-based design

---

## Key Features

- **Real-time job alerts** - Socket.io integration
- **Live location tracking** - Leaflet maps with route calculation
- **Google OAuth Login** - Firebase authentication
- **Role-based dashboards** - Separate UI for clients, garages, admins
- **Interactive maps** - Distance calculation, ETA display
- **Notification preferences** - Customize alert settings
- **Responsive design** - Mobile-friendly with hamburger menu

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **React Router DOM** | Navigation |
| **Socket.io-client** | Real-time communication |
| **Axios** | API requests |
| **Leaflet** | Maps & geolocation |
| **Chart.js** | Admin analytics |
| **Firebase** | Google authentication |

---

## Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/gitauwilly1/roadside-rescue-client.git
    cd roadside-rescue-client

2. **Install Dependencies**
   ```bash
   npm install

3. **Build for Production**
   ```bash
   npm run build


## Known Bugs
There are no known bugs 

---

## License
* **License:** MIT License.

---

## Support and Information
**Email:** gitauwilly254@gmail.com  