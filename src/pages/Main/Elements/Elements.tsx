import { Button, List, Typography } from "antd";
import React from "react";
import { treeDataElements } from "../../../components/TemplateTree/treeDataElements";

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
