import { createBrowserRouter } from 'react-router-dom'
import Lobby from '../views/Lobby'
import Login from '../views/Login'
import Game from '../views/Game'
import Pending from '../views/Pending'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Lobby/>
  }, 
  {
    path: '/login',
    element: <Login/>
  }, 
  {
    path: '/game/:id',
    element: <Game/>,
  }, 
  {
    path: '/pending/:id',
    element: <Pending/>,
  },
])

export default router
