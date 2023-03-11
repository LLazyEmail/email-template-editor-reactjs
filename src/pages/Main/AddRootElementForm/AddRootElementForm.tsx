import React from "react";
import { Button, Form, Input } from "antd";
import { AddRootElementFormProps } from "./AddRootElementForm.types";

const { TextArea } = Input;

// const layout = {
//   labelCol: { span: 8 },
//   wrapperCol: { span: 16 },
// };

// const tailLayout = {
//   wrapperCol: { offset: 8, span: 16 },
// };

const AddRootElementForm = ({
  onSubmit,
  onCancel,
}: AddRootElementFormProps) => {
  const [form] = Form.useForm();

  const onReset = () => {
    form.resetFields();
  };

  //   const onFill = () => {
  //     form.setFieldsValue({ note: "Hello world!", gender: "male" });
  //   };

  return (
    <Form
      //   {...layout}
      form={form}
      name="control-hooks"
      onFinish={onSubmit}
      style={{ maxWidth: 1000 }}
    >
      <Form.Item name="value" label="Value" rules={[{ required: true }]}>
        <TextArea
          spellCheck="false"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          showCount
          rows={8}
        />
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

export default AddRootElementForm;
