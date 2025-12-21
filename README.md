# ReFind - Lost & Found Platform

A modern, AI-driven lost and found web application built with React 18, TypeScript, and Vite. ReFind helps users report lost items, find items, and match lost items with found items on campus or in communities.

![ReFind](https://img.shields.io/badge/React-18.3.1-blue) ![Vite](https://img.shields.io/badge/Vite-5.4.8-purple) ![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.1-38B2AC)

## 🌟 Features

### Authentication System
- **Sign Up & Sign In**: User-friendly authentication modals with smooth transitions
- **Gmail Integration**: Quick authentication via Gmail
- **Session Management**: Secure user sessions and dashboard access

### Lost & Found Management
- **Report Lost Items**: Submit lost items with image, name, and company/brand
- **Report Found Items**: List found items you've discovered
- **Real-time Status Tracking**: Track whether lost items have been found
- **Return Status Management**: Mark found items as "Returned" or "Not Returned"

### Interactive Dashboard
- **Multi-View Navigation**: Home, Lost Items, Found Items, Heatmap, and Dashboard views
- **Carousel Interface**: Browse items with smooth swipe navigation and indicators
- **Professional Cards**: Beautiful item cards with status badges
- **Image Upload**: Upload images for items with preview functionality
- **Animated Mascot**: Professional animated robot illustration on home page

### User Interface
- **Dark Theme**: Professional dark mode with gradient accents
- **3D Animations**: Stunning 3D cardboard box with bursting item animations
- **Responsive Design**: Works seamlessly on all device sizes
- **Smooth Transitions**: Polished animations and transitions throughout
- **Professional Robot Mascot**: Sleek metallic robot with LED indicators and glowing accents

## 🛠️ Tech Stack

- **Frontend Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.2
- **Language**: TypeScript 5.5.3
- **Styling**: Tailwind CSS 3.4.1
- **Routing**: React Router DOM 7.11.0
- **Icons**: Lucide React 0.344.0
- **3D Graphics**: React Three Fiber 8.12.0 + Three.js 0.150.1
- **3D Components**: Three Drei 9.58.4
- **Backend**: Supabase 2.57.4 (ready for integration)
- **Node**: v18+

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Git

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/refind.git
cd refind
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

The application will open at `http://localhost:5173` (or the next available port).

### 4. Build for Production
```bash
npm build
```

### 5. Preview Production Build
```bash
npm preview
```

## 📁 Project Structure

```
refind/
├── src/
│   ├── App.tsx                  # Landing page with 3D animation and auth
│   ├── Dashboard.tsx            # Multi-view dashboard with carousel & robot mascot
│   ├── Header.tsx               # Reusable header component
│   ├── AuthModal.tsx            # Authentication modal
│   ├── main.tsx                 # React 18 entry point with routing
│   ├── index.css                # Global styles with Tailwind
│   └── vite-env.d.ts           # Vite TypeScript definitions
├── public/
├── index.html                   # HTML entry point
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── vite.config.js              # Vite configuration
├── eslint.config.js            # ESLint configuration
└── README.md                   # This file
```

## 🎯 Usage

### Landing Page
- View the animated 3D box with bursting items
- Click "Get Started" to open signup modal
- Click "Sign In" to open signin modal
- Authenticate with Gmail or email/password

### Dashboard (After Authentication)

#### **Home**
- Welcome section with professional animated robot mascot
- Quick action buttons to navigate to features
- Stats showing your items count

#### **I Lost an Item**
- Upload item image
- Enter item name
- Specify company/brand
- Submit to report lost item
- Item appears in Dashboard and can be browsed in carousel

#### **I Found an Item**
- Upload item image
- Enter item name
- Specify company/brand
- Submit to report found item
- Item appears in "Items You Found" section
- Track return status (Returned/Not Returned)

#### **Heatmap** (Coming Soon)
- Location-based view of lost and found items
- Heat visualization of activity areas
- Real-time tracking of items in your area

#### **Dashboard**
- **Items You Lost**: Browse in carousel with indicators
- **Items You Found**: Browse with return status management
- Use carousel arrows or indicator dots to navigate
- Stats cards showing activity overview

## 🎨 UI/UX Features

### Color Scheme
- **Primary**: Blue (#3B82F6)
- **Secondary**: Indigo (#4F46E5)
- **Success**: Green (#10B981)
- **Warning**: Amber (#F59E0B)
- **Background**: Dark slate gradient (#0F172A to #1E293B)

### Components
- **Buttons**: Gradient backgrounds with hover effects
- **Cards**: Glassmorphic design with backdrop blur
- **Forms**: Smooth transitions and focus states
- **Modals**: Dark backgrounds with smooth animations
- **Carousels**: Smooth slide transitions with indicators

## 🔄 Application Flow

```
Landing Page (with 3D Box Animation)
    ↓
Authentication (Signup/Signin via Modal)
    ↓
Dashboard (Main App)
    ├─→ Home → View Robot Mascot & Quick Actions
    ├─→ I Lost an Item → Form → Submit → Dashboard View
    ├─→ I Found an Item → Form → Submit → Dashboard View
    ├─→ Heatmap → Location-based View (Coming Soon)
    └─→ Dashboard → View/Manage All Items → Track Status
```

## 🔧 Configuration

### Tailwind CSS
Custom configuration in `tailwind.config.js` for dark theme and custom animations.

### TypeScript
Strict mode enabled in `tsconfig.json` for better type safety.

### Vite
Optimized build configuration for fast development and production builds.

## 📱 Responsive Design

The application is fully responsive and works on:
- 📱 Mobile devices (320px and above)
- 📱 Tablets (768px and above)
- 💻 Desktops (1024px and above)

## 🔐 Authentication

Currently supports:
- Email/Password signup and signin
- Gmail OAuth integration
- Session persistence

**Note**: Backend authentication needs to be integrated with your auth provider (Firebase, Supabase, Auth0, etc.).

## 🚧 Future Enhancements

- [ ] Backend API integration for persistent storage
- [ ] Email notifications for item matches
- [ ] AI-powered item matching algorithm
- [ ] Item search and filtering with advanced filters
- [ ] User profiles and activity history
- [ ] Messaging between users for item coordination
- [ ] Item location mapping with geolocation
- [ ] Admin dashboard for moderation
- [ ] Mobile app (React Native)
- [ ] Real-time notifications with WebSockets
- [ ] Payment integration for verified/premium items
- [ ] Social sharing features
- [ ] Item recovery success rate analytics

## 🧪 Development

### ESLint
```bash
npm run lint
```

### Type Checking
```bash
npm run typecheck
```

### Code Quality
The project follows React and TypeScript best practices with:
- Strict TypeScript checking
- ESLint configuration
- React Hooks best practices
- Component composition patterns
- Proper prop typing

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**ReFind Development Team**
- GitHub: [@refind](https://github.com/yourusername)
- Email: support@refind.com

## 🙏 Acknowledgments

- React 18 for concurrent rendering
- Tailwind CSS for utility-first styling
- Lucide React for beautiful icons
- Three.js and React Three Fiber for 3D graphics
- Vite for blazing fast builds
- TypeScript for type safety
- Supabase for backend infrastructure

## 📞 Support

For support, email support@refind.com or open an issue on GitHub.

## 🐛 Bug Reports

Found a bug? Please create an issue with:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser/device information

## 🎓 Learning Resources

- [React 18 Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Router Documentation](https://reactrouter.com)
- [Three.js Documentation](https://threejs.org/docs)
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber/)

---

**Last Updated**: December 21, 2025

Made with ❤️ by ReFind Development Team

✨ **ReFind - Finding Lost Items, Bringing People Together**
