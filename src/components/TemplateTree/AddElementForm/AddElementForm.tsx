import React, { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Select } from "antd";
import { AddElementFormProps } from "./AddElementForm.types";
import { getAllElements } from "../../../api/main";
import { Element } from "../../../api/main.types";

const { TextArea } = Input;

const { Option } = Select;

const options = [
  { value: "jack", label: "Jack" },
  { value: "lucy", label: "Lucy" },
  { value: "Yiminghe", label: "yiminghe" },
  { value: "disabled", label: "Disabled", disabled: true },
];

const getArrayOfReplacement = (str: string) => {
  const regexp = /{{[A-Za-z0-9]{0,}}}/g;
  const result = str.match(regexp);
  console.log("result", result);

  return result ?? [];
};

const AddElementForm = ({ onCancel, onSubmit, data }: AddElementFormProps) => {
  const [form] = Form.useForm();
  const elementKey = Form.useWatch("elementKey", form);
  const [elements, setElements] = useState<Element[]>([]);

  const onReset = () => {
    form.resetFields();
  };

  //   useEffect(() => {
  //     form.setFieldsValue(data);
  //   }, []);

  //   const onFill = () => {
  //     form.setFieldsValue({ note: "Hello world!", gender: "male" });
  //   };

  // const onTypeChange = (value: string) => {
  //   switch (value) {
  //     case "element":
  //       form.setFieldsValue({ note: "Hi, man!" });
  //       break;
  //     case "html":
  //       form.setFieldsValue({ note: "Hi, lady!" });
  //       break;
  //     default:
  //   }
  // };

  useEffect(() => {
    getAllElements().then((data) => {
      setElements(data);
    });
  }, []);

  const elementIdOptions = elements.map((element) => ({
    value: element.key,
    label: element.title,
  }));

  const arr = useMemo(() => {
    const foundElement = elements.find((elem) => elem.key === elementKey);

    return foundElement ? getArrayOfReplacement(foundElement.value) : [];
  }, [elementKey, elements]);

  useEffect(() => {
    const foundElement = elements.find((elem) => elem.key === elementKey);

    if (foundElement) {
      form.setFieldValue("title", foundElement?.title);
    }
  }, [elementKey, elements]);

  return (
    <Form
      //   {...layout}
      form={form}
      layout="vertical"
      name="control-hooks"
      onFinish={(values) =>
        onSubmit({
          values,
          currentItemKey: data.key,
          element:
            values.type === "element"
              ? elements.find((elem) => elem.key === elementKey)
              : null,
        })
      }
      style={{ maxWidth: 1000 }}
    >
      <Form.Item name="title" label="Title" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item name="type" label="Type" rules={[{ required: true }]}>
        <Select
          placeholder="Select a option and change input text above"
          // onChange={onTypeChange}
          allowClear
        >
          <Option value="element">Element</Option>
          <Option value="html">HTML</Option>
        </Select>
      </Form.Item>
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.type !== currentValues.type
        }
      >
        {({ getFieldValue }) => {
          // console.log("getFieldValue", getFieldValue("elementId"));

          return getFieldValue("type") === "html" ? (
            <Form.Item name="value" label="Value">
              <TextArea
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                showCount
                rows={8}
              />
            </Form.Item>
          ) : (
            <>
              <Form.Item
                name="elementKey"
                label="Element"
                rules={[{ required: true }]}
              >
                <Select
                  // onChange={handleChange}
                  options={elementIdOptions}
                />
              </Form.Item>

              {arr.map((item, index) => (
                <Form.Item
                  name={["children", item]}
                  label={item}
                  initialValue=""
                  // rules={[{ required: true }]}
                  key={index}
                >
                  <Input />
                </Form.Item>
              ))}
            </>
          );
        }}
      </Form.Item>

      <Form.Item style={{ display: "flex", justifyContent: "end" }}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
        <Button htmlType="button" onClick={onReset}>
          Reset
        </Button>
        {/* <Button type="link" htmlType="button" onClick={onFill}>
            Fill form
          </Button> */}
      </Form.Item>
    </Form>
  );
};

export default AddElementForm;
