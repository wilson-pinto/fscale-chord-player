import Piano from './components/Piano'
import './App.css'

function App() {
  return (
    <>
      <header>
        <h1>Simple Chord Player</h1>
        <p>Use your keyboard (Q-P and []) or click buttons to play major and minor chords</p>
      </header>
      <main>
        <Piano />
      </main>
    </>
  )
}

export default App
