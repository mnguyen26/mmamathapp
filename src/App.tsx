import React from 'react';
import { useState } from 'react';

import { MantineProvider, Autocomplete, Button } from '@mantine/core';

import './App.css';

import fighterWinsGraph from './JSONData/fighter_wins_graph.json';

interface FighterSelectProps {
  label: string;
  onChange: (fighter: string) => void
}

interface FindPathButtonProps {
  onClick: () => void
}

interface PrintAreaProps {
  path: string[] | null
}

function findShortestPath(graph: { [key: string]: string[] }, startFighter: string, targetFighter: string): string[] | null {
  if (!graph[startFighter] || !graph[targetFighter]) {
    return null;
  }

  const queue: string[][] = [[startFighter]];
  const visited: Set<string> = new Set([startFighter]);

  while (queue.length > 0) {
    const path = queue.shift();
    if (!path) continue;

    const lastFighter = path[path.length - 1];

    if (lastFighter === targetFighter) {
      return path;
    }

    for (const neighbor of graph[lastFighter]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        const newPath = [...path, neighbor];
        queue.push(newPath);
      }
    }
  }

  return null;
}


const FighterSelectForm = (props: FighterSelectProps) => {
  const fighterKeys = Object.keys(fighterWinsGraph).sort();

  return (
    <Autocomplete
        label={props.label}
        data={fighterKeys}
        onChange={props.onChange}
      />
  )
}

const FindPathButton = (props: FindPathButtonProps) => {
  return (
    <Button
      onClick={props.onClick} 
    >
      Find Path
    </Button>
  )
}

const FindPath = () => {
  const [startingFighter, setStartingFighter] = useState<string>("");
  const [endingFighter, setEndingFighter] = useState<string>("");
  const [fighterPath, setFighterPath] = useState<string[] | null>([]);

  const handleFindPath = () => {
    var print = findShortestPath( fighterWinsGraph, startingFighter, endingFighter);
    setFighterPath(print);
  }

  return (
    <>
    <FighterSelectForm
      label="Select the starting fighter"
      onChange={setStartingFighter}
    />
    <FighterSelectForm
      label="Select the ending fighter"
      onChange={setEndingFighter}
    />
    <FindPathButton
      onClick={handleFindPath}
    />
    <PrintArea 
      path={fighterPath}/>
    </>
  )
}

const PrintArea = (props: PrintAreaProps) => {
  return (
    <>
    {props.path && props.path.join(' -> ')}
    </>
  )
}

function App() {
  return (
    <MantineProvider>
      <FindPath></FindPath>
    </MantineProvider>
  );
}

export default App;
