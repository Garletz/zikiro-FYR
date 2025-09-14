import { invoke } from '@tauri-apps/api/core';
import { CheckCircle, Printer, XCircle, Zap } from 'lucide-react';
import { useState } from 'react';

interface SmartPrinterTestProps {
    printerName: string;
}

export default function SmartPrinterTest({ printerName }: SmartPrinterTestProps) {
    const [isPrinting, setIsPrinting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const testSmartPrint = async () => {
        console.log('🚀 DEBUG: Starting smart print test...');
        console.log('🚀 DEBUG: Printer name:', printerName);

        setIsPrinting(true);
        setResult(null);

        try {
            console.log('🚀 DEBUG: Calling print_smart_ticket command...');

            // Log the command being sent
            console.log('🚀 DEBUG: Sending command to Rust backend...');
            console.log('🚀 DEBUG: Command: print_smart_ticket');
            console.log('🚀 DEBUG: Parameters: { printerName: "' + printerName + '" }');

            const response = await invoke<string>('print_smart_ticket', {
                printerName: printerName
            });

            console.log('🚀 DEBUG: Response received:', response);

            setResult({
                success: true,
                message: response
            });
        } catch (error) {
            console.error('🚀 DEBUG: Error occurred:', error);
            setResult({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                Smart Print Test
            </h4>

            <div className="space-y-4">
                <div className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
                    <p><strong>Printer:</strong> {printerName}</p>
                    <p className="mt-2 text-purple-700">
                        <Zap className="w-4 h-4 inline mr-1" />
                        This button automatically detects printer type and adapts:
                    </p>
                    <ul className="mt-2 text-purple-600 text-xs">
                        <li>• <strong>Network TCP/IP</strong> → Direct connection to port 9100</li>
                        <li>• <strong>USB/Serial</strong> → Standard Windows printing</li>
                        <li>• <strong>Other</strong> → Automatic method</li>
                    </ul>
                </div>

                <button
                    onClick={testSmartPrint}
                    disabled={isPrinting}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-lg font-medium"
                >
                    {isPrinting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Printer className="w-5 h-5" />
                    )}
                    {isPrinting ? 'Detecting & Printing...' : '🎯 PRINT TEST TICKET'}
                </button>

                {result && (
                    <div className={`p-3 rounded-lg ${result.success
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                        }`}>
                        <div className="flex items-center gap-2">
                            {result.success ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'
                                }`}>
                                {result.success ? 'Succès' : 'Échec'}
                            </span>
                        </div>
                        <p className={`text-sm mt-2 ${result.success ? 'text-green-700' : 'text-red-700'
                            }`}>
                            {result.message}
                        </p>
                    </div>
                )}

                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <p><strong>How it works:</strong></p>
                    <p>1. System analyzes your printer</p>
                    <p>2. Automatically selects best method</p>
                    <p>3. Sends ticket in correct format</p>
                    <p className="mt-2"><strong>Console (F12):</strong> Check debug logs to see method used</p>
                </div>
            </div>
        </div>
    );
}
