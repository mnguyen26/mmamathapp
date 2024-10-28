//========================================================================================================
// IMPORTS
//========================================================================================================

// React
import { useState, useEffect, useRef } from 'react';
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

// Mantine
import { MantineProvider, Title, Text, Autocomplete, Button, Collapse, Divider, Combobox, useCombobox, Input, InputBase } from '@mantine/core';
import { useDisclosure, useDebouncedCallback } from '@mantine/hooks';
import '@mantine/core/styles.css';

// d3
import * as d3 from 'd3';

// data
import fighterWinsGraph from './JSONData/fighter_wins_graph.json';
import goatFighters from './JSONData/fighter_peak_elo_records.json'
import fighterPics from './JSONData/fighter_pics.json';
import fighter_id_name_map from './JSONData/fighter_id_name_map.json';

import './Styles/app.css'


//========================================================================================================
// INTERFACES
//========================================================================================================

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

interface ChartAreaProps
{
  path: string[]
}

interface FighterWin
{
  Name: string,
  Opponent: string,
  OpponentId: string,
  Date: string,
}

interface FighterDetail {
  name: string;
  elo: number;
  picUrl: string | null;
}

interface FighterIdNameMap {
  [key: string]: string;
}

//========================================================================================================
// FUNCTIONS
//========================================================================================================

const fighterMap: FighterIdNameMap = fighter_id_name_map;

const mapFighterIdToName = (fighterId: string): string => {
  return fighterMap[fighterId] || 'NA';
};

const mapFighterIdsToNames = (fighterIds: string[] | null): string[] => {
  if (fighterIds != null) {
    return fighterIds.map(mapFighterIdToName);
  }
  return [];
};

const mapFighterNameToId = (fighterName: string): string => {
  return Object.keys(fighter_id_name_map).find(key => fighter_id_name_map[key as keyof typeof fighter_id_name_map] === fighterName) || '';
}

const findShortestPath = (graph: { [key: string]: FighterWin[] }, startFighterId: string, targetFighterId: string): string[] | null => {
  if (!graph[startFighterId] || !graph[targetFighterId]) {
    return null;
  }

  const queue: string[][] = [[startFighterId]];
  const visited: Set<string> = new Set([startFighterId]);

  while (queue.length > 0) {
    const path = queue.shift();
    if (!path) continue;

    const lastFighterId = path[path.length - 1];

    if (lastFighterId === targetFighterId) {
      return path;
    }

    for (const win of graph[lastFighterId]) {
      const neighborId = win.OpponentId;
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        const newPath = [...path, neighborId];
        queue.push(newPath);
      }
    }
  }

  return null;
}

const getFighterDetails = (fighterIds: string[]): FighterDetail[] => {
  const fighterNames = mapFighterIdsToNames(fighterIds);
  return fighterIds.map((fighterId, index) => {
    const eloRecord = goatFighters[fighterId as keyof typeof goatFighters];
    const picRecord = fighterPics.find(f => f.Name === fighterNames[index]);
    
    return {
      name: eloRecord.Name,
      elo: eloRecord ? eloRecord.Elo : 1000,
      picUrl: picRecord ? picRecord.PicURL : "https://dmxg5wxfqgb4u.cloudfront.net/styles/teaser/s3/image/fighter_images/ComingSoon/comingsoon_headshot_odopod.png?VersionId=6Lx8ImOpYf0wBYQKs_FGYIkuSIfTN0f0\u0026amp;itok=pYDOjN8k"
    };
  });
}

//========================================================================================================
// SMALLER COMPONENTS
//========================================================================================================

const Intro = () => {
  return (
    <>
      <Title order={1}>MMA Math</Title>
      <Text size='xs'>
        <p style={{textIndent: '1em'}}>
          We should know that MMA math doesn't work in real life. Fighting ability isn't a one-dimensional trait and wins are non-transitive. Styles make fights and we've seen scenarios like Ronda Rousey beating Misha Tate, Holly Holm defeating Ronda Rousey, and Misha Tate beating Holly Holm. Outside of MMA you see the same phenomenon with starter Pokemon and rock-paper-scissors.
        </p>
        <p style={{textIndent: '1em'}}>
          But because I consistently still see this type of logic in MMA forums, this project takes the idea of MMA math to its furthest extent to show how absurd it can be. Here you can find the win paths between any two given fighters to justify why one would beat the other.
        </p>
      </Text>
    </>
  );
}

const Notes = () => {
  return (
    <>
    <Text size='xs' style={{width:'200px', marginTop: '10em'}}>
      *I've only kept track of fights in the UFC. Fights in other promotions are not included. Fighter images are plotted by rating so that a greater upward slope indicates a bigger upset. Ratings are based on a modified Elo calculation that gives more weight to finishes than decisions. Elo ratings are also only based on fights in the UFC so that all fights for all fighters occur in the same pool. The ratings plotted are the peak ratings during a particular fighters career and not their rating at the time of the fight.
    </Text>
    </>
  )
}

const CollapseDivider = (props: CollapseDividerProps) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ flex: '1 1 70%', marginRight: '1em' }}>
        <Divider
          my="xs"
          label={props.label}
          labelPosition='left'
        />
      </div>
      <Button size="xs" onClick={props.onClick}>
        {props.opened && <IoIosArrowUp />}
        {!props.opened && <IoIosArrowDown />}
      </Button>
    </div>
  )
}

const FighterSelectForm = (props: FighterSelectProps) => {

  const debounceOnChange = useDebouncedCallback((value: string) => {
    props.onChange(value);
  }, 300);

  return (
    <div style={{width: '15em', margin: '1em 0' }}>
      <Autocomplete
          label={props.label}
          placeholder="Search..."
          data={props.data}
          // limit={20}
          onChange={debounceOnChange}
          withScrollArea={false}
          styles={{ dropdown: { maxHeight: 200, overflowY: 'auto', cursor: 'pointer' } }}
          style={{ marginRight: '1em' }} 
        />
    </div>
  )
}

const GoatSelectDropDown = (props: GoatSelectDropDownProps) => {
  const [value, setValue] = useState<string | null>(null);

  const combobox = useCombobox();

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
    style={{ width: '15em', margin: '1em 0' }} >
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
          <Combobox.Options mah={200} style={{ overflowY: 'auto' }}>
            {options}
            </Combobox.Options>
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

const FighterPathText = ({ path }: { path: string[] | null }) => {
  if (!path) return null;

  return (
    <div style={{fontSize: '.8em'}}>
      {path.map((fighterId, index) => {
        const fighterName = mapFighterIdToName(fighterId);
        const nextFighterId = path[index + 1];
        if (nextFighterId) {
          const nextFighterName = mapFighterIdToName(nextFighterId);
          return <div key={index}>{fighterName} defeated {nextFighterName}</div>;
        }
        return null;
      })}
    </div>
  );
}

// d3 line graph
const FighterPathChart = ({ path }: FighterPathChartProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  
  const fighterDetails = getFighterDetails(path);
  const fighterNames = fighterDetails.map(detail => detail.name);

  useEffect(() => {
    if (!fighterDetails) return;

    const svg = d3.select(svgRef.current);
    const width = 1200;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    svg.selectAll('*').remove();

    const xScale = d3.scalePoint<string>()
      .domain(fighterNames)
      .range([margin.left, width - margin.right])
      .padding(0.5);

    const yScale = d3.scaleLinear()
      .domain([d3.min(fighterDetails, d => d.elo) || 900, d3.max(fighterDetails, d => d.elo) || 1300]) 
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const line = d3.line<string>()
      .x(d => xScale(d) as number)
      .y(d => yScale(fighterDetails.find(f => f.name === d)?.elo || 1000));

    svg.append('path')
      .datum(fighterNames)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1)
      .attr('d', line);

    svg.selectAll('image')
      .data(fighterNames)
      .enter()
      .append('image')
      .attr('xlink:href', d => {
        const fighterDetail = fighterDetails.find(f => f.name === d); 
        return fighterDetail ? fighterDetail.picUrl : ''; 
      })
      .attr('x', d => xScale(d) as number - 25)
      .attr('y', d => yScale(fighterDetails.find(f => f.name === d)?.elo || 1000) - 40) 
      .attr('width', 50)
      .attr('height', 50);

    svg.selectAll('text.label')
      .data(fighterNames)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d) as number)
      .attr('y', d => yScale(fighterDetails.find(f => f.name === d)?.elo || 1000) + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .text(d => d);

    svg.selectAll('text.elo')
      .data(fighterNames)
      .enter()
      .append('text')
      .attr('class', 'elo')
      .attr('x', d => xScale(d) as number)
      .attr('y', d => yScale(fighterDetails.find(f => f.name === d)?.elo || 1000) + 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px') 
      .text(d => fighterDetails.find(f => f.name === d)?.elo || 'N/A'); 
  }, [path]);

  return <svg ref={svgRef} style={{ width: '1200px', height: '400px' }} />;
};

const ChartArea = (props: ChartAreaProps) => {
  return (
    <>
    <div className="fade-in" key={JSON.stringify(props.path)}>
      <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '10px', width: '100%', margin: '20px 0', overflowX: 'auto' }}>
        <FighterPathChart path={props.path} />
      </div>
      <FighterPathText path={props.path} />
    </div>
    </>
  )
}

//========================================================================================================
// LARGER COMPONENTS
//========================================================================================================

const FighterPath = () => {
  const [startingFighterId, setStartingFighterId] = useState<string>(""); 
  const [endingFighterId, setEndingFighterId] = useState<string>(""); 
  const [fighterPath, setFighterPath] = useState<string[] | null>(null);
  const [opened, { toggle }] = useDisclosure(true);

  const fighterKeys = Object.keys(fighter_id_name_map);
  const fighterNames = mapFighterIdsToNames(fighterKeys).sort();

  const handleFindPath = () => {
    let path = findShortestPath(fighterWinsGraph, startingFighterId, endingFighterId); 
    setFighterPath(path);
  }

  return (
    <>
    <div style={{ margin: '1em 0' }}>
      <CollapseDivider 
        label="Fighter vs Fighter"
        opened={opened}
        onClick={toggle}
      />
      <Collapse in={opened}>
        <FighterSelectForm
          label="Starting Fighter"
          data={fighterNames}
          onChange={(fighterName) => setStartingFighterId(mapFighterNameToId(fighterName))}
        />
        <FighterSelectForm
          label="Ending Fighter"
          data={fighterNames}
          onChange={(fighterName) => setEndingFighterId(mapFighterNameToId(fighterName))}
        />
        <FindPathButton
          label="Find path"
          onClick={handleFindPath}
        />
        {fighterPath && <ChartArea path={fighterPath} />}
      </Collapse>
    </div>
    </>
  );
}

const GoatPaths = () => {
  const [startFighterId, setStartFighterId] = useState<string>(""); 
  const [goats, setGoats] = useState<string[]>([]);
  const [endFighterId, setEndFighterId] = useState<string>(""); 
  const [fighterPath, setFighterPath] = useState<string[] | null>(null);
  const [opened, { toggle }] = useDisclosure(false);

  const fighterKeys = Object.keys(fighter_id_name_map);
  const fighterNames = mapFighterIdsToNames(fighterKeys).sort();

  const handleFighterSelected = (fighterName: string) => { 
    let fighterId = "";
    let goatsToCompare: string[] = [];
    
    if (fighterName != "") {
      fighterId = mapFighterNameToId(fighterName);
      goatsToCompare = mapFighterIdsToNames(findGOATsWithPaths(fighterId))
    }
    setStartFighterId(fighterId);
    setGoats(goatsToCompare);
  }

  const findGOATsWithPaths = (fighterId: string): string[] => {
    let pathsLeft: number = 20;
    let retList: string[] = [];
  
    for (const key of Object.keys(goatFighters)) {
      let path = findShortestPath(fighterWinsGraph, fighterId, key);
      if (path !=null) {
        retList[retList.length] = path[path.length - 1]
        pathsLeft--;
      }
      if (pathsLeft == 0) { break; }
    }
  
    return retList;
  }

  const handleFindPath = () => {
    let path = findShortestPath(fighterWinsGraph, startFighterId, endFighterId); 
    setFighterPath(path);
  }

  return (
    <>
    <div style={{ margin: '1em 0' }}>
      <CollapseDivider 
        label="Fighter vs GOATs"
        onClick={toggle}
        opened={opened}
      />
      <Collapse in={opened}>
        <FighterSelectForm 
          label="Starting Fighter"
          data={fighterNames}
          onChange={handleFighterSelected}
        />
        <GoatSelectDropDown 
          data={goats}
          onSelect={(fighterName) => setEndFighterId(mapFighterNameToId(fighterName))}
        />
        <FindPathButton 
          label="Find path"
          onClick={handleFindPath}
        />
        {fighterPath && <ChartArea path={fighterPath} />}
      </Collapse>
    </div>
    </>
  )
}

//========================================================================================================
// MAINT COMPONENT & RENDER
//========================================================================================================

function App() {
  return (
    <MantineProvider>
      <div style={{ padding: '3rem 4rem 3rem', overflowX: 'hidden', maxWidth: '1500px' }}>
        <Intro />
        <FighterPath />
        <GoatPaths />
        <Notes />
      </div>
    </MantineProvider>
  );
}

export default App;
