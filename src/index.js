import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import Syncfusion from "./testSync.tsx";
import job from "./response1.json";
import { Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

let firstLevelBoards = job.filter((item) => item.boardSupplyType === "2");

function groupBoardByMSB(allBoards, firstLevelBoard) {
  let queue = [];
  let arr = [];
  queue.push(firstLevelBoard);
  while (queue.length !== 0) {
    let board = queue.shift();
    arr.push(board);

    board.circuits.forEach((circuit) => {
      //find the child boards of this circuit
      let childBoards = allBoards.filter(
        (x) => x.boardCircuitSupplySource === circuit.circuitID
      );
      childBoards.forEach((item) => {
        if (item.statusCode === "A") {
          queue.push(item);
        }
      });
    });
  }
  return arr;
}

let containerArray = [];
firstLevelBoards.map((mainSupplyBoard) => {
  containerArray.push(groupBoardByMSB([...job], mainSupplyBoard));
});

function extractCircuitsFromBoards(boardsWithCircuits) {
  let circuits = [];
  let NoOfMSB = 0;
  boardsWithCircuits.map((board) => {
    board.Id = board.boardID;
    board.Role = board.boardName;
    board.Type = "Board";
    if (board.boardCircuitSupplySource) {
      if (board.isParentBoardHasOnlyOneCircuit) {
        board.Manager = board.boardSupplySource;
      } else {
        board.Manager = board.boardCircuitSupplySource;
      }
    } else {
      NoOfMSB++;
    }
    delete board.boardID;
    delete board.boardName;
    //sort circuits
    board.circuits.sort((a, b) => a.circuitNo - b.circuitNo);

    if (board.circuits.length == 1) {
      let circuit = board.circuits[0];
      let childBoards = boardsWithCircuits.filter(
        (x) => x.boardCircuitSupplySource === circuit.circuitID
      );
      if (childBoards) {
        childBoards.map((item) => {
          item.isParentBoardHasOnlyOneCircuit = true;
        });
      }
      // //eliminate that only circuit
      // board.circuits = board.circuits.filter(
      //   (item) => item.circuitID !== circuit.circuitID
      // );
    } else {
      board.circuits.map((circuit) => {
        //find the child boards of this circuit
        let childBoards = boardsWithCircuits.filter(
          (x) => x.boardCircuitSupplySource === circuit.circuitID
        );
        //call function again if child board exist
        if (childBoards.length > 0 && circuit.statusCode === "A") {
          circuit.Id = circuit.circuitID;
          circuit.Role = `${circuit.circuitNo}${circuit.circuitPhase ?? ""}`;
          circuit.Manager = board.Id;
          delete circuit.circuitID;
          delete circuit.circuitNo;
          delete circuit.circuitPhase;
          circuits.push(circuit);
        } else {
          //eliminate the unlinked circuit
          board.circuits = board.circuits.filter(
            (item) => item.circuitID !== circuit.circuitID
          );
        }
      });
    }

    if (board.circuits.length === 0) {
      board.IsLast = true;
    }
  });
  return {
    circuits,
    NoOfMSB,
  };
}

let GroupsOfNodes = [];

containerArray.map((group) => {
  let { circuits } = extractCircuitsFromBoards(group);
  GroupsOfNodes.push([...group, ...circuits]);
});

// console.log(allNodes);

ReactDOM.render(
  <Container style={{ maxWidth: "100%" }}>
    <Row style={{ width: "100%", margin: 0, padding: 0 }}>
      <Col style={{ width: "100%", margin: 0, padding: 0 }}>
        {GroupsOfNodes.map((nodes, index) => (
          <Row
            style={{
              backgroundColor: "white",
              margin: "20px",
              padding: "20px",
            }}
          >
            <Syncfusion
              data={nodes}
              index={index}
              mainBoardName={nodes[0].Role}
            />
          </Row>
        ))}
      </Col>
    </Row>
  </Container>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
