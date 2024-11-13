//========================================================================================================
// IMPORTS
//========================================================================================================

// React
import { useState } from 'react';
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

// Mantine
import { MantineProvider, Title, Text, Autocomplete, Button, Collapse, Divider, Combobox, useCombobox, Input, InputBase, Modal } from '@mantine/core';
import { useDisclosure, useDebouncedCallback } from '@mantine/hooks';
import '@mantine/core/styles.css';

// data
import fighterWinsGraph from './JSONData/fighter_wins_graph.json';
import goatFighters from './JSONData/fighter_peak_elo_records.json'
import fighterPics from './JSONData/fighter_pics.json';
import fighter_id_name_map from './JSONData/fighter_id_name_map.json';

import './Styles/app.css'


//========================================================================================================
// INTERFACES
//========================================================================================================

interface HowToProps {
  opened: boolean;
  onClose: () => void;
}

interface AboutProps {
  opened: boolean;
  onClose: () => void;
}

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

interface FighterPathDetailsProps {
  path: FighterWin[];
}

interface ChartAreaProps
{
  pathDetails: FighterWin[];
}

interface FighterWin
{
  Name: string,
  Opponent: string,
  OpponentId: string,
  Date: string,
  Method: string,
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

const findShortestPathWithDetails = (graph: { [key: string]: FighterWin[] }, startFighterId: string, targetFighterId: string): FighterWin[] | null => {
  if (!graph[startFighterId] || !graph[targetFighterId]) {
    return null;
  }

  const queue: { path: FighterWin[], lastFighterId: string }[] = [{ path: [], lastFighterId: startFighterId }];
  const visited: Set<string> = new Set([startFighterId]);

  while (queue.length > 0) {
    const { path, lastFighterId } = queue.shift()!;
    
    if (lastFighterId === targetFighterId) {
      return path;
    }

    for (const win of graph[lastFighterId]) {
      const neighborId = win.OpponentId;
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        const newPath = [...path, win];
        queue.push({ path: newPath, lastFighterId: neighborId });
      }
    }
  }

  return null;
};

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

const HowTo = (props: HowToProps) => {
  return (
    <>
    <Modal opened={props.opened} onClose={props.onClose} title="How To">
    <Text size='xs'>
        <p className="paragraph-text">
          Search for and select a fighter in the "Starting Fighter" form. Make sure they have at least one win in the UFC. Search for and select another fighter in the "Ending Fighter" form. Make sure they are the same gender as the start fighter. Click "Find Path". The starting fighter will be connected to a fighter that they defeated, then the same will be repeated for that fighter until the end fighter is reached.
        </p>
      </Text>
    </Modal>
    </>
  )
}

const About = (props: AboutProps) => {
  return (
    <>
    <Modal opened={props.opened} onClose={props.onClose} title="About">
      <Text size='xs'>
        <p className="paragraph-text">
          We should know that MMA math doesn't work in real life. Fighting ability isn't a one-dimensional trait and wins are non-transitive. Styles make fights and we've seen scenarios like Ronda Rousey beating Misha Tate, Holly Holm defeating Ronda Rousey, and Misha Tate beating Holly Holm. Outside of MMA you see the same phenomenon with starter Pokemon and rock-paper-scissors.
        </p>
        <p className="paragraph-text">
          But because I consistently still see this type of logic in MMA forums, this project takes the idea of MMA math to its furthest extent to show how absurd it can be. Here you can find the win paths between any two given fighters to justify why one would beat the other.
        </p>
      </Text>
    </Modal>
    </>
  )
}

const Intro = () => {
  return (
    <>
      <Text size='xs'>
        <p className="paragraph-text">
          We should know that MMA math doesn't work in real life. Fighting ability isn't a one-dimensional trait and wins are non-transitive. Styles make fights and we've seen scenarios like Ronda Rousey beating Misha Tate, Holly Holm defeating Ronda Rousey, and Misha Tate beating Holly Holm. Outside of MMA you see the same phenomenon with starter Pokemon and rock-paper-scissors.
        </p>
        <p className="paragraph-text">
          But because I consistently still see this type of logic in MMA forums, this project takes the idea of MMA math to its furthest extent to show how absurd it can be. Here you can find the win paths between any two given fighters to justify why one would beat the other.
        </p>
      </Text>
    </>
  );
}

const CollapseDivider = (props: CollapseDividerProps) => {
  return (
    <div className="divider">
      <div className="divider-line">
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
    <div className="autocomplete">
      <Autocomplete
          label={props.label}
          placeholder="Search..."
          data={props.data}
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
    className="autocomplete" >
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

const FighterPathDetails = (props: FighterPathDetailsProps) => {

  const defaultPicUrl = "https://dmxg5wxfqgb4u.cloudfront.net/styles/teaser/s3/image/fighter_images/ComingSoon/comingsoon_headshot_odopod.png?VersionId=6Lx8ImOpYf0wBYQKs_FGYIkuSIfTN0f0\u0026amp;itok=pYDOjN8k";

  return (
    <>
    <div className="scrollable-container-col">
      {props.path.map(win => {
        const winner = win.Name;
        const loser = win.Opponent;
        const date = new Date(win.Date);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        const method = win.Method;

        const winnerPicUrl = fighterPics.find(f => f.Name === winner)?.PicURL || defaultPicUrl;
        const loserPicUrl = fighterPics.find(f => f.Name === loser)?.PicURL || defaultPicUrl;

        return (
          <>
          <div className="win-detail-col">
            <div className="win-detail-row">
              <div className="fighter-detail">
                <img src={winnerPicUrl} alt={winner} className="fighter-img" />
                <div className="fighter-name">{winner}</div>
              </div>
              <div style={{ margin: '0 1em' }}>defeated</div>
              <div className="fighter-detail">
                <img src={loserPicUrl} alt={loser} className="fighter-img" />
                <div className="fighter-name">{loser}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.6em' }}>on {formattedDate} via {method}</div>
          </div>
          </>
        );
      })}
    </div>
    </>
  )
}

const ChartArea = (props: ChartAreaProps) => {
  return (
    <>
    <div className="fade-in" key={JSON.stringify(props.pathDetails)}>
      <FighterPathDetails path={props.pathDetails} />
    </div>
    </>
  )
}

//========================================================================================================
// LARGER COMPONENTS
//========================================================================================================

const AppHeader = () => {
  const [howToOpened, { open: openHowTo, close: closeHowTo }] = useDisclosure(false);
  const [aboutOpened, { open: openAbout, close: closeAbout }] = useDisclosure(false);

  return (
    <>
    <Title order={1}>MMA Math</Title>
    <div className="header-container" style={{ display: 'flex' }}>
      <div className="header-div" onClick={() => openHowTo()}>
        How To
      </div>
      <div className="header-div" onClick={() => openAbout()}>
        About
      </div>
    </div>
    <HowTo opened={howToOpened} onClose={closeHowTo} />
    <About opened={aboutOpened} onClose={closeAbout} />
    </>
  )
}

const FighterPath = () => {
  const [startingFighterId, setStartingFighterId] = useState<string>(""); 
  const [endingFighterId, setEndingFighterId] = useState<string>(""); 
  const [fighterPathWithDetails, setFighterPathWithDetails] = useState<FighterWin[] | null>(null);
  const [opened, { toggle }] = useDisclosure(true);

  const fighterKeys = Object.keys(fighter_id_name_map);
  const fighterNames = mapFighterIdsToNames(fighterKeys).sort();

  const handleFindPath = () => {
    let pathWithDetails = findShortestPathWithDetails(fighterWinsGraph, startingFighterId, endingFighterId);
    setFighterPathWithDetails(pathWithDetails)
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
        {fighterPathWithDetails && (
          <ChartArea pathDetails={fighterPathWithDetails} />
        )}
      </Collapse>
    </div>
    </>
  );
}

const GoatPaths = () => {
  const [startFighterId, setStartFighterId] = useState<string>(""); 
  const [goats, setGoats] = useState<string[]>([]);
  const [endFighterId, setEndFighterId] = useState<string>("");
  const [pathDetails, setPathDetails] = useState<FighterWin[] | null>(null)
  const [opened, { toggle }] = useDisclosure(false);

  const fighterKeys = Object.keys(fighter_id_name_map);
  const fighterNames = mapFighterIdsToNames(fighterKeys).sort();

  const handleFighterSelected = (fighterName: string) => { 
    let fighterId = "";
    let goatsToCompare: string[] = [];
    
    if (fighterName !== "") {
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
      if (pathsLeft === 0) { break; }
    }
  
    return retList;
  }

  const handleFindPath = () => {
    let pathDetails = findShortestPathWithDetails(fighterWinsGraph, startFighterId, endFighterId);
    setPathDetails(pathDetails);
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
        {pathDetails && (
          <ChartArea pathDetails={pathDetails} />
        )}
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
      {/* <div style={{ padding: '3rem 2rem', overflowX: 'hidden', maxWidth: '1500px' }}> */}
      <div className="app-wrapper">
        <AppHeader />
        <FighterPath />
        <GoatPaths />
      </div>
    </MantineProvider>
  );
}

export default App;
