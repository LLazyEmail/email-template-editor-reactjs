import { Button, List, Typography } from "antd";
import React from "react";

// const data = ["{{blockWithTwoImages}}", "{{blockWithButton}}"];

// {
    //     key: new Date().toISOString(),
    //     title: "{{src}}",
    //     value: "http://example.com",
    //     children: [],
    //   },
const treeDataElements = [
  {
    key: new Date().toISOString(),
    title: "{{blockWithTwoImages}}",
    value: "<div>{{src}}this is block with two images</div>",
    children: [],
  },
];

const Elements = () => {
  return (
    <>
      <Typography.Title level={3}>Elements</Typography.Title>
      <List
        header={<Button type="primary">Add element</Button>}
        bordered
        dataSource={treeDataElements}
        renderItem={(item) => (
          <List.Item actions={[<a key="list-loadmore-edit">edit</a>]}>
            {item.title}
          </List.Item>
        )}
      />
    </>
  );
};

export default Elements;