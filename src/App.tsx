import React from 'react'
import Piano from './components/Piano'
import './App.css'

const App: React.FC = () => {
  return (
    <>
      <header>
        <h1>F Scale Chord Player</h1>
        <p>Use keys Q-U to play chords in F major scale</p>
      </header>
      <main>
        <Piano />
      </main>
    </>
  )
}

export default App