import { useState, useEffect, useRef } from 'react';
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

import { MantineProvider, Title, Text, Autocomplete, Button, Collapse, Divider, Combobox, useCombobox, Input, InputBase } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import '@mantine/core/styles.css';

import * as d3 from 'd3';

import fighterWinsGraph from './JSONData/fighter_wins_graph.json';
import goatFighters from './JSONData/fighter_peak_elo_records.json'
import fighterPics from './JSONData/fighter_pics.json';

interface CollapseDividerProps {
  label: string;
  opened: boolean;
  onClick: () => void;
}

interface FighterSelectProps {
  label: string;
  data: string[];
  onChange: (fighter: string) => void
}

interface GoatSelectDropDownProps {
  data: string[];
  onSelect: (fighter: string) => void;
}

interface FindPathButtonProps {
  label: string,
  onClick: () => void
}

interface FighterPathChartProps {
  path: string[];
}

interface FighterDetail {
  name: string;
  elo: number;
  picUrl: string | null;
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

const getFighterDetails = (fighterNames: string[]): FighterDetail[] => {
  return fighterNames.map(fighterName => {
    const eloRecord = goatFighters[fighterName as keyof typeof goatFighters];
    const picRecord = fighterPics.find(f => f.Name === fighterName);
    
    return {
      name: fighterName,
      elo: eloRecord ? eloRecord.Elo : 1000,
      picUrl: picRecord ? picRecord.PicURL : ''
    };
  });
}

const findGOATsWithPaths = (startFighter: string): string[] => {
  let pathsLeft: number = 25;
  let retList: string[] = [];

  for (const key of Object.keys(goatFighters)) {
    let path = findShortestPath(fighterWinsGraph, startFighter, key);
    if (path !=null) {
      retList[retList.length] = path[path.length - 1]
      pathsLeft--;
    }
    if (pathsLeft == 0) { break; }
  }

  return retList;
}

const Intro = () => {
  return (
    <>
      <Title order={1}>MMA Math</Title>
      <Text>
        <p>
          We should know that MMA math doesn't work in real life. Fighting ability isn't a one-dimensional trait and wins are non-transitive. Styles make fights and we've seen scenarios like Ronda Rousey beating Misha Tate, Holly Holm defeating Ronda Rousey, and Misha Tate beating Holly Holm. Outside of MMA you see the same phenomenon with starter Pokemon and rock-paper-scissors.
        </p>
        <p>
          But because I consistently still see this type of logic in MMA forums, this project takes the idea of MMA math to its furthest extent to show how absurd it can be. Here you can find the paths between any given fighter and the highest-rated fighters of all time (based on Elo ratings I calculated). You can also simply find a path between any two given fighters if it exists. 
        </p>
      </Text>
    </>
  );
}

const CollapseDivider = (props: CollapseDividerProps) => {
  return (
    <Divider
      my="xs"
      label={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: '1em' }}>
            {props.label}
          </div>
          <Button onClick={props.onClick}>
            {props.opened && <IoIosArrowUp />}
            {!props.opened && <IoIosArrowDown />}
          </Button>
        </div>
      }
    />
  )
}

const FighterSelectForm = (props: FighterSelectProps) => {

  return (
    <Autocomplete
        label={props.label}
        data={props.data}
        onChange={props.onChange}
        withScrollArea={false}
        styles={{ dropdown: { maxHeight: 200, overflowY: 'auto', cursor: 'pointer' } }}
        style={{ marginRight: '1em' }} 
      />
  )
}

const GoatSelectDropDown = (props: GoatSelectDropDownProps) => {
  const [value, setValue] = useState<string | null>(null);

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const options = props.data.map((item) => (
    <Combobox.Option value={item} key={item}>
      {item}
    </Combobox.Option>
  ));

  const handleFighterSelected = (fighter: string) => {
    setValue(fighter);
    props.onSelect(fighter);
    combobox.closeDropdown();
  }

  return (
    <div
    style={{ marginRight: '1em' }} >
      <Combobox
        store={combobox}
        withinPortal={false}
        onOptionSubmit={(val) => {
          handleFighterSelected(val);
        }}
      >
        <Combobox.Target>
          <InputBase
            component="button"
            type="button"
            pointer
            rightSection={<Combobox.Chevron />}
            onClick={() => combobox.toggleDropdown()}
            rightSectionPointerEvents="none"
          >
            {value || <Input.Placeholder>Pick a GOAT</Input.Placeholder>}
          </InputBase>
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Options>{options}</Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </div>
  );
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

const FighterPathChart = ({ path }: FighterPathChartProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const fighterDetails = getFighterDetails(path)

  useEffect(() => {
    if (!fighterDetails) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    svg.selectAll('*').remove();

    const xScale = d3.scalePoint<string>()
      .domain(fighterDetails.map(f => f.name))
      .range([margin.left, width - margin.right])
      .padding(0.5);

    const yScale = d3.scaleLinear()
      .domain([d3.min(fighterDetails, d => d.elo) || 800, d3.max(fighterDetails, d => d.elo) || 2500]) 
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const line = d3.line<string>()
      .x(d => xScale(d) as number)
      .y(d => yScale(fighterDetails.find(f => f.name === d)?.elo || 1000));

    svg.append('path')
      .datum(path)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1)
      .attr('d', line);

    svg.selectAll('image')
      .data(path)
      .enter()
      .append('image')
      .attr('xlink:href', d => {
        const fighterDetail = fighterDetails.find(f => f.name === d); 
        return fighterDetail ? fighterDetail.picUrl : ''; 
      })
      .attr('x', d => xScale(d) as number - 12)
      .attr('y', d => yScale(fighterDetails.find(f => f.name === d)?.elo || 1000) - 12) 
      .attr('width', 20)
      .attr('height', 20);

    svg.selectAll('text.label')
      .data(path)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d) as number)
      .attr('y', d => yScale(fighterDetails.find(f => f.name === d)?.elo || 1000) + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .text(d => d);

    // Elo rating below the fighter name
    svg.selectAll('text.elo')
      .data(path)
      .enter()
      .append('text')
      .attr('class', 'elo')
      .attr('x', d => xScale(d) as number)
      .attr('y', d => yScale(fighterDetails.find(f => f.name === d)?.elo || 1000) + 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px') 
      .text(d => fighterDetails.find(f => f.name === d)?.elo || 'N/A'); 
  }, [path]);

  return <svg ref={svgRef} style={{ width: '800px', height: '300px' }} />;
};

const GoatPaths = () => {
  const [startFighter, setStartFighter] = useState<string>("");
  const [goats, setGoats] = useState<string[]>([])
  const [endFighter, setEndFighter] = useState<string>("");
  const [fighterPath, setFighterPath] = useState<string[] | null>(null);
  const [opened, { toggle }] = useDisclosure(true);

  const fighterKeys = Object.keys(fighterWinsGraph).sort();
  
  const handleFighterSelected = (fighter: string) => {
    setStartFighter(fighter);

    const goatsToCompare: string[] = findGOATsWithPaths(fighter);
    setGoats(goatsToCompare);
  }

  const handleFindPath = () => {
    let path = findShortestPath(fighterWinsGraph, startFighter, endFighter);
    setFighterPath(path);
  }

  return (
    <>
    <CollapseDivider 
      label="Fighter vs GOATs"
      onClick={toggle}
      opened={opened}
    />
    <Collapse in={opened}>
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <FighterSelectForm 
          label="Select the starting fighter"
          data={fighterKeys}
          onChange={handleFighterSelected}
        />
        <GoatSelectDropDown 
          data={goats}
          onSelect={setEndFighter}
        />
        <FindPathButton 
          label="Find path"
          onClick={handleFindPath}
        />
      </div>
      {fighterPath && <FighterPathChart path={fighterPath} />}
    </Collapse>
    </>
  )
}

const FighterPath = () => {
  const [startingFighter, setStartingFighter] = useState<string>("");
  const [endingFighter, setEndingFighter] = useState<string>("");
  const [fighterPath, setFighterPath] = useState<string[] | null>(null);
  const [opened, { toggle }] = useDisclosure(true);

  const fighterKeys = Object.keys(fighterWinsGraph).sort();

  const handleFindPath = () => {
    let path = findShortestPath(fighterWinsGraph, startingFighter, endingFighter);
    setFighterPath(path);
  }

  return (
    <>
      <CollapseDivider 
        label="Fighter vs Fighter"
        opened={opened}
        onClick={toggle}
      />
      <Collapse in={opened}>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <FighterSelectForm
            label="Select the starting fighter"
            data={fighterKeys}
            onChange={setStartingFighter}
          />
          <FighterSelectForm
            label="Select the ending fighter"
            data={fighterKeys}
            onChange={setEndingFighter}
          />
          <FindPathButton
            label="Find path"
            onClick={handleFindPath}
          />
        </div>
        {fighterPath && <FighterPathChart path={fighterPath} />}
      </Collapse>
    </>
  );
}

function App() {
  return (
    <MantineProvider>
      <div style={{ padding: '3rem 2rem 1rem' }}>
        <Intro />
        <GoatPaths />
        <FighterPath />
      </div>
    </MantineProvider>
  );
}

export default App;
