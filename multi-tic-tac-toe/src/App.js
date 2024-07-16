import React, { useState, useEffect } from "react";
import "./App.css";
import Square from "./Square/Square";
import { io } from "socket.io-client";
import Swal from "sweetalert2";

const renderFrom = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

const App = () => {
  const [gameState, setGameState] = useState(renderFrom);
  const [currentPlayer, setCurrentPlayer] = useState("circle");
  const [gameOver, setGameOver] = useState(false);
  const [finishedState, setFinishedState] = useState([]);
  const [playOnline, setPlayOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [opponentName, setOpponentName] = useState(null);
  const [playingAs, setPlayingAs] = useState(null);

  const checkWinner = () => {
    //row wise check
    for (let r = 0; r < 3; r++) {
      if (
        gameState[r][0] === gameState[r][1] &&
        gameState[r][1] === gameState[r][2]
      ) {
        setFinishedState([r * 3 + 0, r * 3 + 1, r * 3 + 2]);
        return gameState[r][0];
      }
    }

    //column wise check
    for (let c = 0; c < 3; c++) {
      if (
        gameState[0][c] === gameState[1][c] &&
        gameState[1][c] === gameState[2][c]
      ) {
        setFinishedState([0 * 3 + c, 1 * 3 + c, 2 * 3 + c]);
        return gameState[0][c];
      }
    }

    if (
      gameState[0][0] === gameState[1][1] &&
      gameState[1][1] === gameState[2][2]
    ) {
      setFinishedState([0, 4, 8]);
      return gameState[0][0];
    }

    if (
      gameState[2][0] === gameState[1][1] &&
      gameState[1][1] === gameState[0][2]
    ) {
      setFinishedState([2, 4, 6]);
      return gameState[1][1];
    }

    const isDrawMatch = gameState.flat().every((e) => {
      if (e === "circle" || e === "cross") {
        return true;
      }
    });
    if (isDrawMatch) return "draw";
    return null;
  };

  useEffect(() => {
    const winner = checkWinner();
    if (winner) {
      console.log(winner);
      setGameOver(winner);
    }
  }, [gameState]);

  const takePlayerName = async () => {
    const result = await Swal.fire({
      title: "Enter your name",
      input: "text",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      },
    });

    return result;
  };

  socket?.on("opponentLeftMatch", () => {
    setFinishedState("opponentLeftMatch");
  });

  socket?.on("playerMoveFromServer", (data) => {
    console.log(data);
    const id = data.state.id;
    setGameState((previousState) => {
      let newState = [...previousState];
      const row = Math.floor(id / 3);
      const col = id % 3;
      newState[row][col] = data.state.sign;
      return newState;
    });
    console.log(gameState);
    setCurrentPlayer(data.state.sign === "circle" ? "cross" : "circle");
  });

  socket?.on("connect", function () {
    setPlayOnline(true);
  });

  socket?.on("OpponentNotFound", function () {
    setOpponentName(false);
  });

  socket?.on("OpponentFound", function (data) {
    console.log(data.playingAs);
    setPlayingAs(data.playingAs);
    setOpponentName(data.opponentName);
    //console.log(currentPlayer+" "+playingAs+" "+playerName);
  });

  socket?.on("opponentLeftMatch", () => {
    setGameOver("opponentLeftMatch");
  });

  async function playOnlineClick() {
    const result = await takePlayerName();
    if (result.isConfirmed === false) {
      return;
    }
    const username = result.value;
    setPlayerName(username);
    const newSocket = io("http://localhost:4000", {
      autoConnect: true,
    });
    newSocket?.emit("request_to_play", {
      playerName: username,
    });
    setSocket(newSocket);
  }

  if (!playOnline) {
    return (
      <div className="main-div">
        <button onClick={playOnlineClick} className="play-online">
          Play Online
        </button>
      </div>
    );
  }

  if (playOnline && !opponentName) {
    return (
      <div className="waiting">
        <h2>Waiting for opponent . . .</h2>
      </div>
    );
  }

  return (
    <div className="main-div">
      <div className="move-detector">
        <div
          className={`left ${
            currentPlayer === playingAs ? "color-" + currentPlayer : ""
          }`}
        >
          {playerName}
        </div>
        <div
          className={`right ${
            currentPlayer !== playingAs ? "color-" + currentPlayer : ""
          }`}
        >
          {opponentName}
        </div>
      </div>
      <h1 className="game-heading water-background">Tic Tac Toe</h1>
      <div className="square-wrapper">
        {gameState.map((arr, rowIndex) =>
          arr.map((e, colIndex) => {
            return (
              <Square
                gameOver={gameOver}
                currentPlayer={currentPlayer}
                socket={socket}
                playingAs={playingAs}
                gameState={gameState}
                setCurrentPlayer={setCurrentPlayer}
                key={rowIndex * 3 + colIndex}
                id={rowIndex * 3 + colIndex}
                setGameState={setGameState}
                finishedState={finishedState}
                currentElement={e}
              />
            );
          })
        )}
      </div>
      {gameOver && gameOver !== "draw" && gameOver !== "opponentLeftMatch" && (
        <h3 className="finishedState">Winner is {gameOver}</h3>
      )}
      {gameOver && gameOver === "draw" && gameOver !== "opponentLeftMatch"  && (
        <h3 className="finishedState">Well played! It's a draw</h3>
      )}
      {!gameOver && opponentName && (
        <h2>You are playing against {opponentName}</h2>
      )}
      {gameOver && gameOver === "opponentLeftMatch" && (
        <h2>You won the match, Opponent has left</h2>
      )}
    </div>
  );
};

export default App;
