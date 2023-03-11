import { Button } from "antd";
import React, { useEffect, useState } from "react";
import { generate } from "../../api/main";
import TemplateTree from "../../components/TemplateTree/TemplateTree";
import { TemplateTree as TemplateTreeType } from "../../types";
import { treeData } from "./treeData";

const Home = () => {
  const [templateTree, setTemplateTree] = useState<TemplateTreeType[]>([]);

  const getTree = () => {
    setTemplateTree(treeData);
  };

  useEffect(() => {
    getTree();
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
