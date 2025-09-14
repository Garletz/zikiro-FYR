
import { ChevronLeft, ChevronRight, CreditCard } from 'lucide-react'
import { useState } from 'react'
import ModuleCard from '../shared/components/ui/ModuleCard'
import { MODULES, useApp } from '../shared/contexts/AppContext'

export default function Dashboard() {
  const { openModule } = useApp()
  const [currentPage, setCurrentPage] = useState(0)

  // Separate main modules from others
  const mainModules = MODULES.filter(module => module.isMain)
  const otherModules = MODULES.filter(module => !module.isMain)

  // Organize modules into pages (10 modules per page)
  const modulesPerPage = 10
  const totalPages = Math.ceil(otherModules.length / modulesPerPage)

  const getCurrentPageModules = () => {
    const startIndex = currentPage * modulesPerPage
    const endIndex = startIndex + modulesPerPage
    return otherModules.slice(startIndex, endIndex)
  }

  // Show POS module only on first page
  const shouldShowPOS = currentPage === 0

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="min-h-screen bg-[#1B2537] relative overflow-hidden">
      {/* Main content */}
      <div className="relative z-10 p-8">
        {/* Header with modern style */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-white">
            Zikiro
          </h1>
        </div>

        {/* Navigation arrows - Fixed position */}
        {totalPages > 1 && (
          <>
            {/* Left arrow */}
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className={`fixed left-4 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full transition-all duration-300 ${currentPage === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-110'
                }`}
            >
              <ChevronLeft size={24} />
            </button>

            {/* Right arrow */}
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
              className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full transition-all duration-300 ${currentPage === totalPages - 1
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-110'
                }`}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Page indicator */}
        {totalPages > 1 && (
          <div className="absolute top-4 right-4 z-20 bg-black bg-opacity-50 px-3 py-1 rounded-full">
            <span className="text-white text-sm">
              {currentPage + 1} / {totalPages}
            </span>
          </div>
        )}

        {/* Main grid with 3D style */}
        <div className="w-[900px] mx-auto mt-[50px]">
          <div className="grid grid-cols-4 gap-8 items-center justify-items-center">
            {/* First row */}
            <div>
              {getCurrentPageModules().find(m => m.id === 'tables') && (
                <ModuleCard
                  module={getCurrentPageModules().find(m => m.id === 'tables')!}
                  onClick={() => openModule('tables')}
                />
              )}
            </div>

            {/* Main POS module - 2x larger - Only show on first page */}
            <div className="col-span-2">
              {shouldShowPOS && mainModules.find(m => m.id === 'pos') && (
                <div className="inline-block m-8 cursor-pointer relative">
                  <button
                    onClick={() => openModule('pos')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgb(37, 99, 235)', // bg-blue-600
                      padding: '40px',
                      position: 'relative',
                      transform: 'rotate(45deg)',
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.3s ease-in-out',
                      width: '160px',
                      height: '160px',
                      borderRadius: '20px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'rotate(45deg) scale(1.1)'
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'rotate(45deg) scale(1)'
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)'
                    }}
                    className="pos-button"
                  >
                    <div style={{ transform: 'rotate(-45deg)' }}>
                      <CreditCard size={50} className="text-white" style={{ fontSize: '50pt' }} />
                    </div>
                  </button>

                  {/* Module names positioned on 4 sides for POS */}

                  {/* Hindi text on the left */}
                  <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 text-white font-semibold text-base writing-vertical-rl no-wrap-text">
                    बिक्री बिंदु
                  </div>

                  {/* Chinese text on the right */}
                  <div className="absolute -right-16 top-1/2 transform -translate-y-1/2 text-white font-semibold text-base writing-vertical-rl no-wrap-text">
                    销售点
                  </div>

                  {/* English text on top */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-white font-semibold text-base no-wrap-text">
                    POS
                  </div>

                  {/* French text on bottom */}
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-white font-semibold text-base no-wrap-text">
                    Point de Vente
                  </div>

                  <style>{`
                    .pos-button::before {
                      content: "";
                      position: absolute;
                      width: 100%;
                      height: 100%;
                      left: 0;
                      top: 0;
                      background: rgba(37, 99, 235, 0.3);
                      transform: rotate(45deg) scale(1.05);
                      z-index: -1;
                      opacity: 0.3;
                      border-radius: 20px;
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
              )}
            </div>

            <div>
              {getCurrentPageModules().find(m => m.id === 'products') && (
                <ModuleCard
                  module={getCurrentPageModules().find(m => m.id === 'products')!}
                  onClick={() => openModule('products')}
                />
              )}
            </div>

            {/* Second row */}
            <div>
              {getCurrentPageModules().find(m => m.id === 'categories') && (
                <ModuleCard
                  module={getCurrentPageModules().find(m => m.id === 'categories')!}
                  onClick={() => openModule('categories')}
                />
              )}
            </div>

            <div>
              {getCurrentPageModules().find(m => m.id === 'orders') && (
                <ModuleCard
                  module={getCurrentPageModules().find(m => m.id === 'orders')!}
                  onClick={() => openModule('orders')}
                />
              )}
            </div>

            <div>
              {getCurrentPageModules().find(m => m.id === 'planner') && (
                <ModuleCard
                  module={getCurrentPageModules().find(m => m.id === 'planner')!}
                  onClick={() => openModule('planner')}
                />
              )}
            </div>

            <div>
              {getCurrentPageModules().find(m => m.id === 'reports') && (
                <ModuleCard
                  module={getCurrentPageModules().find(m => m.id === 'reports')!}
                  onClick={() => openModule('reports')}
                />
              )}
            </div>

            {/* Third row */}
            <div>
              {getCurrentPageModules().find(m => m.id === 'menugpt') && (
                <ModuleCard
                  module={getCurrentPageModules().find(m => m.id === 'menugpt')!}
                  onClick={() => openModule('menugpt')}
                />
              )}
            </div>

            <div>
              {getCurrentPageModules().find(m => m.id === 'auditguard') && (
                <ModuleCard
                  module={getCurrentPageModules().find(m => m.id === 'auditguard')!}
                  onClick={() => openModule('auditguard')}
                />
              )}
            </div>

            <div>
              {getCurrentPageModules().find(m => m.id === 'logs') && (
                <ModuleCard
                  module={getCurrentPageModules().find(m => m.id === 'logs')!}
                  onClick={() => openModule('logs')}
                />
              )}
            </div>

            <div>
              {getCurrentPageModules().find(m => m.id === 'settings') && (
                <ModuleCard
                  module={getCurrentPageModules().find(m => m.id === 'settings')!}
                  onClick={() => openModule('settings')}
                />
              )}
            </div>

            {/* Fourth row - New modules positioned higher */}
            <div className="relative -mt-16">
              {getCurrentPageModules().find(m => m.id === 'masterstocks') && (
                <ModuleCard
                  module={getCurrentPageModules().find(m => m.id === 'masterstocks')!}
                  onClick={() => openModule('masterstocks')}
                />
              )}
            </div>

            <div className="relative -mt-16">
              {getCurrentPageModules().find(m => m.id === 'smsticket') && (
                <ModuleCard
                  module={getCurrentPageModules().find(m => m.id === 'smsticket')!}
                  onClick={() => openModule('smsticket')}
                />
              )}
            </div>

            {/* Empty spaces for remaining modules */}
            <div></div>
            <div></div>
          </div>
        </div>

        {/* Footer with modern style */}
        <div className="mt-16 text-center text-gray-400">
          <p className="text-lg">
            Welcome to Zikiro v0.1.0 - The Intelligent Point of Sale System
          </p>
          <p className="text-sm mt-2">
            Select a module to get started
          </p>
        </div>
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

