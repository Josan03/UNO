import { useState, type KeyboardEvent } from "react"
import { useDispatch } from "react-redux"
import { useNavigate, useSearchParams } from "react-router"
import LoginThunk from "../thunks/LoginThunk"
import type { Dispatch } from "../stores/store"

export default function Login() {
  const dispatch: Dispatch = useDispatch()
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()

  const [player, setPlayer] = useState('')

  const enabled = player !== ''

  function login() {
    dispatch(LoginThunk(player, searchParams, navigate))
  }
   
  const loginKeyListener = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (enabled) login()
    }
  }

  return <>
    <h1>Login</h1>
    Username: <input onKeyUp = {loginKeyListener} value={player} onChange={e => setPlayer(e.target.value)}/> <button disabled={!enabled} onClick={login} >Login</button>
    <div></div>
  </>
}