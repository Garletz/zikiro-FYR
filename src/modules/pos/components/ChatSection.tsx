import { Bot, MessageCircle, Send, User } from 'lucide-react'
import { useState } from 'react'

interface ChatSectionProps {
    compact?: boolean
}

interface ChatMessage {
    id: string
    type: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export default function ChatSection({ compact = false }: ChatSectionProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            type: 'assistant',
            content: 'Hello! I am your POS assistant. How can I help you today?',
            timestamp: new Date()
        },
        {
            id: '2',
            type: 'assistant',
            content: '💡 **Quick instructions:**\n• Click on a product to add it to cart\n• Use "Direct sale" for takeout orders\n• Select a table for dine-in orders',
            timestamp: new Date()
        }
    ])
    const [inputValue, setInputValue] = useState('')

    const padding = compact ? 'p-2' : 'p-3 lg:p-4'
    const textSize = compact ? 'text-sm' : 'text-base'
    const iconSize = compact ? 'w-4 h-4' : 'w-5 h-5'

    const handleSendMessage = () => {
        if (!inputValue.trim()) return

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, newMessage])
        setInputValue('')

        // Simulate assistant response
        setTimeout(() => {
            const assistantResponse: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: 'I understand your request. Let me help you with that...',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, assistantResponse])
        }, 1000)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <div className="w-full h-full bg-white flex flex-col">
            {/* Simplified and prettier header */}
            <div className={`${padding} border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0`}>
                <div className="flex items-center">
                    <MessageCircle className={`${iconSize} mr-2 text-white`} />
                    <h3 className={`${textSize} font-bold text-white`}>POS Assistant</h3>
                </div>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto ${padding} space-y-3`}>
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${message.type === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                                }`}
                        >
                            <div className="flex items-start space-x-2">
                                {message.type === 'assistant' && (
                                    <Bot className={`${iconSize} text-purple-600 mt-0.5 flex-shrink-0`} />
                                )}
                                {message.type === 'user' && (
                                    <User className={`${iconSize} text-blue-200 mt-0.5 flex-shrink-0`} />
                                )}
                                <div className="flex-1">
                                    <p className={`${textSize} whitespace-pre-line`}>{message.content}</p>
                                    <p className={`text-xs opacity-70 mt-1`}>
                                        {message.timestamp.toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className={`${padding} border-t border-gray-200 flex-shrink-0`}>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Posez votre question..."
                        className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${textSize}`}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim()}
                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
