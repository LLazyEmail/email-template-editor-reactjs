import type { DataNode, TreeProps } from "antd/es/tree";
import { TemplateTree } from "../../types";

// type M = DataNode & {value: string};

// interface TemplateTreeDataNode extends DataNode {
//   value: string;
//   children: DataNode["children"] & [{ value: string }];
// }

export const treeData: TemplateTree[] = [
  {
    title: "root",
    key: "0-0",
    value: `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Document</title>
        </head>
        <body>
          <div>{{items}}</div>
        </body>
      </html>`,
    children: [
      {
        title: "{{items}}",
        key: "0-0-0",
        value: `{{oneBlock}}
          {{twoBlocks}}
          {{anotherBlock}}`,
        children: [
          {
            title: "{{oneBlock}}",
            value: `<div><img src="https://raw.githubusercontent.com/LLazyEmail/nomoretogo_email_template/main/data/images/logo.jpeg" id="logoBlock-4" border="0" alt="" width="560" style="display: block;"></div>`,
            key: "0-0-0-0",
            children: [],
          },
          {
            title: "{{twoBlocks}}",
            value: `<div>
              <div>first block</div>
              <div>second block</div>
              </div>`,
            key: "0-0-0-1",
            children: [],
          },
          {
            key: "0-0-0-2",
            title: "{{anotherBlock}}",
            value: "{{href}}{{text}}{{image}}",
            children: [
              {
                key: "0-0-0-0-0",
                title: "{{href}}",
                value: "https://example.com",
              },
            ],
          },
        ],
      },
    ],
  },
];
