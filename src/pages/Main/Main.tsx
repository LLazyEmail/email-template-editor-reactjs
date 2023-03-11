import { Button } from "antd";
import React, { useEffect, useState } from "react";
import { getTree, generate } from "../../api/main";
import TemplateTree from "../../components/TemplateTree/TemplateTree";
import { TemplateTree as TemplateTreeType } from "../../types";

const Home = () => {
  const [templateTree, setTemplateTree] = useState<TemplateTreeType[]>([]);

  console.log("templateTree", templateTree);

  const getTreeData = () => {
    getTree().then((data) => {
      setTemplateTree(data);
    });
  };

  useEffect(() => {
    console.log("call");

    getTreeData();
  }, []);

  const onHandleGenerate = () => {
    generate({ treeData: templateTree });
  };

  return (
    <>
      <div>
        <Button onClick={onHandleGenerate} type="primary">
          Generate
        </Button>
      </div>
      <div>
        <TemplateTree treeData={templateTree} />
      </div>
    </>
  );
};

export default Home;
