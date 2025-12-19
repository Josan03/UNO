import { useAppSelector } from './store'
import { Lobby } from './components/Lobby'
import { Game } from './components/Game'
import { Home } from './components/Home'
import { GridScan } from '@shared/components/GridScan'
import { Color } from '@shared/model/deck'

// Map UNO colors to hex for GridScan
const colorToHex: Record<Color, string> = {
    RED: '#ED1C24',
    BLUE: '#0072BC',
    GREEN: '#00A651',
    YELLOW: '#FFED00'
}

function App() {
    const { lobby, game } = useAppSelector((state) => state.game)

    // Determine grid color based on game state
    const getGridColor = () => {
        if (game?.round?.currentColor) {
            return colorToHex[game.round.currentColor]
        }
        // Default purple for lobby/home
        return '#a855f7'
    }

    const gridColor = getGridColor()

    return (
        <div className="relative min-h-screen">
            {/* GridScan Background */}
            <div className="fixed inset-0 -z-10">
                <GridScan
                    sensitivity={0.55}
                    lineThickness={1}
                    linesColor="#1a1625"
                    gridScale={0.1}
                    scanColor={gridColor}
                    scanOpacity={0.5}
                    enablePost
                    bloomIntensity={0.8}
                    chromaticAberration={0.002}
                    noiseIntensity={0.01}
                />
            </div>

            {/* Main Content */}
            {game ? (
                <Game />
            ) : lobby ? (
                <Lobby />
            ) : (
                <Home />
            )}
        </div>
    )
}

export default App
