import { BarChart3, Brain, ChefHat, CreditCard, FileText, Home, Layout, Package, Settings, Shield, Sparkles, Table, Tags } from 'lucide-react'
import { MODULES, useApp } from '../../contexts/AppContext'
import { useDoubleClick } from '../../hooks/useDoubleClick'
import { Tab } from '../../types/app'

const iconMap = {
  CreditCard,
  Table,
  Package,
  Tags,
  BarChart3,
  Settings,
  Layout,
  FileText,
  Shield,
  Brain,
  ChefHat
}

const colorClasses = {
  primary: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-orange-600',
  danger: 'bg-red-600',
  info: 'bg-cyan-600',
  secondary: 'bg-slate-600',
  purple: 'bg-purple-600'
}

const colorShadows = {
  primary: 'rgba(37, 99, 235, 0.7)',
  success: 'rgba(22, 163, 74, 0.7)',
  warning: 'rgba(234, 88, 12, 0.7)',
  danger: 'rgba(220, 38, 38, 0.7)',
  info: 'rgba(8, 145, 178, 0.7)',
  secondary: 'rgba(71, 85, 105, 0.7)',
  purple: 'rgba(147, 51, 234, 0.7)'
}

// Separate component for each module button
function ModuleButton({ tab }: { tab: Tab }) {
  const { openModule, tabs, switchTab } = useApp()
  const module = MODULES.find(m => m.id === tab.moduleId)

  if (!module) return null

  const IconComponent = iconMap[module.icon as keyof typeof iconMap] || FileText
  const isActive = tab.isActive

  // Function to handle intelligent navigation
  const handleModuleNavigation = (moduleId: string) => {
    const existingTab = tabs.find(t => t.moduleId === moduleId)

    if (existingTab) {
      // If the tab exists, activate it
      switchTab(existingTab.id)
    } else {
      // If the tab doesn't exist, create a new one
      openModule(moduleId)
    }
  }

  // Function to duplicate a module (create a new tab)
  const handleDuplicateModule = (moduleId: string) => {
    // Always create a new tab
    openModule(moduleId)
  }

  // Hook to handle double-click (only for bottom buttons)
  const handleClick = useDoubleClick({
    onSingleClick: () => handleModuleNavigation(module.id),
    onDoubleClick: () => handleDuplicateModule(module.id),
    delay: 300
  })

  const bgColor = colorClasses[module.color as keyof typeof colorClasses] || 'bg-blue-600'
  const shadowColor = colorShadows[module.color as keyof typeof colorShadows] || 'rgba(37, 99, 235, 0.7)'
  const uniqueId = `bottom-module-${module.id}`

  return (
    <div className="inline-block cursor-pointer">
      <button
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px',
          position: 'relative',
          transform: 'rotate(45deg)',
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease-in-out',
          width: '45px',
          height: '45px',
          borderRadius: '8px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'rotate(45deg) scale(1.1)'
          e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'rotate(45deg) scale(1)'
          e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)'
        }}
        className={`${uniqueId} ${bgColor} ${isActive ? 'ring-2 ring-white/50' : ''}`}
        title={`${tab.title}${isActive ? ' (Double-clic pour dupliquer)' : ''}`}
      >
        <div style={{ transform: 'rotate(-45deg)' }}>
          <IconComponent size={18} className="text-white" />
        </div>

        {/* Indicateur d'erreur */}
        {tab.error && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
        )}
      </button>

      <style>{`
        .${uniqueId}::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          left: 0;
          top: 0;
          background: ${shadowColor};
          transform: rotate(45deg) scale(1.05);
          z-index: -1;
          opacity: 0.3;
          border-radius: 8px;
        }
      `}</style>
    </div>
  )
}

export default function BottomNav() {
  const { tabs, goToDashboard, isDashboard } = useApp()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      {/* Clean navbar container */}
      <div className="max-w-5xl mx-auto">
        <div
          className="p-4 pointer-events-auto"
          style={{
            position: 'relative',
            minWidth: '600px',
            minHeight: '80px'
          }}
        >
          <div
            className="flex items-center space-x-6 overflow-x-auto scrollbar-hide px-4 py-2"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {/* Bouton Home avec style de losange comme le dashboard */}
            <div className="inline-block cursor-pointer">
              <button
                onClick={goToDashboard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  position: 'relative',
                  transform: 'rotate(45deg)',
                  boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s ease-in-out',
                  width: '45px',
                  height: '45px',
                  borderRadius: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'rotate(45deg) scale(1.1)'
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'rotate(45deg) scale(1)'
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)'
                }}
                className={`bottom-home ${isDashboard ? 'bg-blue-600' : 'bg-gray-600'}`}
                title="Accueil"
              >
                <div style={{ transform: 'rotate(-45deg)' }}>
                  <Home size={18} className="text-white" />
                </div>

                {/* Special sparkle effect for dashboard */}
                {isDashboard && (
                  <div className="absolute -top-1 -right-1">
                    <Sparkles size={8} className="text-yellow-400 animate-pulse" />
                  </div>
                )}
              </button>

              <style>{`
                .bottom-home::before {
                  content: "";
                  position: absolute;
                  width: 100%;
                  height: 100%;
                  left: 0;
                  top: 0;
                  background: ${isDashboard ? 'rgba(37, 99, 235, 0.3)' : 'rgba(75, 85, 99, 0.3)'};
                  transform: rotate(45deg) scale(1.05);
                  z-index: -1;
                  opacity: 0.3;
                  border-radius: 8px;
                }
              `}</style>
            </div>

            {/* Modules ouverts */}
            {tabs.map((tab) => (
              <ModuleButton key={tab.id} tab={tab} />
            ))}
          </div>
        </div>
      </div>

      {/* Styles pour masquer la scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

