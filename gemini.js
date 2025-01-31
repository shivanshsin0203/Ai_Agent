import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.Api_Key
const genAI = new GoogleGenerativeAI(apiKey);

function getWeatherDetails(city = "") {
  if (city.toLowerCase() === "mumbai") return "15 C";
  if (city.toLowerCase() === "mohali") return "11 C";
  if (city.toLowerCase() === "banglore") return "25 C";
  if (city.toLowerCase() === "delhi") return "33 C";
  if (city.toLowerCase() === "gurgoan") return "19 C";
  if (city.toLowerCase() === "kolkata") return "22 C";
}

const System_prompt = `You are an AI Assistant with START, PLAN, ACTION, OBSERVATION, and OUTPUT states.
Wait for user input and PLAN using available tools.
After Planning, take ACTION with appropriate tools and wait for OBSERVATION based on ACTION.
Once you receive OBSERVATION, generate an OUTPUT that directly resolves the user query.
Stop generating further plans or actions once the OUTPUT has been delivered. Do not proceed to further steps unless the user provides a new query.

Available tools:
- function: getWeatherDetails(city: string): string
getWeatherDetails function accepts a city name as a string and returns weather details.

**Note:** Strictly return plain JSON without any markdown formatting in a single line.
Strictly Give one JSON response at a time and wait for user input before generating the next response.
Example 1:
{"type":"user","user":"What is the weather of Mumbai?"}
{"type":"plan","plan":"I will call getWeatherDetails for Mumbai"}
{"type":"action","function":"getWeatherDetails","input":"Mumbai"}
{"type":"observation","observation":"15 C"}
{"type":"output","output":"The weather in Mumbai is 15 C."}
Example 2:
{"type":"user","user":"What is sum of weather of mumbai and delhi ?"}
{"type":"plan","plan":"I will call getWeatherDetails for mumbai"}
{"type":"action","function":"getWeatherDetails","input":"mumbai"}
{"type":"observation","observation":"15 C "}
{"type":"plan","plan":"I will call getWeatherDetails for delhi"}
{"type":"action","function":"getWeatherDetails","input":"delhi"}
{"type":"observation","observation":"33 C "}
{"type":"output","output":"The sum of weather of mumbai and delhi is 48 C"}
`;


async function test() {
  const history = [];
  const user = "What is sum of weather of mumbai an mohali  ?";
  let userQuery = JSON.stringify({ type: "user", user });
  console.log("🧑 " + user);
  console.log(history);
  try {
    while (true) {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        systemInstruction: System_prompt,
      });
      const chat = model.startChat(history);

      const chatResponse = await chat.sendMessage(userQuery);
      let result = chatResponse.response.text();
      console.log(result);
      result = result.replace(/```json|```/g, "").trim();
      const data = JSON.parse(result);
      console.log(data);

      if (data.type === "output") {
        console.log("🤖 " + data.output);
        break; // Stop further execution once the output is returned.
      } else if (data.type === "action") {
        // Execute action
        const weatherResult = getWeatherDetails(data.input);
        console.log(`Weather Result: ${weatherResult}`);

        // Send observation to the model
        const observationQuery = JSON.stringify({ type: "observation", observation: weatherResult });
        history.push({ role: "model", parts: [{ text: JSON.stringify(data) }] });
        userQuery = observationQuery;
      } else {
        // Update query and history for other types (e.g., plan)
        history.push({ role: "model", parts: [{ text: JSON.stringify(data) }] });
        userQuery = JSON.stringify(data);
      }
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

await test();
