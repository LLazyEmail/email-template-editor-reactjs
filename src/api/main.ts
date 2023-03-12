import axios from "axios";
import { AddTreeNode, Generate, SaveTree, UpdateTreeNode } from "./main.types";

export const API_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:9000"
    : `${document.location.protocol}//${document.location.hostname}:9000`;

export const generate = (data: Generate) =>
  axios.post(`${API_URL}/generate`, data).then((res) => res.data);

export const getTree = () =>
  axios.get(`${API_URL}/template-tree`).then((res) => res.data);

export const saveTree = (data: SaveTree) =>
  axios.post(`${API_URL}/save-template-tree`, data).then((res) => res.data);

export const updateTreeNode = (data: UpdateTreeNode) =>
  axios.post(`${API_URL}/update-node-tree`, data).then((res) => res.data);

export const addTreeNode = (data: AddTreeNode) =>
  axios.post(`${API_URL}/add-node-tree`, data).then((res) => res.data);
