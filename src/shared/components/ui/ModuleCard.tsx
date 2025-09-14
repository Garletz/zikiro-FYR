import {
  BarChart3,
  Brain,
  ChefHat,
  CreditCard,
  FileText,
  Layout,
  MessageSquare,
  Package,
  Settings,
  Shield,
  Table,
  Tags,
  Warehouse
} from 'lucide-react'
import { Module } from '../../types/app'

interface ModuleCardProps {
  module: Module
  onClick: () => void
}

const iconMap = {
  CreditCard,
  Table,
  ChefHat,
  Package,
  Tags,
  BarChart3,
  Settings,
  Shield,
  Layout,
  FileText,
  Brain,
  Warehouse,
  MessageSquare,
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

export default function ModuleCard({ module, onClick }: ModuleCardProps) {
  const IconComponent = iconMap[module.icon as keyof typeof iconMap]
  const bgColor = colorClasses[module.color as keyof typeof colorClasses] || 'bg-blue-600'
  const shadowColor = colorShadows[module.color as keyof typeof colorShadows] || 'rgba(37, 99, 235, 0.7)'
  const uniqueId = `module-${module.id}`

  // Use module names if available, otherwise fallback to title
  const moduleNames = module.names || {
    french: module.title,
    english: module.title,
    spanish: module.title,
    chinese: module.title,
    hindi: module.title
  }

  return (
    <div className="inline-block m-8 cursor-pointer relative">
      {/* Module names positioned on 4 sides */}

      {/* Hindi text on the left */}
      <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 text-white font-semibold text-sm writing-vertical-rl no-wrap-text">
        {moduleNames.hindi}
      </div>

      {/* Chinese text on the right */}
      <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 text-white font-semibold text-sm writing-vertical-rl no-wrap-text">
        {moduleNames.chinese}
      </div>

      {/* English text on top */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white font-semibold text-sm no-wrap-text">
        {moduleNames.english}
      </div>

      {/* French text on bottom */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white font-semibold text-sm no-wrap-text">
        {moduleNames.french}
      </div>

      <button
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          position: 'relative',
          transform: 'rotate(45deg)',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease-in-out',
          width: '80px',
          height: '80px',
          borderRadius: '12px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'rotate(45deg) scale(1.1)'
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'rotate(45deg) scale(1)'
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)'
        }}
        className={`${uniqueId} ${bgColor}`}
      >
        <div style={{ transform: 'rotate(-45deg)' }}>
          <IconComponent
            size={30}
            className="text-white"
            style={{ fontSize: '30pt' }}
          />
        </div>
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
          border-radius: 12px;
        }
        
        .writing-vertical-rl {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
        
        .no-wrap-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }
      `}</style>
    </div>
  )
}

