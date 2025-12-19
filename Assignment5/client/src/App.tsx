import { useDispatch } from "react-redux";
import "./App.css";
import router from "./router";
import { RouterProvider } from "react-router-dom";
import { type Dispatch, store } from "./stores/store";
import { useEffect } from "react";
import InitGameThunk from "./thunks/InitGameThunk";
import LiveUpdatePending from "./thunks/LiveUpdatePending";
import LiveUpdateOngoing from "./thunks/LiveUpdateOngoing";

function App() {
  const dispatch: Dispatch = useDispatch();
  useEffect(() => {
    InitGameThunk(dispatch);
    LiveUpdatePending(dispatch);
    LiveUpdateOngoing(dispatch, () => store.getState());
  }, [dispatch]);

  return (
    <div id="app">
      <h1 className="header">UNO!</h1>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
