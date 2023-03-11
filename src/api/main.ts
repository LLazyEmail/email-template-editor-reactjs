import axios from "axios";
import { Generate } from "./main.types";

export const API_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:9000"
    : `${document.location.protocol}//${document.location.hostname}:9000`;

export const generate = (data: Generate) =>
  axios.post(`${API_URL}/generate`, data);
