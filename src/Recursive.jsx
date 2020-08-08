import React, { Component } from "react";
import * as RJD from "react-js-diagrams";
import job from "./response1.json";
import "./style.scss";
import htmlToImage from "html-to-image";
import $ from "jquery";

class Recursive extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [...job],
    };
    // Setup the diagram engine
    this.engine = new RJD.DiagramEngine();
    this.engine.registerNodeFactory(new RJD.DefaultNodeFactory());
    this.engine.registerLinkFactory(new RJD.DefaultLinkFactory());

    // Setup the diagram model
    this.model = new RJD.DiagramModel();
  }

  testSerialization() {
    const { engine, model } = this;

    // We need this to help the system know what models to create form the JSON
    engine.registerInstanceFactory(new RJD.DefaultNodeInstanceFactory());
    engine.registerInstanceFactory(new RJD.DefaultPortInstanceFactory());
    engine.registerInstanceFactory(new RJD.LinkInstanceFactory());

    // Serialize the model
    const str = JSON.stringify(model.serializeDiagram());

    // Deserialize the model
    const model2 = new RJD.DiagramModel();
    model2.deSerializeDiagram(JSON.parse(str), engine);
    engine.setDiagramModel(model2);
  }

  toPng() {
    htmlToImage
      .toJpeg(document.getElementsByClassName("react-js-diagrams-canvas")[0], {
        quality: 0.9,
        backgroundColor: "#ffffff",
      })
      .then(function (dataUrl) {
        var link = document.createElement("a");
        link.download = "my-image-name.jpeg";
        link.href = dataUrl;
        link.click();
      });
  }

  createNode(options) {
    const { name, color, x, y } = options;
    var node = new RJD.DefaultNodeModel(name, color);
    node.x = x;
    node.y = y;
    return node;
  }

  createPort(node, options) {
    const { isInput, id, name } = options;
    return node.addPort(new RJD.DefaultPortModel(isInput, id, name));
  }

  linkNodes(b1c1, b2c1) {
    const link = new RJD.LinkModel();
    link.setSourcePort(b1c1);
    link.setTargetPort(b2c1);
    return link;
  }

  componentDidMount() {
    setTimeout(() => {
      this.testSerialization();
    }, 1000);
    this.toPng();
    $.ajax({
      url:
        "https://vespulatestcloud-rachel.azurewebsites.net/.auth/customAuth/login",
      data:
        "{'userName':'putuchon.vongvorakul@trinity.ox.ac.uk','password': 'PasswordPV'}",
      type: "POST",
      crossDomain: true,
      contentType: "application/json",
      dataType: "json",
      headers: {
        "ZUMO-API-VERSION": "2.0.0",
      },
    }).then((res) => console.log(res));
  }

  assignLevel(allBoards, board, parentLevel) {
    //Assign level
    board.level = parentLevel + 1;
    //Loop through board's circuits
    board.circuits.forEach((circuit) => {
      //find the child board of this circuit
      let childBoard = allBoards.find(
        (x) => x.boardCircuitSupplySource === circuit.circuitID
      );
      //find the child board of this circuit
      let childBoards = allBoards.filter(
        (x) => x.boardCircuitSupplySource === circuit.circuitID
      );

      //call function again if child board exist
      if (childBoards.length > 0) {
        childBoards.forEach((childBoard) => {
          childBoard.mainBoard = board.mainBoard;
          this.assignLevel(allBoards, childBoard, board.level);
        });
      } else {
        //eliminate the unlinked circuit
        board.circuits = board.circuits.filter(
          (item) => item.circuitID !== circuit.circuitID
        );
      }
    });
    //sort circuits
    board.circuits.sort((a, b) => a.circuitNo - b.circuitNo);
  }

  calNodeHeight(allBoards, board) {
    if (board.circuits.length === 0) {
      board.boardHeight = 16 + 22 + 4 + 5;
      return board.boardHeight;
    } else {
      let sum = 0;
      board.circuits.forEach((circuit) => {
        //find the child board of this circuit
        let childBoards = allBoards.filter(
          (x) => x.boardCircuitSupplySource === circuit.circuitID
        );
        if (childBoards.length > 0) {
          childBoards.forEach((childBoard) => {
            sum = sum + this.calNodeHeight(allBoards, childBoard);
          });
        }
      });
      board.boardHeight = sum;
      return board.boardHeight;
    }
  }

  putBoardsInPosition(allBoards, firstLevelBoard) {
    let queue = [];
    let arr = [[], [], [], [], [], [], []];
    queue.push(firstLevelBoard);
    while (queue.length !== 0) {
      let board = queue.shift();
      arr[board.level - 1].push(board);

      board.circuits.forEach((circuit) => {
        //find the child boards of this circuit
        let childBoards = allBoards.filter(
          (x) => x.boardCircuitSupplySource === circuit.circuitID
        );
        childBoards.forEach((item) => {
          queue.push(item);
        });
      });
    }
    return arr;
  }

  createNodesAndPorts(container, preH, supplyPorts, circuitPorts, model) {
    container.map((item) => {
      let boards = [];
      let previousHeight = preH;
      item.map((x) => {
        let posX = 100 + (x.level - 1) * 500;
        // Create Boards
        let board = this.createNode({
          name: x.boardName,
          color: "rgb(146, 146, 146)",
          x: posX,
          y: previousHeight,
        });
        //assign new y axis position for the next board
        previousHeight +=
          (x.circuits.length ? x.circuits.length : 1) * 16 + 22 + 4 + 25;
        //create port
        let supplyPort = this.createPort(board, {
          isInput: true,
          id: `in-i`,
          name: x.boardSupplyType === "2" ? "MS" : "Supply",
        });
        supplyPorts.push({
          boardID: x.boardID,
          supplyPort,
        });

        let ports = [];
        x.circuits.map((circuit, i) => {
          let port = this.createPort(board, {
            isInput: false,
            id: `out-${i + 1}`,
            name: `${circuit.circuitNo}${circuit.circuitPhase ?? ""}`,
          });

          ports.push({
            circuitId: circuit.circuitID,
            port,
          });
          return true;
        });
        circuitPorts.push({
          boardID: x.boardID,
          circuits: ports,
        });

        boards.push(board);
        return true;
      });
      boards.map((board) => {
        model.addNode(board);
        return true;
      });
      return true;
    });
  }

  render() {
    const { engine, model } = this;

    let allBoards = [...this.state.data];
    let allCircuits = [];
    allBoards.forEach((item) => {
      allCircuits.push(...item.circuits);
    });
    //Find all level 1 boards
    let firstLevelBoards = this.state.data.filter(
      (item) => item.boardSupplyType === "2"
    );

    //each position in containerArray contains 2DArrayPosition for a group of boards supplied from a main board
    let containerArray = [];
    firstLevelBoards.forEach((item) => {
      this.assignLevel(allBoards, item, 0);
      this.calNodeHeight(allBoards, item);
      containerArray.push(this.putBoardsInPosition(allBoards, item));
      return;
    });

    let supplyPorts = [];
    let circuitPorts = [];
    let preH = 100;
    containerArray.map((item) => {
      this.createNodesAndPorts(item, preH, supplyPorts, circuitPorts, model);
      preH += item[0][0].boardHeight + 25;
      return true;
    });

    allBoards.map((b) => {
      if (b.boardSupplyType === "3") {
        let supplyBoard = circuitPorts.find(
          (e) => e.boardID === b.boardSupplySource
        );
        let suppliedBoard = supplyPorts.find((e) => e.boardID === b.boardID);
        let supplyCircuit = supplyBoard.circuits.find(
          (e) => e.circuitId === b.boardCircuitSupplySource
        );
        if (suppliedBoard) {
          model.addLink(
            this.linkNodes(supplyCircuit.port, suppliedBoard.supplyPort)
          );
        }
      }
      return true;
    });
    // Load the model into the diagram engine
    engine.setDiagramModel(model);
    // Render the canvas
    return (
      <>
        <RJD.DiagramWidget
          diagramEngine={engine}
          actions={{
            moveItems: false,
            selectItems: false,
            canvasDrag: false,
            multiselectDrag: false,
          }}
        />
      </>
    );
  }
}

export default Recursive;
