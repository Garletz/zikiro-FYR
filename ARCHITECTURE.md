# 🏗️ Zikiro Architecture

## 📋 Overview

Zikiro is a modern desktop application using **Tauri** (Rust + Web) with a modular, secure, and scalable architecture for point-of-sale management with AI integration.

## 🎯 Main Features

### 🤖 **Artificial Intelligence**
- **MenuGPT** : Automatic menu analysis with Google Gemini
- **MasterStocks** : Invoice analysis and inventory management
- **Centralized configuration** : Configurable API keys via interface

### 📱 **SMS & Communication**
- **SMS Gateway Android** : SMS sending via local Android device
- **Infobip** : Professional cloud SMS service
- **SIM 800/900** : Hardware SMS module

### 🛒 **Point of Sale**
- **Complete POS** : Order management, tables, payments
- **3D Planner** : Restaurant layout in 3D
- **Printing** : Automatic tickets and reports

### 🔒 **Security & Audit**
- **AuditGuard** : Modification monitoring
- **Detailed logs** : Complete traceability
- **Backup** : Data protection

## 📐 Technical Architecture

### **Frontend (React + TypeScript)**
```
src/
├── modules/           # Autonomous business modules
│   ├── menugpt/      # AI menu analysis
│   ├── masterstocks/ # Inventory management + AI
│   ├── smsticket/    # SMS communication
│   ├── pos/          # Point of sale
│   ├── planner/      # 3D planner
│   └── ...
├── shared/           # Shared resources
│   ├── components/   # Reusable components
│   ├── services/     # Common services
│   ├── types/        # TypeScript types
│   └── utils/        # Utilities
└── pages/            # Main pages
```

### **Backend (Rust + Tauri)**
```
src-tauri/src/
├── commands/         # Tauri commands
│   ├── ai_config.rs  # AI configuration
│   ├── menu.rs       # Menu analysis
│   ├── masterstocks.rs # Inventory management
│   ├── sms.rs        # SMS communication
│   └── ...
├── models.rs         # Data structures
├── database.rs       # SQLite management
└── providers/        # SMS providers
```

### **Database (SQLite)**
```
data/
├── business.db       # Business configuration
├── pos.db           # POS data
├── masterstock.db   # Inventory
├── sms.db           # SMS configuration
├── logs.db          # System logs
└── printerconfig.db # Printer configuration
```

## 🔧 Technologies Used

### **Frontend**
- **React 18** + **TypeScript** : User interface
- **Tailwind CSS** : Modern and responsive styling
- **React Query** : State management and caching
- **Zustand** : State management
- **Lucide React** : Icons

### **Backend**
- **Tauri** : Rust desktop framework
- **Rust** : High-performance and secure backend
- **SQLite** : Embedded database
- **Reqwest** : HTTP client for external APIs
- **Serde** : JSON serialization

### **AI & APIs**
- **Google Gemini 2.0 Flash** : Image analysis
- **SMS APIs** : Infobip, SMS Gateway Android
- **Dynamic configuration** : No hardcoded keys

## 🏛️ Modular Architecture

### **Separation Principle**
Each module is **autonomous** and contains :
- `components/` : Specific React components
- `services/` : Business logic and API calls
- `types/` : TypeScript types
- `hooks/` : Custom React hooks
- `utils/` : Specific utilities

### **Shared Resources**
The `shared/` folder contains :
- **UI Components** : Buttons, modals, layouts
- **Common services** : Configuration, logs, security
- **Global types** : Shared interfaces
- **Contexts** : Global state management

## 🔐 Security

### **Secure AI Configuration**
- ✅ **No hardcoded keys** in code
- ✅ **Configuration via user interface**
- ✅ **Local database storage**
- ✅ **Connection test** before saving

### **Data Management**
- ✅ **Local SQLite database**
- ✅ **Sensitive data encryption**
- ✅ **Complete audit trail**
- ✅ **Automatic backup**

## 🚀 Deployment

### **Desktop Build**
```bash
# Install dependencies
npm install

# Build application
npm run tauri build

# Development
npm run tauri dev
```

### **Requirements**
- **Node.js** 18+
- **Rust** 1.70+
- **Tauri CLI** : `npm install -g @tauri-apps/cli`

## 📊 Performance

### **Optimizations**
- **Lazy loading** of modules
- **React Query cache** for data
- **Asset compression**
- **Automatic tree shaking**

### **Monitoring**
- **Detailed logs** in real-time
- **Performance metrics**
- **Automatic alerts**

## 🔄 Scalability

### **Adding Modules**
1. Create folder in `src/modules/`
2. Implement modular structure
3. Add Tauri commands
4. Register in application

### **AI Extension**
- Multi-provider support (OpenAI, Anthropic, etc.)
- Per-module configuration
- Connectivity tests

---

## 📝 Development Notes

- **Modular architecture** : Facilitates maintenance
- **Strict TypeScript** : Code security
- **Integrated tests** : Assured quality
- **Documentation** : Self-documented code

**Version** : 0.1.0  
