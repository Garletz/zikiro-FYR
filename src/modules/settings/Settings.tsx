import { useMutation } from '@tanstack/react-query'
import { Building, Calculator, CheckCircle, CreditCard, Database, Flag, Globe, Play, Printer, Terminal } from 'lucide-react'
import { useEffect, useState } from 'react'
import SmartPrinterTest from '../../shared/components/ui/SmartPrinterTest'
import { useUserSettings } from '../../shared/contexts/UserSettingsContext'
import { useTaxSettings } from '../../shared/hooks/useTaxSettings'
import { BusinessService } from '../../shared/services/businessService'
import { PrintingService } from '../../shared/services/printingService'
import { PrinterInfo, TerminalOutput } from '../../shared/types/printing'
import { CountryCode, DEFAULT_COUNTRY_CONFIGS } from '../../shared/types/tax'
import { BackupManager } from './components/BackupManager'
import { BusinessForm } from './components/BusinessForm'



interface PrintSettings {
  printer_name: string
  paper_size: string
  show_logo: boolean
  show_tax_details: boolean
  footer_text: string
}



const printSchema = {
  printer_name: '',
  paper_size: 'A4',
  show_logo: true,
  show_tax_details: true,
  footer_text: 'Thank you for your visit!',
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('business')
  const [printSettings, setPrintSettings] = useState<PrintSettings>(printSchema)
  const { settings, setLeftHandedMode } = useUserSettings()

  // Terminal and Printer Management States
  const [terminalCommand, setTerminalCommand] = useState('Get-Printer | ConvertTo-Json')
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput | null>(null)
  const [isExecutingCommand, setIsExecutingCommand] = useState(false)
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')
  const [savedPrinter, setSavedPrinter] = useState<any>(null)
  const [detectedPrinters, setDetectedPrinters] = useState<PrinterInfo[]>([])

  // Dedicated printer terminal states
  const [printerTerminalCommand, setPrinterTerminalCommand] = useState('')
  const [printerTerminalOutput, setPrinterTerminalOutput] = useState<TerminalOutput | null>(null)
  const [isExecutingPrinterCommand, setIsExecutingPrinterCommand] = useState(false)

  // New tax management system
  const {
    selectedCountry,
    currentConfig,
    taxSettings,
    setSelectedCountry,
    updateTaxSettings,
    resetToDefaults,
  } = useTaxSettings()

  // queryClient removed as it's not used



  // Terminal Command Execution
  const executeTerminalCommandMutation = useMutation({
    mutationFn: PrintingService.executeTerminalCommand,
    onSuccess: (output: TerminalOutput) => {
      setTerminalOutput(output)
      // Auto-detect printers if the command is likely to return printer info
      if (output.stdout.toLowerCase().includes('printer') || output.stdout.toLowerCase().includes('get-printer')) {
        parsePrintersFromOutput(output)
      }
    },
    onError: (error: any) => {
      setTerminalOutput({
        success: false,
        stdout: '',
        stderr: error.toString(),
        exit_code: 1
      })
    }
  })

  // Save Printer to Database
  const savePrinterMutation = useMutation({
    mutationFn: PrintingService.savePrinterToDatabase,
    onSuccess: (message) => {
      console.log('Printer saved successfully:', message)
      loadSavedPrinter()
      // Keep terminal output visible, just clear selection
      setSelectedPrinter('')
    },
    onError: (error) => {
      console.error('Failed to save printer:', error)
      alert(`Erreur lors de la sauvegarde: ${error}`)
    }
  })

  // Load saved printer configuration
  const loadSavedPrinter = async () => {
    try {
      console.log('Loading saved printer config...')
      const config = await PrintingService.getSavedPrinterConfig()
      console.log('Loaded config:', config)
      setSavedPrinter(config)
    } catch (error) {
      console.error('Failed to load saved printer:', error)
    }
  }

  // Parse printer names from terminal output
  const parsePrintersFromOutput = (output: TerminalOutput) => {
    try {
      if (output.stdout) {
        // Try to parse JSON output first (PowerShell Get-Printer)
        if (output.stdout.trim().startsWith('[') || output.stdout.trim().startsWith('{')) {
          const printers = JSON.parse(output.stdout)
          if (Array.isArray(printers)) {
            // Extract printer names from PowerShell objects
            const extractedPrinters = printers.map((printer: any) => ({
              name: printer.Name || printer.name || 'Unknown Printer',
              port: printer.PortName || printer.port || '',
              is_default: printer.IsDefault || printer.is_default || false,
              status: printer.PrinterStatus || printer.status || 'Unknown'
            }))
            setDetectedPrinters(extractedPrinters)
            return
          }
        }

        // Fallback: parse text output line by line (for non-JSON output)
        const lines = output.stdout.split('\n').filter(line => line.trim())
        const printerNames = lines.map(line => line.trim()).filter(name => name.length > 0)
        setDetectedPrinters(printerNames.map(name => ({
          name,
          port: '',
          is_default: false,
          status: 'Unknown'
        })))
      }
    } catch (error) {
      console.error('Failed to parse printers from output:', error)
      // If JSON parsing fails, try to extract printer names from text
      if (output.stdout) {
        const lines = output.stdout.split('\n')
        const printerNames = lines
          .filter(line => line.includes('Name:') || line.includes('Printer:'))
          .map(line => {
            const match = line.match(/(?:Name|Printer):\s*(.+)/)
            return match ? match[1].trim() : null
          })
          .filter(Boolean)

        if (printerNames.length > 0) {
          setDetectedPrinters(printerNames.map(name => ({
            name: name!,
            port: '',
            is_default: false,
            status: 'Unknown'
          })))
        }
      }
    }
  }

  // Execute terminal command
  const handleExecuteCommand = async () => {
    if (!terminalCommand.trim()) return

    setIsExecutingCommand(true)
    try {
      await executeTerminalCommandMutation.mutateAsync(terminalCommand)
    } finally {
      setIsExecutingCommand(false)
    }
  }

  // Execute printer terminal command
  const handleExecutePrinterCommand = async () => {
    if (!printerTerminalCommand.trim()) return

    setIsExecutingPrinterCommand(true)
    try {
      const result = await PrintingService.executeTerminalCommand(printerTerminalCommand)
      setPrinterTerminalOutput(result)
    } catch (error: any) {
      setPrinterTerminalOutput({
        success: false,
        stdout: '',
        stderr: error.toString(),
        exit_code: 1
      })
    } finally {
      setIsExecutingPrinterCommand(false)
    }
  }

  // Quick command buttons
  const quickCommands = [
    { label: 'List Printers', command: 'Get-Printer | ConvertTo-Json', description: 'List all available printers' },
    { label: 'Default Printer', command: 'Get-Printer | Where-Object {$_.IsDefault -eq $true} | ConvertTo-Json', description: 'Get default printer' },
    { label: 'Spooler Status', command: 'Get-Service -Name Spooler | Select-Object Name, Status, StartType | ConvertTo-Json', description: 'Check print spooler status' },
    { label: 'Printer Ports', command: 'Get-PrinterPort | ConvertTo-Json', description: 'List printer ports' },
  ]

  // Save selected printer
  const handleSavePrinter = () => {
    if (!selectedPrinter) return

    const printer = detectedPrinters.find(p => p.name === selectedPrinter)
    if (printer) {
      console.log('Saving printer:', printer)
      savePrinterMutation.mutate(printer.name)
    }
  }

  // Remove saved printer
  const handleRemovePrinter = async () => {
    try {
      const result = await PrintingService.removePrinterFromDatabase()
      console.log('Printer removed:', result)
      setSavedPrinter(null)
      // Clear terminal output and selection
      setTerminalOutput(null)
      setSelectedPrinter('')
    } catch (error) {
      console.error('Failed to remove printer:', error)
      alert(`Erreur lors de la suppression: ${error}`)
    }
  }

  // Load saved printer and business settings on component mount
  useEffect(() => {
    loadSavedPrinter()
    loadBusinessSettings()
  }, [])

  // Load business settings from database
  const loadBusinessSettings = async () => {
    try {
      console.log('Loading business settings...')

      const [businessInfo, taxSettings] = await Promise.all([
        BusinessService.getBusinessInfo().catch(err => {
          console.warn('Failed to load business info, using defaults:', err)
          return {
            business_name: '',
            business_address: '',
            business_phone: '',
            business_email: '',
            business_website: '',
            business_logo: '',
            business_description: '',
          }
        }),
        BusinessService.getTaxSettings().catch(err => {
          console.warn('Failed to load tax settings, using defaults:', err)
          return {
            selected_country: 'FR',
            auto_calculate: true,
            show_tax_details: true,
            round_tax: true,
            tax_inclusive: false,
          }
        })
      ])

      console.log('Loaded business info:', businessInfo)
      console.log('Loaded tax settings:', taxSettings)

      // Update business settings state

      // Update tax settings if needed
      if (taxSettings.selected_country) {
        setSelectedCountry(taxSettings.selected_country as CountryCode)
        updateTaxSettings({
          auto_calculate: taxSettings.auto_calculate,
          show_tax_details: taxSettings.show_tax_details,
          round_tax: taxSettings.round_tax,
        })
      }
    } catch (error) {
      console.error('Error loading business settings:', error)
      // Keep default values if loading fails
    } finally {
    }
  }

  const tabs = [
    { id: 'business', name: 'Business', icon: Building },
    { id: 'tax', name: 'Taxes', icon: Calculator },
    { id: 'print', name: 'Print', icon: Printer },
    { id: 'payment', name: 'Payments', icon: CreditCard },
    { id: 'system', name: 'System', icon: Globe },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'business' && (
          <BusinessForm onSave={() => {
            // Refresh data after save
            loadBusinessSettings();
          }} />
        )}

        {activeTab === 'tax' && (
          <div className="space-y-6">
            {/* Country Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Configuration</h3>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country / Region
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(DEFAULT_COUNTRY_CONFIGS).map(([code, config]) => (
                    <button
                      key={code}
                      onClick={() => setSelectedCountry(code as CountryCode)}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${selectedCountry === code
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Flag className="w-4 h-4" />
                        <span className="font-medium text-sm">{config.country_name}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {config.tax_name} • {config.default_tax_rate}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {config.tax_mode === 'fixed' ? 'Fixed Rate' : 'By Category'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Configuration */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Current Configuration: {currentConfig.country_name}</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Name
                    </label>
                    <input
                      type="text"
                      value={currentConfig.tax_name}
                      className="input w-full bg-white"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calculation Mode
                    </label>
                    <input
                      type="text"
                      value={currentConfig.tax_mode === 'fixed' ? 'Fixed Rate' : 'By Category'}
                      className="input w-full bg-white"
                      readOnly
                    />
                  </div>
                </div>

                {/* Available Tax Rates */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Tax Rates
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {currentConfig.tax_rates.map((rate) => (
                      <div
                        key={rate.id}
                        className={`p-3 rounded-lg border ${rate.is_default
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-gray-200 bg-white'
                          }`}
                      >
                        <div className="font-medium text-sm">{rate.name}</div>
                        <div className="text-lg font-bold text-primary-600">{rate.rate}%</div>
                        {rate.is_default && (
                          <div className="text-xs text-primary-600 font-medium">Default</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tax Categories (if applicable) */}
                {currentConfig.tax_categories && currentConfig.tax_categories.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Categories
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentConfig.tax_categories.map((category) => {
                        const taxRate = currentConfig.tax_rates.find(r => r.id === category.tax_rate_id)
                        return (
                          <div
                            key={category.id}
                            className="p-3 rounded-lg border border-gray-200 bg-white"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color || '#6B7280' }}
                              />
                              <span className="font-medium text-sm">{category.name}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {taxRate?.name} ({taxRate?.rate}%)
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Advanced Options</h4>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="auto_calculate"
                      checked={taxSettings.auto_calculate}
                      onChange={(e) => updateTaxSettings({ auto_calculate: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="auto_calculate" className="ml-2 text-sm text-gray-700">
                      Auto-calculate tax
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="show_tax_details"
                      checked={taxSettings.show_tax_details}
                      onChange={(e) => updateTaxSettings({ show_tax_details: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="show_tax_details" className="ml-2 text-sm text-gray-700">
                      Show tax details on receipts
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="round_tax"
                      checked={taxSettings.round_tax}
                      onChange={(e) => updateTaxSettings({ round_tax: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="round_tax" className="ml-2 text-sm text-gray-700">
                      Round tax amounts
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={resetToDefaults}
                    className="btn btn-secondary"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'print' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Print Configuration</h3>

              {/* Terminal Commands Section */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Terminal Commands
                </h4>

                {/* Quick Command Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {quickCommands.map((cmd) => (
                    <button
                      key={cmd.label}
                      onClick={() => {
                        setTerminalCommand(cmd.command)
                        handleExecuteCommand()
                      }}
                      className="p-3 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-white transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900">{cmd.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{cmd.description}</div>
                    </button>
                  ))}
                </div>

                {/* Custom Command Input */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Terminal Command
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={terminalCommand}
                      onChange={(e) => setTerminalCommand(e.target.value)}
                      placeholder="Enter PowerShell command..."
                      className="input flex-1"
                    />
                    <button
                      onClick={handleExecuteCommand}
                      disabled={isExecutingCommand || !terminalCommand.trim()}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      {isExecutingCommand ? 'Executing...' : 'Execute'}
                    </button>
                  </div>
                </div>

                {/* Terminal Output Display */}
                {terminalOutput && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Command Output:</span>
                      <button
                        onClick={() => setTerminalOutput(null)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs overflow-x-auto max-h-64">
                      <div className="mb-2">
                        <span className="text-gray-400">$ </span>
                        <span>{terminalCommand}</span>
                      </div>
                      {terminalOutput.stdout && (
                        <div className="text-green-400 whitespace-pre-wrap text-xs">{terminalOutput.stdout}</div>
                      )}
                      {terminalOutput.stderr && (
                        <div className="text-red-400 whitespace-pre-wrap text-xs">{terminalOutput.stderr}</div>
                      )}
                      <div className="text-gray-400 mt-2 text-xs">
                        Exit code: {terminalOutput.exit_code}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Smart Printer Selection */}
              {detectedPrinters.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-medium text-blue-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Smart Printer Selection
                  </h4>

                  <div className="space-y-3">
                    <p className="text-sm text-blue-700">
                      {detectedPrinters.length} printer(s) detected from terminal output:
                    </p>

                    <div className="space-y-2">
                      {detectedPrinters.map((printer) => (
                        <label key={printer.name} className="flex items-center gap-3 p-3 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer bg-white">
                          <input
                            type="radio"
                            name="printer"
                            value={printer.name}
                            checked={selectedPrinter === printer.name}
                            onChange={(e) => setSelectedPrinter(e.target.value)}
                            className="w-4 h-4 text-blue-600 bg-white border-2 border-blue-300 focus:ring-blue-500 focus:ring-2"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-blue-900">{printer.name}</div>
                            <div className="flex gap-4 text-xs text-blue-600">
                              {printer.port && <span>Port: {printer.port}</span>}
                              <span>Status: {printer.status}</span>
                              {printer.is_default && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {selectedPrinter && (
                      <button
                        onClick={handleSavePrinter}
                        disabled={savePrinterMutation.isPending}
                        className="btn btn-primary flex items-center gap-2"
                      >
                        <Database className="w-4 h-4" />
                        {savePrinterMutation.isPending ? 'Saving...' : 'Save as POS Printer'}
                      </button>
                    )}
                  </div>
                </div>
              )}



              {/* Current POS Printer Status */}
              {savedPrinter && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-medium text-blue-900 mb-4 flex items-center gap-2">
                    <Printer className="w-5 h-5" />
                    Imprimante POS par défaut
                  </h4>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-blue-900">{savedPrinter.name}</div>
                      <div className="text-sm text-blue-700">
                        Port: {savedPrinter.port || 'N/A'} |
                        Statut: {savedPrinter.status || 'Unknown'} |
                        Type: {savedPrinter.driver || 'N/A'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRemovePrinter}
                        className="btn btn-danger text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>



                  {/* Dedicated Printer Terminal */}
                  <div className="border-t border-blue-200 pt-4">
                    <h5 className="text-md font-medium text-blue-800 mb-3">Terminal Imprimante {savedPrinter.name}</h5>

                    {/* Quick Command Buttons */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <button
                        onClick={() => {
                          const command = `Get-Printer -Name "${savedPrinter.name}" | Select-Object Name, PrinterStatus, PortName | ConvertTo-Json`
                          setPrinterTerminalCommand(command)
                        }}
                        className="btn btn-secondary text-xs"
                      >
                        Check Status
                      </button>
                      <button
                        onClick={() => {
                          const command = `Get-PrinterPort | ConvertTo-Json`
                          setPrinterTerminalCommand(command)
                        }}
                        className="btn btn-secondary text-xs"
                      >
                        List Ports
                      </button>
                      <button
                        onClick={() => {
                          const command = `Get-Service Spooler | ConvertTo-Json`
                          setPrinterTerminalCommand(command)
                        }}
                        className="btn btn-secondary text-xs"
                      >
                        Spooler Status
                      </button>
                      <button
                        onClick={() => {
                          const command = `Get-PrintJob | Select-Object DocumentName, JobStatus, SubmittedTime, PrinterName | ConvertTo-Json`
                          setPrinterTerminalCommand(command)
                        }}
                        className="btn btn-secondary text-xs"
                      >
                        Print Queue
                      </button>
                      <button
                        onClick={() => {
                          const command = `"TEST PAGE - $(Get-Date)" | Out-File -FilePath "test_print.txt" -Encoding ASCII; Get-Content "test_print.txt" | Out-Printer -Name "${savedPrinter.name}"; Get-PrintJob | Select-Object DocumentName, JobStatus, SubmittedTime, PrinterName | ConvertTo-Json`
                          setPrinterTerminalCommand(command)
                        }}
                        className="btn btn-primary text-xs"
                      >
                        Test Print
                      </button>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Commande PowerShell custom..."
                        className="input flex-1 text-sm"
                        value={printerTerminalCommand}
                        onChange={(e) => setPrinterTerminalCommand(e.target.value)}
                      />
                      <button
                        onClick={handleExecutePrinterCommand}
                        disabled={!printerTerminalCommand.trim() || isExecutingPrinterCommand}
                        className="btn btn-blue text-sm"
                      >
                        {isExecutingPrinterCommand ? 'Executing...' : 'Execute'}
                      </button>
                    </div>

                    {/* Printer Terminal Output */}
                    {printerTerminalOutput && (
                      <div className="bg-gray-900 text-green-400 p-3 rounded text-xs max-h-48 overflow-y-auto font-mono">
                        <div className="text-white mb-2">Output:</div>
                        {printerTerminalOutput.stdout && (
                          <div className="text-green-400 mb-2">{printerTerminalOutput.stdout}</div>
                        )}
                        {printerTerminalOutput.stderr && (
                          <div className="text-red-400">{printerTerminalOutput.stderr}</div>
                        )}
                        {printerTerminalOutput.exit_code !== 0 && (
                          <div className="text-yellow-400">Exit Code: {printerTerminalOutput.exit_code}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Smart Printer Test - Automatically adapts to printer type */}
              {savedPrinter && (
                <SmartPrinterTest printerName={savedPrinter.name} />
              )}

              {/* Legacy Print Settings (simplified) */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Print Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paper Size
                    </label>
                    <select
                      value={printSettings.paper_size}
                      onChange={(e) => setPrintSettings({ ...printSettings, paper_size: e.target.value })}
                      className="input w-full"
                    >
                      <option value="80mm">80mm (Thermal Receipt)</option>
                      <option value="58mm">58mm (Thermal Receipt)</option>
                      <option value="A4">A4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Show Logo
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="show_logo"
                        checked={printSettings.show_logo}
                        onChange={(e) => setPrintSettings({ ...printSettings, show_logo: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="show_logo" className="ml-2 text-sm text-gray-700">
                        Show Logo on Receipts
                      </label>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Footer Text
                    </label>
                    <textarea
                      value={printSettings.footer_text}
                      onChange={(e) => setPrintSettings({ ...printSettings, footer_text: e.target.value })}
                      rows={2}
                      className="input w-full"
                      placeholder="Thank you for your visit!"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Cash</h4>
                      <p className="text-sm text-gray-500">Cash payment</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Enabled</span>
                    <div className="w-10 h-6 bg-green-500 rounded-full relative">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Credit Card</h4>
                      <p className="text-sm text-gray-500">Payment terminal</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Enabled</span>
                    <div className="w-10 h-6 bg-green-500 rounded-full relative">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Cheque</h4>
                      <p className="text-sm text-gray-500">Cheque payment</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Disabled</span>
                    <div className="w-10 h-6 bg-gray-300 rounded-full relative">
                      <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Settings</h3>
              <div className="space-y-4">
                {/* Left-handed mode */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">User Interface</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Left-handed Mode</p>
                      <p className="text-sm text-gray-500">
                        Inverts the point of sale layout (cart to the left)
                      </p>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => setLeftHandedMode(!settings.leftHandedMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${settings.leftHandedMode ? 'bg-primary-600' : 'bg-gray-200'
                          }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.leftHandedMode ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Backup and Export Manager */}
                <BackupManager />

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">About</h4>
                  <p className="text-sm text-gray-500">
                    Zikiro v0.1.0<br />
                    Developed with Rust, Tauri and React
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

