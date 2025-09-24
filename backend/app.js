import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import userRouters from "./routes/userroutes.js"
import aiRouters from "./routes/airoutes.js"
import moodRouters from "./routes/moodroutes.js"
import doctorRouters from "./routes/doctorroutes.js"

dotenv.config();

const app = express();

// Middlewares
app.use(
  cors({
    origin: "http://localhost:5173", // frontend port
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


app.use("/users" , userRouters)
app.use("/ai" , aiRouters)
app.use("/mood" , moodRouters)
app.use("/doctor" , doctorRouters)


export default app;
