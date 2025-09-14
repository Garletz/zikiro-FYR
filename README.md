# Zikiro

> **Intelligent Point of Sale Application with AI**  
> Complete restaurant management system with automatic menu analysis and SMS communication

[![Tauri](https://img.shields.io/badge/Tauri-1.0-blue.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-1.70-orange.svg)](https://www.rust-lang.org/)

## Main Features

### Artificial Intelligence
- **MenuGPT** : Automatic menu analysis with Google Gemini
- **MasterStocks** : Invoice analysis and inventory management
- **Centralized configuration** : Configurable API keys via interface

### SMS Communication
- **SMS Gateway Android** : SMS sending via local Android device
- **Infobip** : Professional cloud SMS service
- **SIM 800/900** : Hardware SMS module

### Complete Point of Sale
- **POS** : Order management, tables, payments
- **3D Planner** : Restaurant layout in 3D
- **Printing** : Automatic tickets and reports

### Security & Audit
- **AuditGuard** : Modification monitoring
- **Detailed logs** : Complete traceability
- **Backup** : Data protection

## Quick Installation

### Prerequisites
- **Node.js** 18+ 
- **Rust** 1.70+
- **Git**

### Installation
```bash
# Clone the project
git clone https://github.com/Garletz/zikiro-FYR.git
cd zikiro

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Production Build
```bash
# Build application
npm run tauri build
```

## Configuration

### 1. AI Configuration (Google Gemini)
1. Go to **MenuGPT** → **AI Settings**
2. Click **Copy** to copy the URL : `https://aistudio.google.com/apikey`
3. Create an API key on Google AI Studio
4. Paste the key and test the connection

### 2. SMS Configuration
1. Go to **SMS Ticket** → **Connect Settings**
2. Choose your provider :
   - **SMS Gateway Android** : Download app from `https://sms-gate.app/`
   - **Infobip** : Create account on Infobip
   - **SIM 800/900** : Connect hardware module

### 3. POS Configuration
1. Go to **Settings** → **Business Settings**
2. Configure your restaurant information
3. Set up taxes and payments

## Architecture

### Technologies
- **Frontend** : React 18 + TypeScript + Tailwind CSS
- **Backend** : Tauri (Rust) + SQLite
- **AI** : Google Gemini 2.0 Flash
- **SMS** : Multi-providers (Android, Infobip, SIM)

### Modular Structure
```
src/
├── modules/           # Autonomous business modules
│   ├── menugpt/      # AI menu analysis
│   ├── masterstocks/ # Inventory management + AI
│   ├── smsticket/    # SMS communication
│   ├── pos/          # Point of sale
│   └── planner/      # 3D planner
├── shared/           # Shared resources
└── pages/            # Main pages
```

## User Guide

### MenuGPT - Menu Analysis
1. Take a photo of your menu
2. AI automatically extracts dishes and prices
3. Import directly into your POS

### MasterStocks - Inventory Management
1. Scan a supplier invoice
2. AI extracts products and quantities
3. Automatic inventory update

### SMS Ticket - Communication
1. Configure your SMS provider
2. Send tickets via SMS to customers
3. Manage automatic notifications

### POS - Point of Sale
1. Create orders
2. Manage tables
3. Process payments
4. Print tickets

## Development

### Available Scripts
```bash
npm run tauri dev      # Development
npm run tauri build    # Production build
npm run lint          # Linter
npm run type-check    # TypeScript verification
```

### Module Structure
Each module contains :
- `components/` : React components
- `services/` : Business logic
- `types/` : TypeScript types
- `hooks/` : Custom hooks

## Security

- **No hardcoded API keys**
- **Interface configuration**
- **Local database**
- **Complete audit trail**
- **Automatic backup**

## Database

The application uses SQLite with multiple databases :
- `business.db` : Business configuration
- `pos.db` : POS data
- `masterstock.db` : Inventory
- `sms.db` : SMS configuration
- `logs.db` : System logs

## Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Changelog

### v0.1.0 - January 2026 (Planned)
- Centralized and secure AI configuration fully local
- Multi-provider SMS support native
- Mobile/tablet optimized interface and start the apk 
- Complete modular architecture
- Code cleanup and documentation
- Not only for restaurant

### v0.00 - September 2025 (Development)
- Initial development version
- Complete POS
- AI menu analysis
- SMS communication

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

## Support

- **Documentation** : See `ARCHITECTURE.md`
- **Issues** : [GitHub Issues](https://github.com/Garletz/zikiro-FYR/issues)
- **Discussions** : [GitHub Discussions](https://github.com/Garletz/zikiro-FYR/discussions)

---

**Developed for modern restaurateurs**

**Version** : 0.1.0  
**Release Date** : January 2026  
**Status** : In Development