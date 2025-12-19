'use client'

import { Color } from '@shared/model/deck'

interface ColorPickerProps {
    onSelect: (color: Color) => void
    onCancel: () => void
}

const colors: { color: Color; gradient: string; glow: string }[] = [
    { color: 'RED', gradient: 'from-red-500 to-uno-red', glow: 'hover:shadow-glow-red' },
    { color: 'BLUE', gradient: 'from-blue-400 to-uno-blue', glow: 'hover:shadow-glow-blue' },
    { color: 'GREEN', gradient: 'from-green-400 to-uno-green', glow: 'hover:shadow-glow-green' },
    { color: 'YELLOW', gradient: 'from-yellow-300 to-uno-yellow', glow: 'hover:shadow-glow-yellow' }
]

export function ColorPicker({ onSelect, onCancel }: ColorPickerProps) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass rounded-3xl p-8 shadow-2xl animate-slide-up">
                <h3 className="text-2xl font-bold text-white text-center mb-6">Choose Color</h3>

                <div className="grid grid-cols-2 gap-4">
                    {colors.map(({ color, gradient, glow }) => (
                        <button
                            key={color}
                            onClick={() => onSelect(color)}
                            className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${gradient}
                                transition-all duration-300 transform hover:scale-110 ${glow}
                                flex items-center justify-center`}
                        >
                            <span className="text-white/90 font-bold text-sm drop-shadow-lg">
                                {color}
                            </span>
                        </button>
                    ))}
                </div>

                <button
                    onClick={onCancel}
                    className="w-full mt-6 py-3 text-white/50 hover:text-white hover:bg-white/10 
                        rounded-xl transition-all duration-200 font-medium"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}
