import React, { Component } from "react";
import {
  Diagram,
  DiagramComponent,
  Inject,
  ConnectorModel,
  Node,
  DataBinding,
  HierarchicalTree,
  SnapConstraints,
  IExportOptions,
  TreeInfo,
  PrintAndExport,
  TextModel,
} from "@syncfusion/ej2-react-diagrams";
import { DataManager, Query } from "@syncfusion/ej2-data";
import { Button } from "react-bootstrap";

export interface SyncfusionProps {
  data: Object[];
  index: number;
  mainBoardName: String;
}

export interface SyncfusionState {}

export interface nodeData {
  Id: string;
  Role: string;
  Manager?: string;
  Type?: string;
  hasSubTree?: boolean;
}

export interface useNode extends Node {
  data: nodeData;
}

interface Syncfusion {
  diagram: any;
}

class Syncfusion extends React.Component<SyncfusionProps, SyncfusionState> {
  diagramInstance: any;

  export() {
    let options: IExportOptions = {};
    options.mode = "Download";
    options.margin = { left: 10, right: 10, top: 10, bottom: 10 };
    options.fileName = `${this.props.mainBoardName}`;
    options.format = "SVG";
    this.diagramInstance?.exportDiagram(options);
  }

  render() {
    let id = `diagram${this.props.index}`;
    return (
      <>
        <Button
          className="my-2 w-100"
          variant="secondary"
          onClick={() => this.export()}
        >
          Export {this.props.mainBoardName}
        </Button>
        <div
          style={{
            width: "100%",
            backgroundColor: "black",
            padding: 2,
          }}
        >
          <DiagramComponent
            ref={(diagram) => (this.diagramInstance = diagram)}
            id={id}
            width={"100%"}
            height={"500px"}
            backgroundColor="white"
            snapSettings={{
              constraints: 0,
            }}
            //Uses layout to auto-arrange nodes on the diagram page
            layout={{
              //Sets layout type
              type: "OrganizationalChart",
              horizontalAlignment: "Left",
              verticalAlignment: "Top",
              margin: { left: 10, right: 10, top: 10, bottom: 10 },
              getLayoutInfo: (node: useNode, options: TreeInfo) => {
                //   if (this.props.isMultiMSB && false) {
                //     if (options.hasSubTree) {
                //       options.type = "Right";
                //       options.orientation = "Horizontal";
                //       node.data["hasSubTree"] = true;
                //     } else {
                //       options.type = "Right";
                //       options.orientation = "Vertical";
                //     }
                //   } else {
                //     options.type = "Right";
                //     options.orientation = "Vertical";
                //   }
                options.type = "Right";
                options.orientation = "Vertical";
              },
            }}
            //Configures data source for diagram
            dataSourceSettings={{
              id: "Id",
              parentId: "Manager",
              dataManager: new DataManager(this.props.data as JSON[]),
            }}
            //Sets the default properties for nodes and connectors
            getNodeDefaults={(obj: useNode, diagram: Diagram) => {
              if (obj.data["Type"] === "Board") {
                obj.style.fill = "#FAC72E";
              } else {
                obj.style.fill = "#aaa";
              }
              if (obj.data["hasSubTree"]) {
                obj.width = 75;
              } else {
                obj.width = 150;
              }
              obj.height = 25;
              obj.borderColor = "black";
              obj.borderWidth = 2;
              obj.annotations = [
                {
                  content: obj.data["Role"],
                  style: {
                    color: "black",
                  },
                },
              ];
              return obj;
            }}
            getConnectorDefaults={(
              connector: ConnectorModel,
              diagram: Diagram
            ) => {
              connector.style = {
                strokeColor: "black",
                strokeWidth: 2,
              };
              if (connector.targetDecorator) {
                connector.targetDecorator.shape = "None";
                if (connector.targetDecorator.style) {
                  connector.targetDecorator.style.fill = "#6BA5D7";
                  connector.targetDecorator.style.strokeColor = "#6BA5D7";
                }
              }
              connector.type = "Orthogonal";
              return connector;
            }}
          >
            <Inject
              services={[DataBinding, HierarchicalTree, PrintAndExport]}
            />
          </DiagramComponent>
        </div>
      </>
    );
  }
}

export default Syncfusion;
