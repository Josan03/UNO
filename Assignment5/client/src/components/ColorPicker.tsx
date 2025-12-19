import { Color } from '@shared/model/deck'

interface ColorPickerProps {
    onSelect: (color: Color) => void
    onCancel: () => void
}

const colors: { color: Color; bg: string; label: string }[] = [
    { color: 'RED', bg: 'bg-uno-red hover:bg-red-700', label: 'Red' },
    { color: 'BLUE', bg: 'bg-uno-blue hover:bg-blue-700', label: 'Blue' },
    { color: 'GREEN', bg: 'bg-uno-green hover:bg-green-700', label: 'Green' },
    { color: 'YELLOW', bg: 'bg-uno-yellow hover:bg-yellow-600', label: 'Yellow' }
]

export function ColorPicker({ onSelect, onCancel }: ColorPickerProps) {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white text-center mb-4">Choose a Color</h3>

                <div className="grid grid-cols-2 gap-3">
                    {colors.map(({ color, bg, label }) => (
                        <button
                            key={color}
                            onClick={() => onSelect(color)}
                            className={`${bg} w-20 h-20 rounded-xl text-white font-bold
                         transition-transform hover:scale-105 shadow-lg`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={onCancel}
                    className="w-full mt-4 py-2 text-white/60 hover:text-white transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}
