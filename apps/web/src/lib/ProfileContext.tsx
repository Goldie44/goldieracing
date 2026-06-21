import { createContext, useContext, useState, type ReactNode } from "react";

const TEAM_KEY = "goldie-racing:team-name";
const SEASON_KEY = "goldie-racing:season";

type ProfileContextValue = {
  teamName: string;
  setTeamName: (name: string) => void;
  season: string;
  setSeason: (s: string) => void;
};

const ProfileContext = createContext<ProfileContextValue>(null!);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [teamName, setTeamNameState] = useState(() =>
    localStorage.getItem(TEAM_KEY) ?? "Goldie Racing"
  );
  const [season, setSeasonState] = useState(() =>
    localStorage.getItem(SEASON_KEY) ?? "2023"
  );

  const setTeamName = (name: string) => {
    setTeamNameState(name);
    try { localStorage.setItem(TEAM_KEY, name); } catch {}
  };
  const setSeason = (s: string) => {
    setSeasonState(s);
    try { localStorage.setItem(SEASON_KEY, s); } catch {}
  };

  return (
    <ProfileContext.Provider value={{ teamName, setTeamName, season, setSeason }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
