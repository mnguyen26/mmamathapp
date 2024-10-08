import React from 'react';
import { useState } from 'react';

import { MantineProvider, Title, Text, Autocomplete, NumberInput, Button } from '@mantine/core';

import './App.css';

import fighterWinsGraph from './JSONData/fighter_wins_graph.json';
import goatFighters from './JSONData/fighter_peak_elo_records.json'
import { start } from 'repl';

interface FighterSelectProps {
  label: string;
  onChange: (fighter: string) => void
}


interface FindPathButtonProps {
  label: string,
  onClick: () => void
}

interface NumPathsInputProps {
  onChange: (value: string | number) => void
}

interface PrintAreaProps {
  path: string[] | null
}

const findShortestPath = (graph: { [key: string]: string[] }, startFighter: string, targetFighter: string): string[] | null => {
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

const findPathsToGOATS = (startFighter: string, numPaths: number): string[][] => {
  let pathsLeft: number = numPaths;
  let retPaths: string[][] = [];
  
  for (const key of Object.keys(goatFighters)) {
    let path: string[] | null = findShortestPath(fighterWinsGraph, startFighter, key);
    if (path != null) {
      retPaths[retPaths.length] = path;
      pathsLeft--;
    }
    if (pathsLeft == 0) { break; }
  }
  
  return retPaths;
}

const Intro = () => {
  return (
    <>
      <Title order={1}>MMA Math</Title>
      <Text>
        <p>
          We should know that MMA math doesn't work in real life. If Fighter A beats Fighter B, and Fighter B beats Fighter C, it doesn't necessarilly mean Fighter A will beat Fighter C. Fighting ability isn't a one-dimensional trait and matchups can be nontransitive. Styles make fights and we've seen scenarios like Ronda Rousey beating Misha Tate, Holly Holm defeating Ronda Rousey, and Misha Tate beating Holly Holm. I call this the starter Pokemon phenomenon.
        </p>
        <p>
          Because I still see this type of logic in MMA forums, this project takes the idea of MMA math to its most absurd degree. Using fight results from UFC history, I've assigned fighters Elo scores (a ranking system originally developed for chess) and built a graph that connects fighters by their wins. The project lets you find the paths between any given fighter and the highest-rated fighters of all time, according to peak Elo scores. You can also simply find a path between any two given fighters if it exists. 
        </p>
      </Text>
    </>
  );
}

const FighterSelectForm = (props: FighterSelectProps) => {
  const fighterKeys = Object.keys(fighterWinsGraph).sort();

  return (
    <Autocomplete
        label={props.label}
        data={fighterKeys}
        onChange={props.onChange}
        withScrollArea={false}
        styles={{ dropdown: { maxHeight: 200, overflowY: 'auto', cursor: 'pointer' } }}
      />
  )
}

const FindPathButton = (props: FindPathButtonProps) => {
  return (
    <Button
      onClick={props.onClick} 
    >
      {props.label}
    </Button>
  )
}

const NumPathsInput = (props: NumPathsInputProps) => {
  return (
    <NumberInput 
      label="Number of paths"
      onChange={props.onChange}
    />
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
      label="Find path"
      onClick={handleFindPath}
    />
    <PrintArea 
      path={fighterPath}/>
    </>
  )
}

const GoatPaths = () => {
  const [startFighter, setStartFighter] = useState<string>("");
  const [numPaths, setNumPaths] = useState<number>(0);
  const [paths, setPaths] = useState<string[][]>([]);

  const handleFindGoatPaths = () => {
    const goatPaths: string[][] = findPathsToGOATS(startFighter, numPaths);
    setPaths(goatPaths);
  }

  return (
    <>
    <FighterSelectForm 
      label="Select the starting fighter"
      onChange={setStartFighter}
    />
    <NumPathsInput 
      onChange={(value) => setNumPaths(Number(value))}
    />
    <FindPathButton 
      label="Find paths"
      onClick={handleFindGoatPaths}
    />
    {paths.map((path, index) => (
      <div>
        <br />
        <PrintArea key={index} path={path} />
      </div>
    ))}
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
      <Intro />
      <FindPath />
      <GoatPaths />
    </MantineProvider>
  );
}

export default App;
