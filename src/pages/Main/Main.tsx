import { Button, Modal } from "antd";
import React, { useEffect, useState } from "react";
import { saveTree, getTree, generate } from "../../api/main";
import { SaveTree } from "../../api/main.types";
import TemplateTree from "../../components/TemplateTree/TemplateTree";
import { TemplateTree as TemplateTreeType } from "../../types";
import AddRootElementForm from "./AddRootElementForm/AddRootElementForm";

const Home = () => {
  const [templateTree, setTemplateTree] = useState<TemplateTreeType[]>([]);

  console.log("templateTree", templateTree);

  const getTreeData = () => {
    getTree().then((data) => {
      setTemplateTree(data);
    });
  };

  useEffect(() => {
    getTreeData();
  }, []);

  const onHandleGenerate = () => {
    generate({ treeData: templateTree });
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const onSubmit = (values: any) => {
    console.log("values", values);
    const root: SaveTree["treeData"] = [
      { title: "root", key: "1", value: values.value, children: [] },
    ];

    saveTree({ treeData: root }).then(() => {
      setIsModalOpen(false);
      getTreeData()
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div>
        <Button
          disabled={Boolean(templateTree.length)}
          onClick={showModal}
          type="primary"
        >
          Add root element
        </Button>
        <Button onClick={onHandleGenerate} type="primary">
          Generate
        </Button>
      </div>
      <Modal
        title="Add root element"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={1000}
      >
        <AddRootElementForm onSubmit={onSubmit} onCancel={handleCancel} />
      </Modal>
      <div>
        <TemplateTree treeData={templateTree} />
      </div>
    </>
  );
};

export default Home;
