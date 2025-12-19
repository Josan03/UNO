import { useAppSelector } from './store'
import { Lobby } from './components/Lobby'
import { Game } from './components/Game'
import { Home } from './components/Home'

function App() {
    const { lobby, game } = useAppSelector((state) => state.game)

    // In game (winner modal is shown inside Game component)
    if (game) {
        return <Game />
    }

    // In lobby
    if (lobby) {
        return <Lobby />
    }

    // Home/Connect screen
    return <Home />
}

export default App
