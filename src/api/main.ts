import axios from "axios";
import { Generate, SaveTree } from "./main.types";

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
