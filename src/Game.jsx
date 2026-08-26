import react from 'react';
import { useState, useEffect, useRef } from 'react';

const API_URL = "http://localhost:3000/graphql";

const Game = () => {
  const list = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  const [value, setValue] = useState("");
  const [Letter, setLetter] = useState("");
  const TOTAL_CHARS = 20;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finalTime, setFinalTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | playing | finished
  const [penaltyMsg, setPenaltyMsg] = useState(false); // shows "+0.5s"

  // --- leaderboard / my-scores state ---
  const [panel, setPanel] = useState(null); // null | "leaderboard" | "myScores"
  const [leaderboard, setLeaderboard] = useState([]);
  const [myScores, setMyScores] = useState([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState("");

  const startTimeRef = useRef(null);   // when the game started
  const penaltyRef = useRef(0);        // accumulated penalty in ms
  const intervalRef = useRef(null);    // interval id

  // Tick the timer while playing
  useEffect(() => {
    if (status === "playing") {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        setElapsed((now - startTimeRef.current + penaltyRef.current) / 1000);
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [status]);

  // Call this when the game starts
  const startGame = () => {
    penaltyRef.current = 0;
    startTimeRef.current = Date.now();
    setCurrentIndex(0);
    setValue("");
    setFinalTime(0);
    setElapsed(0);
    setPanel(null);
    getRandomLetter();
    setStatus("playing");
  };

  // Call this on every wrong keypress
  const applyPenalty = () => {
    penaltyRef.current += 500; // 0.5s penalty
    setPenaltyMsg(true);
    setTimeout(() => setPenaltyMsg(false), 500);
  };

  const getRandomLetter = () => {
    setLetter(list[Math.floor(Math.random() * 26)]);
  };

  async function submitScore(finalTimeSeconds) {
    const token = localStorage.getItem("authToken");
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `mutation($v:Int!){ submitScore(value:$v){ id value } }`,
        variables: { v: Math.round(finalTimeSeconds * 1000) },
      }),
    });
  }

  // Fetch the top players, fastest time first.
  async function fetchLeaderboard() {
    setPanel("leaderboard");
    setPanelLoading(true);
    setPanelError("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query { leaderboard(limit: 10) { bestValue user { username } } }`,
        }),
      });
      const { data, errors } = await res.json();
      if (errors && errors.length > 0) {
        setPanelError(errors[0].message);
        return;
      }
      setLeaderboard(data.leaderboard);
    } catch (err) {
      setPanelError("Could not reach the server.");
    } finally {
      setPanelLoading(false);
    }
  }

  // Fetch the logged-in player's own past runs, fastest first.
  async function fetchMyScores() {
    setPanel("myScores");
    setPanelLoading(true);
    setPanelError("");
    const token = localStorage.getItem("authToken");
    if (!token) {
      setPanelError("Log in to see your scores.");
      setPanelLoading(false);
      return;
    }
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `query { myScores { id value createdAt } }`,
        }),
      });
      const { data, errors } = await res.json();
      if (errors && errors.length > 0) {
        setPanelError(errors[0].message);
        return;
      }
      setMyScores(data.myScores);
    } catch (err) {
      setPanelError("Could not reach the server.");
    } finally {
      setPanelLoading(false);
    }
  }

  const Handler = (num) => {
    if (status !== "playing") return; // ignore keys unless a game is running

    setValue(String(num));

    if (num === Letter) {
      if (currentIndex + 1 >= TOTAL_CHARS) {
        // 20th correct letter — game over
        const now = Date.now();
        const total = (now - startTimeRef.current + penaltyRef.current) / 1000;
        setFinalTime(total);
        setCurrentIndex(currentIndex + 1);
        setStatus("finished");
        submitScore(total);
      } else {
        setCurrentIndex((i) => i + 1);
        getRandomLetter();
      }
    } else {
      applyPenalty();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const allowedKeys = list;
      if (allowedKeys.includes(event.key) || allowedKeys.includes(event.key.toUpperCase())) {
        Handler(event.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, Letter, currentIndex]);

  return (
    <div style={styles.container}>
      <span style={styles.timer}>{elapsed.toFixed(1)}s</span>

      {status === "idle" && (
        <div style={styles.center}>
          <button style={styles.button} onClick={startGame}>Start</button>
          <div style={styles.panelToggleRow}>
            <button style={styles.linkButton} onClick={fetchLeaderboard}>Leaderboard</button>
            <button style={styles.linkButton} onClick={fetchMyScores}>My Scores</button>
          </div>
        </div>
      )}

      {status === "playing" && (
        <div style={styles.center}>
          <p style={styles.letter}>{Letter}</p>
          <p style={styles.counter}>{currentIndex} / {TOTAL_CHARS}</p>
          {penaltyMsg && <p style={styles.penalty}>+0.5s</p>}
        </div>
      )}

      {status === "finished" && (
        <div style={styles.center}>
          <p style={styles.finalTime}>Final time: {finalTime.toFixed(1)}s</p>
          <button style={styles.button} onClick={startGame}>Start</button>
          <div style={styles.panelToggleRow}>
            <button style={styles.linkButton} onClick={fetchLeaderboard}>Leaderboard</button>
            <button style={styles.linkButton} onClick={fetchMyScores}>My Scores</button>
          </div>
        </div>
      )}

      {panel && (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>
              {panel === "leaderboard" ? "Leaderboard" : "My Scores"}
            </h3>
            <button style={styles.closeButton} onClick={() => setPanel(null)}>×</button>
          </div>

          {panelLoading && <p style={styles.panelMsg}>Loading...</p>}
          {panelError && <p style={styles.panelError}>{panelError}</p>}

          {!panelLoading && !panelError && panel === "leaderboard" && (
            leaderboard.length === 0 ? (
              <p style={styles.panelMsg}>No scores yet.</p>
            ) : (
              <ol style={styles.list}>
                {leaderboard.map((entry, i) => (
                  <li key={i} style={styles.listItem}>
                    <span>{entry.user.username}</span>
                    <span>{(entry.bestValue / 1000).toFixed(1)}s</span>
                  </li>
                ))}
              </ol>
            )
          )}

          {!panelLoading && !panelError && panel === "myScores" && (
            myScores.length === 0 ? (
              <p style={styles.panelMsg}>No scores yet — play a round!</p>
            ) : (
              <ol style={styles.list}>
                {myScores.map((s) => (
                  <li key={s.id} style={styles.listItem}>
                    <span>{(s.value / 1000).toFixed(1)}s</span>
                    <span style={styles.listItemDate}>
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ol>
            )
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "sans-serif",
    background: "#f5f5f5",
    position: "relative",
  },
  timer: {
    position: "absolute",
    top: 20,
    right: 20,
    fontSize: 18,
    fontWeight: "bold",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  letter: {
    fontSize: 80,
    fontWeight: "bold",
    margin: 0,
  },
  counter: {
    fontSize: 16,
    color: "#555",
    margin: 0,
  },
  penalty: {
    fontSize: 18,
    color: "red",
    fontWeight: "bold",
    margin: 0,
  },
  finalTime: {
    fontSize: 24,
    fontWeight: "bold",
  },
  button: {
    fontSize: 16,
    padding: "10px 24px",
    border: "none",
    borderRadius: 6,
    background: "#333",
    color: "#fff",
    cursor: "pointer",
  },
  panelToggleRow: {
    display: "flex",
    gap: 16,
    marginTop: 4,
  },
  linkButton: {
    fontSize: 13,
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#555",
    textDecoration: "underline",
    cursor: "pointer",
  },
  panel: {
    marginTop: 28,
    width: 280,
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
    padding: "16px 18px",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: 700,
    margin: 0,
    color: "#111827",
  },
  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: 18,
    lineHeight: 1,
    cursor: "pointer",
    color: "#6b7280",
  },
  panelMsg: {
    fontSize: 13,
    color: "#6b7280",
    margin: "8px 0",
  },
  panelError: {
    fontSize: 13,
    color: "#dc2626",
    margin: "8px 0",
  },
  list: {
    listStyle: "decimal",
    margin: 0,
    paddingLeft: 18,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    color: "#111827",
  },
  listItemDate: {
    color: "#9ca3af",
  },
};

export default Game;